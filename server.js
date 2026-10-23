require('dotenv').config();

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { hash, verify, Algorithm } = require('@node-rs/argon2');
const { initializeDatabase, rows } = require('./server/database');

const PORT = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const databaseKey = Buffer.from(process.env.DATABASE_KEY || '', 'base64url');
const usernamePattern = /^[a-zA-Z0-9._-]{3,40}$/;
const passwordOptions = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const root = __dirname;
const staticPath = path.join(root, 'public');

function appError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendError(res, error) {
  const status = Number(error.status) || 500;
  res.status(status).json({ error: status === 500 ? 'Ocurrió un error interno.' : error.message });
}

function sameOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === req.get('host') && new URL(origin).protocol === `${req.protocol}:`;
  } catch {
    return false;
  }
}

function requireCsrf(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
  if (!sameOrigin(req) || !req.session.csrfToken || req.get('x-csrf-token') !== req.session.csrfToken) {
    return res.status(403).json({ error: 'La sesión de seguridad venció. Volvé a ingresar.' });
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
  next();
}

function validateMachine(input) {
  const allowedTypes = ['installation', 'assignment', 'stock', 'non_egm'];
  const statusesByType = {
    installation: ['Operativa'],
    assignment: ['Asignado / pendiente de instalación'],
    stock: ['Stock sin destino', 'Stock / preparación', 'Nuevo ingreso a stock'],
    non_egm: ['Stock sin destino']
  };
  const recordType = String(input.recordType || '');
  const allowedStatuses = statusesByType[recordType] || [];
  const model = String(input.model || '').trim();
  const quantity = Number(input.quantity);
  const status = String(input.status || '').trim();
  if (!allowedTypes.includes(recordType)) throw appError(400, 'Elegí un tipo de registro válido.');
  if (!model || model.length > 120) throw appError(400, 'El modelo es obligatorio y admite hasta 120 caracteres.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) throw appError(400, 'La cantidad debe ser un entero entre 1 y 10000.');
  if (!allowedStatuses.includes(status)) throw appError(400, 'Elegí un estado válido.');
  const text = key => String(input[key] || '').trim().slice(0, key === 'notes' ? 2000 : 180);
  const details = { notes: text('notes'), game: text('game'), signage: text('signage'), category: text('category') };
  return {
    recordType,
    client: text('client'),
    location: text('location'),
    province: text('province'),
    model,
    quantity,
    status,
    details
  };
}

function audit(db, userId, action, entityId) {
  db.run('INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)', [userId, action, 'machine', entityId]);
}

function recordView(row) {
  const details = JSON.parse(row.details_json || '{}');
  const record = { ...details, id: row.id, recordType: row.record_type, client: row.client, location: row.location, province: row.province, model: row.model, quantity: row.quantity, status: row.status, sourceId: row.source_key || undefined };
  if (row.source_key?.startsWith('INST-')) record.sourceRow = Number(row.source_key.slice(5));
  return record;
}

function buildMaestra(db) {
  const machineRows = rows(db, 'SELECT * FROM machines ORDER BY id');
  const mapped = machineRows.map(recordView);
  const upgrades = rows(db, 'SELECT details_json FROM upgrades ORDER BY id').map(row => JSON.parse(row.details_json));
  const source = require('./data/maestra');
  return {
    source: source.source,
    installations: mapped.filter(row => row.recordType === 'installation'),
    assignments: mapped.filter(row => row.recordType === 'assignment'),
    stockEgm: mapped.filter(row => row.recordType === 'stock'),
    nonEgm: mapped.filter(row => row.recordType === 'non_egm'),
    upgrades
  };
}

async function main() {
  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    throw new Error('SESSION_SECRET debe existir en .env y contener al menos 32 bytes.');
  }
  if (databaseKey.length !== 32) throw new Error('DATABASE_KEY debe existir en .env y decodificar a 32 bytes.');
  const bootstrapHash = await hash(process.env.BOOTSTRAP_PASSWORD || crypto.randomBytes(32).toString('base64url'), passwordOptions);
  const { db, save, sessionStore } = await initializeDatabase({ passwordHash: bootstrapHash, databaseKey });
  const app = express();
  app.disable('x-powered-by');
  if (production) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    }
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(session({
    name: production ? '__Host-novomatic.sid' : 'novomatic.sid',
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 }
  }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/auth/session', (req, res) => {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
    if (!req.session.userId) return res.json({ authenticated: false, csrfToken: req.session.csrfToken });
    const [user] = rows(db, 'SELECT id, username, email, role FROM users WHERE id = ? AND is_active = 1', [req.session.userId]);
    if (!user) return req.session.destroy(() => res.json({ authenticated: false, csrfToken: crypto.randomBytes(32).toString('base64url') }));
    res.json({ authenticated: true, user, csrfToken: req.session.csrfToken });
  });

  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.' } });
  app.post('/api/auth/login', loginLimiter, async (req, res, next) => {
    try {
      if (!sameOrigin(req)) throw appError(403, 'Origen de solicitud no permitido.');
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');
      if (!usernamePattern.test(username) || !password || password.length > 256) {
        throw appError(401, 'Usuario o contraseña incorrectos.');
      }
      const [user] = rows(db, 'SELECT id, username, email, role, password_hash FROM users WHERE username = ? COLLATE NOCASE AND is_active = 1', [username]);
      const valid = user ? await verify(user.password_hash, password) : await verify(bootstrapHash, password);
      if (!user || !valid) throw appError(401, 'Usuario o contraseña incorrectos.');
      await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      req.session.userId = user.id;
      req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
      await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
      res.json({ authenticated: true, user: { id: user.id, username: user.username, email: user.email, role: user.role }, csrfToken: req.session.csrfToken });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', requireCsrf, (req, res, next) => {
    req.session.destroy(error => {
      if (error) return next(error);
      res.clearCookie(production ? '__Host-novomatic.sid' : 'novomatic.sid', { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
      res.status(204).end();
    });
  });

  app.post('/api/auth/password', requireCsrf, async (req, res, next) => {
    try {
      const oldPassword = String(req.body?.currentPassword || '');
      const newPassword = String(req.body?.newPassword || '');
      if (newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 128) throw appError(400, 'La nueva contraseña debe tener entre 12 y 128 bytes.');
      const [user] = rows(db, 'SELECT id, password_hash FROM users WHERE id = ? AND is_active = 1', [req.session.userId]);
      if (!user || !(await verify(user.password_hash, oldPassword))) throw appError(400, 'La contraseña actual no es correcta.');
      const nextHash = await hash(newPassword, passwordOptions);
      db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextHash, user.id]);
      db.run('DELETE FROM sessions WHERE session_id <> ?', [req.sessionID]);
      audit(db, user.id, 'password_changed', null);
      save();
      req.session.regenerate(error => {
        if (error) return next(error);
        req.session.userId = user.id;
        req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
        req.session.save(saveError => {
          if (saveError) return next(saveError);
          res.json({ ok: true, csrfToken: req.session.csrfToken });
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/maestra', requireAuth, (req, res) => res.json(buildMaestra(db)));

  app.post('/api/records', requireCsrf, (req, res, next) => {
    try {
      const record = validateMachine(req.body);
      db.run('INSERT INTO machines (record_type, client, location, province, model, quantity, status, details_json, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [record.recordType, record.client, record.location, record.province, record.model, record.quantity, record.status, JSON.stringify(record.details), req.session.userId, req.session.userId]);
      const [created] = rows(db, 'SELECT last_insert_rowid() AS id');
      audit(db, req.session.userId, 'machine_created', created.id);
      save();
      res.status(201).json({ id: created.id });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/records/:id', requireCsrf, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const record = validateMachine(req.body);
      const existing = rows(db, 'SELECT id FROM machines WHERE id = ?', [id])[0];
      if (!existing) throw appError(404, 'No se encontró el registro.');
      const [current] = rows(db, 'SELECT details_json FROM machines WHERE id = ?', [id]);
      const details = { ...JSON.parse(current.details_json || '{}'), ...record.details };
      db.run('UPDATE machines SET record_type = ?, client = ?, location = ?, province = ?, model = ?, quantity = ?, status = ?, details_json = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [record.recordType, record.client, record.location, record.province, record.model, record.quantity, record.status, JSON.stringify(details), req.session.userId, id]);
      audit(db, req.session.userId, 'machine_updated', id);
      save();
      res.json({ id });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/records/:id', requireCsrf, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = rows(db, 'SELECT id FROM machines WHERE id = ?', [id])[0];
      if (!existing) throw appError(404, 'No se encontró el registro.');
      audit(db, req.session.userId, 'machine_deleted', id);
      db.run('DELETE FROM machines WHERE id = ?', [id]);
      save();
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/', (_req, res, next) => {
    res.sendFile('index.html', { root: staticPath }, error => {
      if (error) next(error);
    });
  });
  app.use(express.static(staticPath, { dotfiles: 'deny', index: false, maxAge: production ? '1h' : 0 }));
  app.get('/{*splat}', (_req, res, next) => {
    res.sendFile('index.html', { root: staticPath }, error => {
      if (error) next(error);
    });
  });
  app.use((error, _req, res, _next) => {
    if (Number(error.status) === 401) return sendError(res, error);
    if (Number(error.status) && Number(error.status) < 500) return sendError(res, error);
    console.error('Request failed:', error.message);
    sendError(res, error);
  });

  app.listen(PORT, '127.0.0.1', () => console.log(`NOVOMATIC EGM disponible en http://127.0.0.1:${PORT}`));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
