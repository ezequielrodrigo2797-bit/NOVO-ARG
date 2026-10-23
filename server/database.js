const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');

const ROOT = path.resolve(__dirname, '..');
const storageDir = path.join(ROOT, 'storage');
const databasePath = path.join(storageDir, 'maestra.sqlite.enc');

function encryptDatabase(plaintext, databaseKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', databaseKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([Buffer.from('EGMDB1'), iv, cipher.getAuthTag(), ciphertext]);
}

function decryptDatabase(encrypted, databaseKey) {
  if (encrypted.subarray(0, 6).toString() !== 'EGMDB1') throw new Error('La base local no tiene un formato de cifrado reconocido.');
  const iv = encrypted.subarray(6, 18);
  const tag = encrypted.subarray(18, 34);
  const ciphertext = encrypted.subarray(34);
  const decipher = crypto.createDecipheriv('aes-256-gcm', databaseKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function rows(db, sql, params = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(params);
    const result = [];
    while (statement.step()) result.push(statement.getAsObject());
    return result;
  } finally {
    statement.free();
  }
}

function saveDatabase(db, databaseKey) {
  const temporaryPath = `${databasePath}.tmp`;
  fs.writeFileSync(temporaryPath, encryptDatabase(Buffer.from(db.export()), databaseKey), { mode: 0o600 });
  fs.renameSync(temporaryPath, databasePath);
}

function createSessionStore(session, db, save) {
  return new (class SQLiteSessionStore extends session.Store {
    get(id, callback) {
      try {
        const [record] = rows(db, 'SELECT session_json, expires_at FROM sessions WHERE session_id = ?', [id]);
        if (!record || record.expires_at <= Date.now()) {
          if (record) {
            db.run('DELETE FROM sessions WHERE session_id = ?', [id]);
            save();
          }
          return callback(null, null);
        }
        callback(null, JSON.parse(record.session_json));
      } catch (error) {
        callback(error);
      }
    }

    set(id, value, callback = () => {}) {
      try {
        const expiresAt = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000;
        db.run('INSERT INTO sessions (session_id, session_json, expires_at) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET session_json = excluded.session_json, expires_at = excluded.expires_at', [id, JSON.stringify(value), expiresAt]);
        save();
        callback(null);
      } catch (error) {
        callback(error);
      }
    }

    touch(id, value, callback = () => {}) {
      try {
        const expiresAt = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000;
        db.run('UPDATE sessions SET expires_at = ? WHERE session_id = ?', [expiresAt, id]);
        save();
        callback(null);
      } catch (error) {
        callback(error);
      }
    }

    destroy(id, callback = () => {}) {
      try {
        db.run('DELETE FROM sessions WHERE session_id = ?', [id]);
        save();
        callback(null);
      } catch (error) {
        callback(error);
      }
    }
  })();
}

async function initializeDatabase({ passwordHash, databaseKey }) {
  fs.mkdirSync(storageDir, { recursive: true, mode: 0o700 });
  const SQL = await initSqlJs();
  const db = fs.existsSync(databasePath)
    ? new SQL.Database(decryptDatabase(fs.readFileSync(databasePath), databaseKey))
    : new SQL.Database();

  db.run('PRAGMA foreign_keys = ON');
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT NOT NULL CHECK(record_type IN ('installation', 'assignment', 'stock', 'non_egm')),
      source_key TEXT UNIQUE,
      client TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      province TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      status TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS upgrades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      session_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_machines_record_type ON machines(record_type);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
  db.run('INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)');

  const [users] = rows(db, 'SELECT COUNT(*) AS count FROM users');
  if (users.count === 0) {
    const { BOOTSTRAP_USERNAME, BOOTSTRAP_PASSWORD } = process.env;
    if (!BOOTSTRAP_USERNAME || !BOOTSTRAP_PASSWORD) {
      throw new Error('Falta BOOTSTRAP_USERNAME o BOOTSTRAP_PASSWORD en el archivo .env local.');
    }
    db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [BOOTSTRAP_USERNAME, passwordHash, 'admin']);
  }

  const [machineCount] = rows(db, 'SELECT COUNT(*) AS count FROM machines');
  if (machineCount.count === 0) {
    const source = require('../data/maestra');
    const add = (type, key, item, client, location, province, omitKeys) => {
      const details = Object.fromEntries(Object.entries(item).filter(([field]) => !omitKeys.includes(field)));
      db.run('INSERT INTO machines (record_type, source_key, client, location, province, model, quantity, status, details_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [type, key, client || '', location || '', province || '', item.model || item.category, item.quantity, item.status, JSON.stringify(details)]);
    };
    source.installations.forEach(item => add('installation', `INST-${item.sourceRow}`, item, item.client, item.location, item.province, ['client', 'location', 'province', 'model', 'quantity', 'status', 'sourceRow']));
    source.assignments.forEach(item => add('assignment', item.sourceId, item, item.client, item.location, '', ['client', 'location', 'model', 'quantity', 'status', 'sourceId']));
    source.stockEgm.forEach(item => add('stock', item.sourceId, item, item.destination || 'Stock', item.destination || 'Stock', '', ['model', 'quantity', 'status', 'sourceId']));
    source.nonEgm.forEach(item => add('non_egm', item.sourceId, item, 'NOVOMATIC Argentina', 'Stock', '', ['model', 'quantity', 'status', 'sourceId']));
    source.upgrades.forEach(item => db.run('INSERT INTO upgrades (source_key, details_json) VALUES (?, ?)', [item.id, JSON.stringify(item)]));
  }

  db.run('DELETE FROM sessions WHERE expires_at <= ?', [Date.now()]);
  saveDatabase(db, databaseKey);
  return { db, save: () => saveDatabase(db, databaseKey), sessionStore: createSessionStore(require('express-session'), db, () => saveDatabase(db, databaseKey)) };
}

module.exports = { initializeDatabase, rows };
