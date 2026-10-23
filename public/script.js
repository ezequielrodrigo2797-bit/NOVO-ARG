const fmt = new Intl.NumberFormat('es-AR');
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();
const display = value => value ? escapeHTML(value) : '—';
let csrfToken = '';
let data = null;
let installations = [];
let assignments = [];
let stock = [];
let nonEgm = [];
let upgrades = [];
let machineGroups = [];
let totals = {};

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set('Content-Type', 'application/json');
  if (csrfToken && options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && url !== '/api/auth/login') showLogin();
    throw new Error(payload.error || 'No se pudo completar la solicitud.');
  }
  if (payload.csrfToken) csrfToken = payload.csrfToken;
  return payload;
}

function showLogin(message = '') {
  $('#appShell').hidden = true;
  $('#loginScreen').hidden = false;
  const error = $('#loginError');
  error.textContent = message;
  error.hidden = !message;
}

function showApp(user) {
  $('#loginScreen').hidden = true;
  $('#appShell').hidden = false;
  $('#accountName').textContent = user.username;
  $('#accountInitial').textContent = user.username.slice(0, 1).toLocaleUpperCase('es-AR');
}

function sum(rows, key = 'quantity') {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function configureData(source) {
  data = source;
  installations = data.installations;
  assignments = data.assignments;
  stock = data.stockEgm;
  nonEgm = data.nonEgm;
  upgrades = data.upgrades;
  totals = {
    operational: sum(installations),
    assigned: sum(assignments),
    stockEgm: sum(stock),
    nonEgm: sum(nonEgm),
    upgradeUnits: sum(upgrades),
    totalEgm: sum(installations) + sum(assignments) + sum(stock)
  };
  totals.stockUnassignedOrPreparation = sum(stock.filter(row => row.status === 'Stock sin destino' || row.status === 'Stock / preparación'));
  totals.newStock = sum(stock.filter(row => row.status === 'Nuevo ingreso a stock'));
  totals.packRubyPreparation = sum(stock, 'preparationQuantity');
  totals.packRubyNoDestination = sum(stock, 'noDestinationQuantity');
  totals.packRubyTotal = totals.packRubyPreparation + totals.packRubyNoDestination;
  totals.stockGeneral = totals.stockEgm + totals.assigned + totals.nonEgm;
  machineGroups = [
    ...installations.map(row => ({ ...row, origin: 'Instalaciones', detail: [row.package, row.signage, row.game, row.linked === 'Sí' ? 'Linkeado' : '', row.islands ? `${row.islands} isla(s)` : '', row.date ? `Instalación ${row.date}` : '', row.notes].filter(Boolean).join(' · ') })),
    ...assignments.map(row => ({ ...row, origin: 'Pipeline', detail: [row.game, row.signage, row.notes].filter(Boolean).join(' · ') })),
    ...stock.map(row => ({ ...row, client: row.destination || 'Sin destino', location: row.destination || 'Stock', origin: row.sourceId, detail: [row.condition, row.game, row.signage, row.notes].filter(Boolean).join(' · ') }))
  ];
}

function badge(status) {
  const type = status === 'Operativa' ? 'green' : status.includes('Asignado') ? 'blue' : status.includes('preparación') ? 'violet' : status.includes('Stock') || status.includes('ingreso') ? 'amber' : 'blue';
  return `<span class="badge badge-${type}">${escapeHTML(status)}</span>`;
}

function fillMetrics() {
  $$('[data-metric]').forEach(node => {
    const key = node.dataset.metric;
    if (key in totals) node.textContent = fmt.format(totals[key]);
  });
  $$('[data-percent]').forEach(node => {
    const value = (totals[node.dataset.percent] || 0) / totals.totalEgm * 100;
    node.textContent = `${value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  });
  const count = $('.nav-count');
  if (count) count.textContent = fmt.format(totals.totalEgm);
  const groupTotal = $('#machineGroupTotal');
  if (groupTotal) groupTotal.textContent = fmt.format(machineGroups.length);
  const donut = $('#inventoryDonut');
  if (donut && totals.totalEgm) {
    const operationalEnd = totals.operational / totals.totalEgm * 100;
    const assignedEnd = operationalEnd + totals.assigned / totals.totalEgm * 100;
    donut.style.background = `conic-gradient(var(--green) 0 ${operationalEnd}%,var(--blue) ${operationalEnd}% ${assignedEnd}%,var(--amber) ${assignedEnd}% 100%)`;
  }
  $('#installationGroupCount').textContent = `${fmt.format(installations.length)} grupos`;
  $('#upgradeCount').textContent = `${fmt.format(upgrades.length)} registro(s) en la fuente`;
  const sourceDate = $('[data-source-date]');
  if (sourceDate) sourceDate.textContent = new Date(data.source.workbookDate + 'T00:00:00').toLocaleDateString('es-AR');
  $$('[data-group-count]').forEach(node => { node.textContent = fmt.format(node.dataset.groupCount === 'installations' ? installations.length : machineGroups.length); });
  if (upgrades[0]) $('[data-upgrade-date]').textContent = new Date(upgrades[0].date + 'T00:00:00').toLocaleDateString('es-AR');
}

function machineRow(row) {
  const action = `<div class="row-actions"><button class="table-action" data-edit-id="${row.id}" type="button">Editar</button><button class="table-action danger" data-delete-id="${row.id}" type="button">Eliminar</button></div>`;
  return `<tr><td><b>${display(row.client)}</b></td><td>${display(row.location)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.origin || row.sourceId)}${row.detail ? ` · ${escapeHTML(row.detail)}` : ''}</td><td>${action}</td></tr>`;
}

function installationRow(row) {
  const packageSignage = [row.package, row.signage].filter(Boolean).join(' · ');
  const game = [row.game, row.linked === 'Sí' ? 'Sí' : ''].filter(Boolean).join(' · ');
  const note = [row.islands ? `${row.islands} isla(s)` : '', row.date ? `Instalación ${row.date}` : '', row.notes].filter(Boolean).join(' · ');
  return `<tr><td><b>${display(row.client)}</b></td><td>${display(row.location)}</td><td>${display(row.province)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display(packageSignage)}</td><td>${display(game)}</td><td>${badge(row.status)}${note ? `<small class="cell-note">${escapeHTML(note)}</small>` : ''}</td></tr>`;
}

function stockRow(row) {
  const tech = [row.game, row.signage, row.linked === 'Sí' ? 'Linkeado' : ''].filter(Boolean).join(' · ');
  const sourceClass = row.sourceClass === 'Gaming cabinet' ? 'Gaming cabinet · incluido como EGM en Resumen' : row.sourceClass;
  return `<tr><td><b>${display(row.sourceId)}</b></td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.condition)}</td><td>${display(tech)}</td><td>${display([sourceClass, row.notes].filter(Boolean).join(' · '))}</td></tr>`;
}

function nonEgmRow(row) {
  return `<tr><td><b>${display(row.sourceId)}</b></td><td>${display(row.model)}</td><td>${display(row.category)}</td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td><div class="row-actions"><button class="table-action" data-edit-id="${row.id}" type="button">Editar</button><button class="table-action danger" data-delete-id="${row.id}" type="button">Eliminar</button></div></td></tr>`;
}

function assignmentRow(row) {
  return `<tr><td><b>${display(row.sourceId)}</b></td><td>${display(row.client)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display([row.game, row.signage].filter(Boolean).join(' · '))}</td><td>${display([row.location, row.date].filter(Boolean).join(' · '))}</td><td>${badge(row.status)}${row.notes ? `<small class="cell-note">${escapeHTML(row.notes)}</small>` : ''}</td></tr>`;
}

function upgradeRow(row) {
  return `<tr><td><b>${display(row.id)}</b></td><td>${display(row.client)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display(row.from)}</td><td>${display(row.to)}</td><td>${display(row.game)}</td><td>${badge(row.status)} <small class="cell-note">${escapeHTML(row.date)}</small></td><td>${display(row.notes)}</td></tr>`;
}

function setEmpty(tbody, colspan, message) {
  tbody.innerHTML = `<tr><td colspan="${colspan}" class="row-empty">${escapeHTML(message)}</td></tr>`;
}

function sorted(rows, key) {
  return [...rows].sort((a, b) => key === 'quantity' ? b.quantity - a.quantity : String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'es', { sensitivity: 'base' }));
}

function filtered(rows, term, keys) {
  const query = normalize(term);
  return rows.filter(row => !query || keys.some(key => normalize(row[key]).includes(query)));
}

function renderMachines() {
  const status = $('#machineStatusFilter').value;
  const term = $('#machineSearch').value;
  const sort = $('#machineSort').value || 'client';
  const rows = sorted(machineGroups.filter(row => (!status || row.status === status) && (!normalize(term) || normalize(Object.values(row).join(' ')).includes(normalize(term)))), sort);
  const tbody = $('#machineRows');
  if (rows.length) tbody.innerHTML = rows.map(machineRow).join('');
  else setEmpty(tbody, 7, 'No hay registros que coincidan con la búsqueda.');
  $('#machineRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows))} EGM en el filtro`;
}

