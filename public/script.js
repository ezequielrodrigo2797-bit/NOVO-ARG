const fmt = new Intl.NumberFormat('es-AR');
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();
const display = value => value ? escapeHTML(value) : '—';
const padDatePart = value => String(value).padStart(2, '0');

function parseDateParts(value) {
  const raw = String(value ?? '').trim();
  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let year, month, day;
  if (match) [, year, month, day] = match.map(Number);
  else {
    match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    [, day, month, year] = match.map(Number);
  }
  month -= 1;
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? { year, month, day } : null;
}

function formatDateDisplay(value) {
  const parts = parseDateParts(value);
  return parts ? `${padDatePart(parts.day)}/${padDatePart(parts.month + 1)}/${parts.year}` : String(value ?? '');
}

function datePartsToISO({ year, month, day }) {
  return `${year}-${padDatePart(month + 1)}-${padDatePart(day)}`;
}

function setDatePickerValue(value) {
  const field = $('#datePickerInput');
  const raw = String(value ?? '').trim();
  const parts = parseDateParts(raw);
  if (parts) {
    field.value = formatDateDisplay(raw);
    field.dataset.isoDate = datePartsToISO(parts);
    datePickerView = { year: parts.year, month: parts.month };
  } else if (raw) {
    field.value = raw;
    field.dataset.isoDate = raw;
    datePickerView = { year: new Date().getFullYear(), month: new Date().getMonth() };
  } else {
    field.value = '';
    field.dataset.isoDate = '';
    datePickerView = { year: new Date().getFullYear(), month: new Date().getMonth() };
  }
  renderDatePicker();
}

function setDatePickerOpen(open) {
  const popover = $('#datePickerPopover');
  popover.hidden = !open;
  $('#datePickerToggle').setAttribute('aria-expanded', String(open));
  if (open) renderDatePicker();
}