function renderInstallations() {
  const term = $('#installSearch').value;
  const province = $('#provinceFilter').value;
  const sort = $('#installSort').value || 'client';
  const rows = sorted(filtered(installations.filter(row => !province || row.province === province), term, ['client', 'location', 'province', 'model', 'package', 'signage', 'game', 'status', 'notes']), sort);
  const tbody = $('#installationRows');
  if (rows.length) tbody.innerHTML = rows.map(installationRow).join('');
  else setEmpty(tbody, 8, 'No hay instalaciones que coincidan.');
  $('#installationRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows))} EGM operativas`;
}

function renderStock() {
  const term = $('#stockSearch').value;
  const status = $('#stockStatusFilter').value;
  const rows = filtered(stock.filter(row => !status || row.status === status), term, ['sourceId', 'model', 'status', 'condition', 'destination', 'game', 'signage', 'notes', 'sourceClass']);
  const tbody = $('#stockRows');
  if (rows.length) tbody.innerHTML = rows.map(stockRow).join('');
  else setEmpty(tbody, 7, 'No hay lotes que coincidan.');
  $('#stockRowCount').textContent = `${fmt.format(rows.length)} lotes · ${fmt.format(sum(rows))} EGM según Resumen`;
  $('#nonEgmRows').innerHTML = nonEgm.map(nonEgmRow).join('');
}

function renderAssignments() {
  const rows = filtered(assignments, $('#assignmentSearch').value, ['sourceId', 'client', 'model', 'game', 'signage', 'location', 'date', 'status', 'notes']);
  const tbody = $('#assignmentRows');
  if (rows.length) tbody.innerHTML = rows.map(assignmentRow).join('');
  else setEmpty(tbody, 7, 'No hay asignaciones que coincidan.');
  $('#assignmentRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows))} EGM asignadas`;
}

function renderUpgrades() {
  const rows = filtered(upgrades, $('#upgradeSearch').value, ['id', 'client', 'model', 'from', 'to', 'game', 'type', 'date', 'status', 'notes']);
  const tbody = $('#upgradeRows');
  if (rows.length) tbody.innerHTML = rows.map(upgradeRow).join('');
  else setEmpty(tbody, 9, 'No hay upgrades que coincidan.');
  $('#upgradeRowCount').textContent = `${fmt.format(rows.length)} registro(s) · ${fmt.format(sum(rows))} máquinas en el historial; no se suman al inventario`;
}

function renderHome() {
  const rows = sorted(machineGroups, 'quantity').slice(0, 6);
  $('#recentRows').innerHTML = rows.map(row => `<tr><td><b>${display(row.client)}</b></td><td>${display(row.location)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.origin || row.sourceId)}</td></tr>`).join('');
}

function renderAll() {
  fillMetrics();
  renderHome();
  renderMachines();
  renderInstallations();
  renderStock();
  renderAssignments();
  renderUpgrades();
}

function exportRows(view) {
  if (view === 'installations') return filtered(installations.filter(row => !$('#provinceFilter').value || row.province === $('#provinceFilter').value), $('#installSearch').value, ['client', 'location', 'province', 'model', 'package', 'signage', 'game', 'status', 'notes']).map(row => ({ Cliente: row.client, Ubicacion: row.location, Provincia: row.province, Modelo: row.model, Cantidad: row.quantity, Paquete: row.package, Carteleria: row.signage, Juego: row.game, Linkeado: row.linked, Estado: row.status, Fecha: row.date, Observaciones: row.notes }));
  if (view === 'stock') return filtered(stock.filter(row => !$('#stockStatusFilter').value || row.status === $('#stockStatusFilter').value), $('#stockSearch').value, ['sourceId', 'model', 'status', 'condition', 'game', 'signage', 'notes', 'sourceClass']).map(row => ({ Lote: row.sourceId, Modelo: row.model, Cantidad: row.quantity, Estado: row.status, Condicion: row.condition, ClaseOrigen: row.sourceClass, Juego: row.game, Carteleria: row.signage, Notas: row.notes }));
  if (view === 'assignments') return filtered(assignments, $('#assignmentSearch').value, ['sourceId', 'client', 'model', 'game', 'signage', 'location', 'date', 'status', 'notes']).map(row => ({ Lote: row.sourceId, Cliente: row.client, Modelo: row.model, Cantidad: row.quantity, Juego: row.game, Carteleria: row.signage, Sala: row.location, Fecha: row.date, Estado: row.status, Observaciones: row.notes }));
  if (view === 'upgrades') return filtered(upgrades, $('#upgradeSearch').value, ['id', 'client', 'model', 'from', 'to', 'game', 'type', 'date', 'status', 'notes']).map(row => ({ ID: row.id, Cliente: row.client, Modelo: row.model, Cantidad: row.quantity, PlataformaAnterior: row.from, PlataformaNueva: row.to, Juego: row.game, Fecha: row.date, Estado: row.status, Observaciones: row.notes }));
  const term = $('#machineSearch').value;
  const status = $('#machineStatusFilter').value;
  const sort = $('#machineSort').value || 'client';
  return sorted(machineGroups.filter(row => (!status || row.status === status) && (!normalize(term) || normalize(Object.values(row).join(' ')).includes(normalize(term)))), sort).map(row => ({ Cliente: row.client, Ubicacion: row.location, Modelo: row.model, Cantidad: row.quantity, Estado: row.status, Origen: row.origin || row.sourceId, Detalle: row.detail }));
}

function exportCSV(view) {
  const rows = exportRows(view);
  if (!rows.length) return showToast('No hay filas para exportar.');
  const headers = Object.keys(rows[0]);
  const lines = [headers, ...rows.map(row => headers.map(key => row[key] ?? ''))].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `novomatic-egm-${view}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(`CSV exportado: ${fmt.format(rows.length)} filas filtradas.`);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function setView(view, scroll = true) {
  const page = document.querySelector(`.page-view[data-page="${view}"]`);
  if (!page) return;
  $$('.page-view').forEach(item => item.classList.toggle('active', item === page));
  $$('.nav-link[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  const nav = $(`.nav-link[data-view="${view}"]`);
  const label = nav?.cloneNode(true);
  label?.querySelectorAll('.nav-icon,.nav-count').forEach(item => item.remove());
  $('#breadcrumbTitle').textContent = label?.textContent.trim() || page.querySelector('h1')?.textContent || 'Panel general';
  $('#sidebar').classList.remove('open');
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setField(form, name, value) {
  form.elements[name].value = value ?? '';
}

function updateStatusOptions(form, selected = '') {
  const statuses = {
    installation: ['Operativa'],
    assignment: ['Asignado / pendiente de instalación'],
    stock: ['Stock sin destino', 'Stock / preparación', 'Nuevo ingreso a stock'],
    non_egm: ['Stock sin destino']
  }[form.elements.recordType.value];
  form.elements.status.replaceChildren(...statuses.map(status => new Option(status, status)));
  form.elements.status.value = statuses.includes(selected) ? selected : statuses[0];
}

function openRecord(record) {
  const form = $('#recordForm');
  form.reset();
  $('#recordError').hidden = true;
  setField(form, 'id', record?.id || '');
  setField(form, 'recordType', record?.recordType || 'installation');
  updateStatusOptions(form, record?.status || 'Operativa');
  setField(form, 'client', record?.client || '');
  setField(form, 'location', record?.location || '');
  setField(form, 'province', record?.province || '');
  setField(form, 'model', record?.model || '');
  setField(form, 'category', record?.category || '');
  setField(form, 'quantity', record?.quantity || 1);
  setField(form, 'game', record?.game || '');
  setField(form, 'signage', record?.signage || '');
  setField(form, 'notes', record?.notes || '');
  $('#dialogTitle').textContent = record ? 'Editar registro' : 'Nueva máquina';
  $('#recordDialog').showModal();
}

async function loadMaestra() {
  configureData(await request('/api/maestra'));
  const provinceSelect = $('#provinceFilter');
  provinceSelect.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());
  [...new Set(installations.map(row => row.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceSelect.append(option);
  });
  renderAll();
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = $('#loginError');
  const button = form.querySelector('button[type="submit"]');
  error.hidden = true;
  button.disabled = true;
  try {
    const response = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: form.elements.username.value.trim(), password: form.elements.password.value }) });
    form.reset();
    showApp(response.user);
    await loadMaestra();
  } catch (problem) {
    error.textContent = problem.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
  }
}

function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  const toggle = $('#themeToggle');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
  toggle.querySelector('.theme-toggle-icon').textContent = isDark ? '☀' : '☾';
  toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  $('meta[name="theme-color"]').content = isDark ? '#0d1522' : '#101b2d';
}

async function start() {
  $$('.nav-link[data-view]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const view = link.dataset.view;
    if (location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
    setView(view);
  }));
  window.addEventListener('popstate', () => setView(location.hash.slice(1) || 'inicio', false));
  $('#loginForm').addEventListener('submit', login);
  $('#machineSearch').addEventListener('input', renderMachines);
  $('#machineStatusFilter').addEventListener('change', renderMachines);
  $('#machineSort').addEventListener('change', renderMachines);
  $('#installSearch').addEventListener('input', renderInstallations);
  $('#provinceFilter').addEventListener('change', renderInstallations);
  $('#installSort').addEventListener('change', renderInstallations);
  $('#stockSearch').addEventListener('input', renderStock);
  $('#stockStatusFilter').addEventListener('change', renderStock);
  $('#assignmentSearch').addEventListener('input', renderAssignments);
  $('#upgradeSearch').addEventListener('input', renderUpgrades);
  $$('[data-export]').forEach(button => button.addEventListener('click', () => exportCSV(button.dataset.export || 'machines')));
  $('#newRecordButton').addEventListener('click', () => openRecord(null));
  $('#appShell').addEventListener('click', async event => {
    const editButton = event.target.closest('[data-edit-id]');
    const deleteButton = event.target.closest('[data-delete-id]');
    if (editButton) {
      const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(editButton.dataset.editId));
      if (record) openRecord(record);
    }
    if (deleteButton) {
      const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(deleteButton.dataset.deleteId));
      if (!record || !window.confirm(`¿Eliminar ${record.model} (${record.quantity}) de la base de datos?`)) return;
      try {
        await request(`/api/records/${record.id}`, { method: 'DELETE' });
        await loadMaestra();
        showToast('Registro eliminado de la base de datos.');
      } catch (error) { showToast(error.message); }
    }
  });
  $('#recordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const id = values.get('id');
    const input = Object.fromEntries(values.entries());
    input.quantity = Number(input.quantity);
    const errorBox = $('#recordError');
    const button = form.querySelector('button[type="submit"]');
    errorBox.hidden = true;
    button.disabled = true;
    try {
      await request(id ? `/api/records/${id}` : '/api/records', { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) });
      $('#recordDialog').close();
      await loadMaestra();
      showToast(id ? 'Cambios guardados en la base de datos.' : 'Máquina agregada a la base de datos.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally { button.disabled = false; }
  });
  $('#recordForm').elements.recordType.addEventListener('change', event => updateStatusOptions(event.currentTarget.form));
  $('#logoutButton').addEventListener('click', async () => {
    try { await request('/api/auth/logout', { method: 'POST', body: '{}' }); } catch { /* La sesión puede haber vencido. */ }
    showLogin();
  });
  $('#changePasswordButton').addEventListener('click', () => { $('#passwordForm').reset(); $('#passwordError').hidden = true; $('#passwordDialog').showModal(); });
  $('#passwordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorBox = $('#passwordError');
    const values = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    errorBox.hidden = true;
    button.disabled = true;
    try {
      const response = await request('/api/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: values.get('currentPassword'), newPassword: values.get('newPassword') }) });
      csrfToken = response.csrfToken;
      $('#passwordDialog').close();
      showToast('Contraseña actualizada; las demás sesiones se cerraron.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally { button.disabled = false; }
  });
  $('#closeDialog').addEventListener('click', () => $('#recordDialog').close());
  $('#cancelDialog').addEventListener('click', () => $('#recordDialog').close());
  $('#closePasswordDialog').addEventListener('click', () => $('#passwordDialog').close());
  $('#cancelPasswordDialog').addEventListener('click', () => $('#passwordDialog').close());
  $('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#recordDialog').addEventListener('click', event => { if (event.target === $('#recordDialog')) $('#recordDialog').close(); });
  $('#passwordDialog').addEventListener('click', event => { if (event.target === $('#passwordDialog')) $('#passwordDialog').close(); });
  $('#themeToggle').addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark-mode');
    applyTheme(dark);
    try { localStorage.setItem('novomatic-egm-theme', dark ? 'dark' : 'light'); } catch { /* El modo sigue activo durante esta sesión. */ }
  });
  let savedDark = false;
  try { savedDark = localStorage.getItem('novomatic-egm-theme') === 'dark'; } catch { /* Preferencia local opcional. */ }
  applyTheme(savedDark);

  try {
    const sessionState = await request('/api/auth/session');
    if (!sessionState.authenticated) return showLogin();
    showApp(sessionState.user);
    setView(location.hash.slice(1) || 'inicio', false);
    await loadMaestra();
  } catch (error) { showLogin(error.message); }
}

start();