function renderDatePicker() {
  const monthSelect = $('#datePickerMonth');
  const yearSelect = $('#datePickerYear');
  if (!monthSelect || !yearSelect) return;
  monthSelect.value = String(datePickerView.month);
  yearSelect.value = String(datePickerView.year);
  const days = $('#datePickerDays');
  const firstOffset = (new Date(datePickerView.year, datePickerView.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(datePickerView.year, datePickerView.month + 1, 0).getDate();
  const selected = parseDateParts($('#datePickerInput').dataset.isoDate);
  const today = new Date();
  const cells = Array.from({ length: firstOffset }, () => '<span class="calendar-day-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isSelected = selected?.year === datePickerView.year && selected.month === datePickerView.month && selected.day === day;
    const isToday = today.getFullYear() === datePickerView.year && today.getMonth() === datePickerView.month && today.getDate() === day;
    const classes = ['calendar-day', isSelected ? 'selected' : '', isToday ? 'today' : ''].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${classes}" data-calendar-day="${day}" aria-pressed="${isSelected}" aria-label="Elegir ${day} de ${monthSelect.options[datePickerView.month].text} de ${datePickerView.year}">${day}</button>`);
  }
  while (cells.length < 42) cells.push('<span class="calendar-day-empty" aria-hidden="true"></span>');
  days.innerHTML = cells.join('');
}

function setupDatePicker() {
  const monthSelect = $('#datePickerMonth');
  const yearSelect = $('#datePickerYear');
  const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long' });
  monthSelect.replaceChildren(...Array.from({ length: 12 }, (_, month) => new Option(monthFormatter.format(new Date(2020, month, 1)), String(month))));
  const lastYear = Math.max(2100, new Date().getFullYear() + 30);
  yearSelect.replaceChildren(...Array.from({ length: lastYear - 1899 }, (_, index) => new Option(String(1900 + index), String(1900 + index))));
  $('#datePickerInput').addEventListener('click', () => setDatePickerOpen(true));
  $('#datePickerToggle').addEventListener('click', () => setDatePickerOpen($('#datePickerPopover').hidden));
  monthSelect.addEventListener('change', () => { datePickerView.month = Number(monthSelect.value); renderDatePicker(); });
  yearSelect.addEventListener('change', () => { datePickerView.year = Number(yearSelect.value); renderDatePicker(); });
  $('#datePickerPrevious').addEventListener('click', () => {
    const month = new Date(datePickerView.year, datePickerView.month - 1, 1);
    datePickerView = { year: month.getFullYear(), month: month.getMonth() };
    renderDatePicker();
  });
  $('#datePickerNext').addEventListener('click', () => {
    const month = new Date(datePickerView.year, datePickerView.month + 1, 1);
    datePickerView = { year: month.getFullYear(), month: month.getMonth() };
    renderDatePicker();
  });
  $('#datePickerPopover').addEventListener('click', event => {
    const dayButton = event.target.closest('[data-calendar-day]');
    if (dayButton) {
      const parts = { ...datePickerView, day: Number(dayButton.dataset.calendarDay) };
      const field = $('#datePickerInput');
      field.dataset.isoDate = datePartsToISO(parts);
      field.value = formatDateDisplay(field.dataset.isoDate);
      setDatePickerOpen(false);
      return;
    }
    if (event.target.closest('#datePickerClear')) setDatePickerValue('');
    if (event.target.closest('#datePickerTbd')) setDatePickerValue('TBD');
    if (event.target.closest('#datePickerClear, #datePickerTbd')) setDatePickerOpen(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#datePicker')) setDatePickerOpen(false);
  });
  renderDatePicker();
}

let csrfToken = '';
let data = null;
let installations = [];
let assignments = [];
let stock = [];
let nonEgm = [];
let upgrades = [];
let machineGroups = [];
let totals = {};
let datePickerView = { year: new Date().getFullYear(), month: new Date().getMonth() };

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
    operational: sum(installations.filter(row => row.status === 'Operativa')),
    inoperational: sum(installations.filter(row => row.status === 'Inoperativa')),
    assigned: sum(assignments),
    stockEgm: sum(stock),
    nonEgm: sum(nonEgm),
    upgradeUnits: sum(upgrades),
    totalEgm: sum(installations) + sum(assignments) + sum(stock)
  };
  totals.stockUnassignedOrPreparation = sum(stock.filter(row => row.status === 'Stock sin destino' || row.status === 'Stock / preparación'));
  totals.newStock = sum(stock.filter(row => row.status === 'Nuevo ingreso a stock'));
  totals.fv837ePreparation = sum(stock, 'preparationQuantity');
  totals.fv837eNoDestination = sum(stock, 'noDestinationQuantity');
  totals.fv837eTotal = sum(stock.filter(row => row.model === 'FV837E'));
  totals.stockGeneral = totals.stockEgm + totals.assigned + totals.nonEgm;
  machineGroups = [
    ...installations.map(row => ({ ...row, origin: 'Instalaciones', detail: [row.package, row.signage, row.game, row.linked === 'Sí' ? 'Linkeado' : '', row.islands ? `${row.islands} isla(s)` : '', row.date ? `Instalación ${formatDateDisplay(row.date)}` : '', row.notes].filter(Boolean).join(' · ') })),
    ...assignments.map(row => ({
      ...row,
      origin: 'Pipeline',
      detail: [
        row.game,
        row.signage,
        row.linked === 'Sí' ? 'Isla linkeada' : '',
        row.islands ? `${row.islands} ${row.islands === 1 ? 'isla' : 'islas'}` : '',
        row.jackpotControllers ? `${row.jackpotControllers} ${row.jackpotControllers === 1 ? 'Jackpot Controller' : 'Jackpot Controllers'}` : '',
        row.units?.length ? `${row.units.length} series con RENO ID` : '',
        row.notes
      ].filter(Boolean).join(' · ')
    })),
    ...stock.map(row => ({ ...row, client: row.destination || 'Sin destino', location: row.destination || 'Stock', origin: row.sourceId, detail: [row.condition, row.game, row.signage, row.notes].filter(Boolean).join(' · ') }))
  ];
}

function badge(status) {
  const type = status === 'Operativa' ? 'green' : status === 'Inoperativa' ? 'red' : status.includes('Asignado') ? 'blue' : status.includes('preparación') ? 'violet' : status.includes('Stock') || status.includes('ingreso') ? 'amber' : 'blue';
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
    const inoperationalEnd = operationalEnd + totals.inoperational / totals.totalEgm * 100;
    const assignedEnd = inoperationalEnd + totals.assigned / totals.totalEgm * 100;
    donut.style.background = `conic-gradient(var(--green) 0 ${operationalEnd}%,#d45a66 ${operationalEnd}% ${inoperationalEnd}%,var(--blue) ${inoperationalEnd}% ${assignedEnd}%,var(--amber) ${assignedEnd}% 100%)`;
  }
  $('#installationGroupCount').textContent = `${fmt.format(installations.length)} grupos`;
  $('#upgradeCount').textContent = `${fmt.format(upgrades.length)} registro(s) en la fuente`;
  const sourceDate = $('[data-source-date]');
  if (sourceDate) sourceDate.textContent = new Date(data.source.workbookDate + 'T00:00:00').toLocaleDateString('es-AR');
  $$('[data-group-count]').forEach(node => { node.textContent = fmt.format(node.dataset.groupCount === 'installations' ? installations.length : machineGroups.length); });
  if (upgrades[0]) $('[data-upgrade-date]').textContent = new Date(upgrades[0].date + 'T00:00:00').toLocaleDateString('es-AR');
}

function recordActions(row, { allowDelete = false } = {}) {
  const item = row.client || row.sourceId || row.model;
  const deleteAction = allowDelete && !row.sourceQuantity ? `<button class="table-action danger" data-delete-id="${row.id}" type="button">Eliminar</button>` : '';
  return `<div class="record-row-actions"><button class="table-action table-action-detail" data-view-record-id="${row.id}" type="button" aria-label="Ver detalle de ${escapeHTML(item)}">Ver detalle</button><button class="table-action" data-edit-id="${row.id}" type="button">${row.sourceQuantity ? 'Editar lote' : 'Editar'}</button>${deleteAction}</div>`;
}

function machineRow(row) {
  return `<tr><td><b>${display(row.client)}</b>${recordActions(row, { allowDelete: true })}</td><td>${display(row.location)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.origin || row.sourceId)}${row.detail ? ` · ${escapeHTML(row.detail)}` : ''}</td></tr>`;
}

function installationRow(row) {
  const packageSignage = [row.package, row.signage].filter(Boolean).join(' · ');
  const game = [row.game, row.linked === 'Sí' ? 'Sí' : ''].filter(Boolean).join(' · ');
  const note = [row.islands ? `${row.islands} isla(s)` : '', row.date ? `Instalación ${formatDateDisplay(row.date)}` : '', row.notes].filter(Boolean).join(' · ');
  return `<tr><td><b>${display(row.client)}</b>${recordActions(row)}</td><td>${display(row.location)}</td><td>${display(row.province)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display(packageSignage)}</td><td>${display(game)}</td><td>${badge(row.status)}${note ? `<small class="cell-note">${escapeHTML(note)}</small>` : ''}</td></tr>`;
}

function stockRow(row) {
  const tech = [row.game, row.signage, row.linked === 'Sí' ? 'Linkeado' : ''].filter(Boolean).join(' · ');
  const sourceClass = row.sourceClass === 'Gaming cabinet' ? 'Gaming cabinet · incluido como EGM en Resumen' : row.sourceClass;
  return `<tr><td><b>${display(row.sourceId)}</b>${recordActions(row)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.condition)}</td><td>${display(tech)}</td><td>${display([sourceClass, row.notes].filter(Boolean).join(' · '))}</td></tr>`;
}

function nonEgmRow(row) {
  return `<tr><td><b>${display(row.sourceId)}</b>${recordActions(row, { allowDelete: true })}</td><td>${display(row.model)}</td><td>${display(row.category)}</td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td></tr>`;
}

function upgradeRow(row) {
  return `<tr><td><b>${display(row.id)}</b></td><td>${display(row.client)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display(row.from)}</td><td>${display(row.to)}</td><td>${display(row.game)}</td><td>${badge(row.status)} <small class="cell-note">${escapeHTML(formatDateDisplay(row.date))}</small></td><td>${display(row.notes)}</td></tr>`;
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

function machineSearchText(row) {
  const ordinaryFields = Object.entries(row)
    .filter(([, value]) => !Array.isArray(value))
    .map(([, value]) => value)
    .join(' ');
  const unitFields = Array.isArray(row.units)
    ? row.units.map(unit => [unit.serialNumber, unit.renoId, unit.game].filter(Boolean).join(' ')).join(' ')
    : '';
  return `${ordinaryFields} ${unitFields}`;
}

function machineUnitDetails(row) {
  return Array.isArray(row.units)
    ? row.units.map(unit => [unit.serialNumber, unit.renoId ? `RENO ${unit.renoId}` : '', unit.game].filter(Boolean).join(' · ')).join(' | ')
    : '';
}

function machineRowsForView(view) {
  return machineGroups.flatMap(row => {
    if (row.recordType !== 'stock' || row.status !== 'Stock / preparación') return [row];
    const noDestination = Number(row.noDestinationQuantity) || 0;
    const inPreparation = Number(row.preparationQuantity) || 0;
    if (!noDestination || !inPreparation) return [row];
    const makePart = (quantity, status, label) => ({
      ...row,
      quantity,
      sourceQuantity: row.quantity,
      status,
      detail: [`Lote completo: ${row.quantity} EGM`, `${quantity} ${label}`, row.detail].filter(Boolean).join(' · ')
    });
    if (view === 'stock-unassigned') return [makePart(noDestination, 'Stock sin destino', 'sin destino')];
    if (view === 'stock-preparation') return [makePart(inPreparation, 'Stock / preparación', 'en preparación')];
    return [row];
  });
}

function renderMachines() {
  const view = $('#machineViewFilter').value;
  const status = $('#machineStatusFilter').value;
  const term = $('#machineSearch').value;
  const sort = $('#machineSort').value || 'client';
  const matchesView = row => {
    if (!view) return true;
    if (view === 'operational') return row.recordType === 'installation' && row.status === 'Operativa';
    if (view === 'inoperational') return row.recordType === 'installation' && row.status === 'Inoperativa';
    if (view === 'stock-unassigned') return row.recordType === 'stock' && ['Stock sin destino', 'Nuevo ingreso a stock'].includes(row.status);
    if (view === 'stock-preparation') return row.recordType === 'stock' && row.status === 'Stock / preparación';
    return row.recordType === view;
  };
  const rows = sorted(machineRowsForView(view).filter(row => matchesView(row) && (!status || row.status === status) && (!normalize(term) || normalize(machineSearchText(row)).includes(normalize(term)))), sort);
  const tbody = $('#machineRows');
  if (rows.length) tbody.innerHTML = rows.map(machineRow).join('');
  else setEmpty(tbody, 6, 'No hay registros que coincidan con la búsqueda.');
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
  $('#installationRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows.filter(row => row.status === 'Operativa')))} operativas · ${fmt.format(sum(rows.filter(row => row.status === 'Inoperativa')))} inoperativas`;
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
  renderUpgrades();
}

function exportRows(view) {
  if (view === 'installations') return filtered(installations.filter(row => !$('#provinceFilter').value || row.province === $('#provinceFilter').value), $('#installSearch').value, ['client', 'location', 'province', 'model', 'package', 'signage', 'game', 'status', 'notes']).map(row => ({ Cliente: row.client, Ubicacion: row.location, Provincia: row.province, Modelo: row.model, Cantidad: row.quantity, Paquete: row.package, Carteleria: row.signage, Juego: row.game, Linkeado: row.linked, Estado: row.status, Fecha: formatDateDisplay(row.date), Observaciones: row.notes }));
  if (view === 'stock') return filtered(stock.filter(row => !$('#stockStatusFilter').value || row.status === $('#stockStatusFilter').value), $('#stockSearch').value, ['sourceId', 'model', 'status', 'condition', 'game', 'signage', 'notes', 'sourceClass']).map(row => ({ Lote: row.sourceId, Modelo: row.model, Cantidad: row.quantity, Estado: row.status, Condicion: row.condition, ClaseOrigen: row.sourceClass, Juego: row.game, Carteleria: row.signage, Notas: row.notes }));
  if (view === 'upgrades') return filtered(upgrades, $('#upgradeSearch').value, ['id', 'client', 'model', 'from', 'to', 'game', 'type', 'date', 'status', 'notes']).map(row => ({ ID: row.id, Cliente: row.client, Modelo: row.model, Cantidad: row.quantity, PlataformaAnterior: row.from, PlataformaNueva: row.to, Juego: row.game, Fecha: formatDateDisplay(row.date), Estado: row.status, Observaciones: row.notes }));
  const term = $('#machineSearch').value;
  const viewFilter = $('#machineViewFilter').value;
  const status = $('#machineStatusFilter').value;
  const sort = $('#machineSort').value || 'client';
  const matchesView = row => {
    if (!viewFilter) return true;
    if (viewFilter === 'operational') return row.recordType === 'installation' && row.status === 'Operativa';
    if (viewFilter === 'inoperational') return row.recordType === 'installation' && row.status === 'Inoperativa';
    if (viewFilter === 'stock-unassigned') return row.recordType === 'stock' && ['Stock sin destino', 'Nuevo ingreso a stock'].includes(row.status);
    if (viewFilter === 'stock-preparation') return row.recordType === 'stock' && row.status === 'Stock / preparación';
    return row.recordType === viewFilter;
  };
  return sorted(machineRowsForView(viewFilter).filter(row => matchesView(row) && (!status || row.status === status) && (!normalize(term) || normalize(machineSearchText(row)).includes(normalize(term)))), sort).map(row => ({
    Cliente: row.client,
    Ubicacion: row.location,
    Modelo: row.model,
    Cantidad: row.quantity,
    Estado: row.status,
    Origen: row.origin || row.sourceId,
    Detalle: row.detail,
    'Número(s) de serie': Array.isArray(row.units) ? row.units.map(unit => unit.serialNumber).join('; ') : '',
    'Detalle por serie / RENO ID / juego': machineUnitDetails(row),
    Islas: row.islands ?? '',
    Linkeada: row.linked ?? '',
    'Jackpot Controller(s)': row.jackpotControllers ?? ''
  }));
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
  if (view === 'asignaciones') {
    view = 'maquinas';
    $('#machineViewFilter').value = 'assignment';
    renderMachines();
  }
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
  const field = form.elements.namedItem(name);
  if (field) field.value = value ?? '';
}

function updateStatusOptions(form, selected = '') {
  const statuses = {
    installation: ['Operativa', 'Inoperativa'],
    assignment: ['Asignado / pendiente de instalación'],
    stock: ['Stock sin destino', 'Stock / preparación', 'Nuevo ingreso a stock'],
    non_egm: ['Stock sin destino']
  }[form.elements.recordType.value];
  form.elements.status.replaceChildren(...statuses.map(status => new Option(status, status)));
  form.elements.status.value = statuses.includes(selected) ? selected : statuses[0];
  form.querySelectorAll('[data-record-fields]').forEach(field => {
    field.hidden = !field.dataset.recordFields.split(',').includes(form.elements.recordType.value);
  });
}

function openRecordDetail(record) {
  const typeLabels = { installation: 'Instalación', assignment: 'Asignación', stock: 'Stock', non_egm: 'Equipo no EGM' };
  const units = Array.isArray(record.units) ? record.units : [];
  const unitDetails = units.map(unit => [unit.serialNumber, unit.renoId ? `RENO ${unit.renoId}` : '', unit.game].filter(Boolean).join(' · ')).join('\n');
  const fields = [
    ['Tipo de registro', typeLabels[record.recordType] || record.recordType],
    ['Cliente / destino', record.client], ['Sala / ubicación', record.location], ['Provincia', record.province],
    ['Lote / origen', record.sourceId], ['Modelo / equipo', record.model], ['Categoría', record.category],
    ['Cantidad', record.quantity == null ? '' : fmt.format(record.quantity)], ['Estado', record.status],
    ['Paquete', record.package], ['Condición', record.condition], ['Destino', record.destination],
    ['Islas', record.islands], ['Jackpot Controllers', record.jackpotControllers], ['Juego', record.game], ['Cartelería', record.signage],
    ['Linkeada', record.linked], ['Fecha', formatDateDisplay(record.date)], ['Clasificación de origen', record.sourceClass],
    ['Detalle por máquina', unitDetails],
    ['Observaciones', record.notes], ['Fila en la fuente', record.sourceRow]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
  $('#installationDetailContent').innerHTML = fields.map(([label, value]) => {
    const wide = label === 'Detalle por máquina' ? ' detail-item-wide' : '';
    return `<div class="detail-item${wide}"><span>${escapeHTML(label)}</span><strong>${display(value)}</strong></div>`;
  }).join('');
  $('#installationDetailTitle').textContent = `${record.client || record.sourceId || 'Registro'} · ${record.model}`;
  $('#editInstallationFromDetail').dataset.editId = record.id;
  $('#openInstallationHistory').dataset.historyId = record.id;
  $('#installationDetailDialog').showModal();
}

function formatHistoryDate(value) {
  const date = new Date(`${String(value).replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusLabel(recordType, status) {
  const typeLabels = { installation: 'Instalación', assignment: 'Asignación', stock: 'Stock', non_egm: 'No EGM' };
  return `${typeLabels[recordType] || recordType} · ${status}`;
}

async function openStatusHistory(record) {
  const dialog = $('#statusHistoryDialog');
  const content = $('#statusHistoryContent');
  dialog.dataset.recordId = record.id;
  $('#statusHistoryTitle').textContent = `Historial · ${record.sourceId ? `${record.sourceId} · ` : ''}${record.model}`;
  content.innerHTML = '<p class="history-empty">Cargando historial…</p>';
  dialog.showModal();
  try {
    const result = await request(`/api/records/${record.id}/status-history`);
    if (dialog.dataset.recordId !== String(record.id)) return;
    if (!result.history.length) {
      content.innerHTML = '<p class="history-empty">Todavía no hay cambios de estado registrados.</p>';
      return;
    }
    content.innerHTML = result.history.map(entry => {
      const transition = entry.fromStatus
        ? `<strong>${escapeHTML(statusLabel(entry.fromRecordType, entry.fromStatus))}</strong><span class="history-arrow">→</span><strong>${escapeHTML(statusLabel(entry.toRecordType, entry.toStatus))}</strong>`
        : `<strong>Estado de partida · ${escapeHTML(statusLabel(entry.toRecordType, entry.toStatus))}</strong>`;
      const actor = entry.username || 'Sistema · registro existente sin usuario histórico';
      return `<article class="history-entry"><div class="history-transition">${transition}</div><div class="history-meta"><time>${escapeHTML(formatHistoryDate(entry.changedAt))}</time><span>Usuario: ${escapeHTML(actor)}</span></div></article>`;
    }).join('');
  } catch (error) {
    if (dialog.dataset.recordId === String(record.id)) content.innerHTML = `<p class="history-empty">${escapeHTML(error.message)}</p>`;
  }
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
  setField(form, 'quantity', record?.sourceQuantity || record?.quantity || 1);
  setField(form, 'package', record?.package || '');
  setField(form, 'islands', record?.islands || '');
  setDatePickerValue(record?.date || '');
  setField(form, 'linked', record?.linked || '');
  setField(form, 'condition', record?.condition || '');
  setField(form, 'destination', record?.destination || '');
  setField(form, 'game', record?.game || '');
  setField(form, 'signage', record?.signage || '');
  setField(form, 'notes', record?.notes || '');
  $('#dialogTitle').textContent = record?.recordType === 'installation' ? 'Editar instalación' : record ? 'Editar registro' : 'Nueva máquina';
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
  setupDatePicker();
  $$('.nav-link[data-view]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const view = link.dataset.view;
    if (location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
    setView(view);
  }));
  window.addEventListener('popstate', () => setView(location.hash.slice(1) || 'inicio', false));
  $('#loginForm').addEventListener('submit', login);
  $('#machineSearch').addEventListener('input', renderMachines);
  $('#machineViewFilter').addEventListener('change', renderMachines);
  $('#machineStatusFilter').addEventListener('change', renderMachines);
  $('#machineSort').addEventListener('change', renderMachines);
  $('#installSearch').addEventListener('input', renderInstallations);
  $('#provinceFilter').addEventListener('change', renderInstallations);
  $('#installSort').addEventListener('change', renderInstallations);
  $('#stockSearch').addEventListener('input', renderStock);
  $('#stockStatusFilter').addEventListener('change', renderStock);
  $('#upgradeSearch').addEventListener('input', renderUpgrades);
  $$('[data-export]').forEach(button => button.addEventListener('click', () => exportCSV(button.dataset.export || 'machines')));
  $('#newRecordButton').addEventListener('click', () => openRecord(null));
  $('#appShell').addEventListener('click', async event => {
    const viewRecordButton = event.target.closest('[data-view-record-id]');
    const historyButton = event.target.closest('[data-history-id]');
    const editButton = event.target.closest('[data-edit-id]');
    const deleteButton = event.target.closest('[data-delete-id]');
    if (viewRecordButton) {
      const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(viewRecordButton.dataset.viewRecordId));
      if (record) openRecordDetail(record);
    }
    if (historyButton) {
      const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(historyButton.dataset.historyId));
      if (record) await openStatusHistory(record);
    }
    if (editButton) {
      const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(editButton.dataset.editId));
      if (record) {
        $('#installationDetailDialog').close();
        openRecord(record);
      }
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
    input.date = form.elements.namedItem('date').dataset.isoDate || '';
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
  $('#recordForm').elements.recordType.addEventListener('change', event => {
    const form = event.currentTarget.form;
    updateStatusOptions(form);
    if (!['installation', 'assignment'].includes(form.elements.recordType.value)) setDatePickerValue('');
  });
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
  $('#editInstallationFromDetail').addEventListener('click', event => {
    const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(event.currentTarget.dataset.editId));
    if (!record) return;
    $('#installationDetailDialog').close();
    openRecord(record);
  });
  $('#openInstallationHistory').addEventListener('click', event => {
    const record = [...machineGroups, ...nonEgm].find(row => row.id === Number(event.currentTarget.dataset.historyId));
    if (record) openStatusHistory(record);
  });
  $('#closeInstallationDetailDialog').addEventListener('click', () => $('#installationDetailDialog').close());
  $('#closeInstallationDetailButton').addEventListener('click', () => $('#installationDetailDialog').close());
  $('#closeStatusHistoryDialog').addEventListener('click', () => $('#statusHistoryDialog').close());
  $('#closeStatusHistoryButton').addEventListener('click', () => $('#statusHistoryDialog').close());
  $('#installationDetailDialog').addEventListener('click', event => { if (event.target === $('#installationDetailDialog')) $('#installationDetailDialog').close(); });
  $('#statusHistoryDialog').addEventListener('click', event => { if (event.target === $('#statusHistoryDialog')) $('#statusHistoryDialog').close(); });
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
