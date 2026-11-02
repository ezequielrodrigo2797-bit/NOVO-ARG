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
let draggedMachineRow = null;
let draggedMachineColumn = null;
let machineHorizontalResizeObserver = null;

const machineOrderStorageKey = 'novomatic-machine-order';
const machineColumnOrderStorageKey = 'novomatic-machine-column-order';
const machineVisibleFiltersStorageKey = 'novomatic-machine-visible-filters';
const machineSortStorageKey = 'novomatic-machine-sort';
const machineColumnKeys = ['client', 'location', 'roomLocation', 'province', 'model', 'quantity', 'status', 'date', 'origin'];

function machineFilterValues(field) {
  return [...new Set(machineGroups.map(row => String(row[field] ?? '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function machineDateFilterValues() {
  const dateValue = value => {
    const parts = parseDateParts(value);
    return parts ? Date.UTC(parts.year, parts.month, parts.day) : Number.NEGATIVE_INFINITY;
  };
  return [...new Set(machineGroups.map(row => String(row.date ?? '').trim()).filter(Boolean))]
    .sort((a, b) => dateValue(b) - dateValue(a) || a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function replaceMachineFilterOptions(select, emptyLabel, values) {
  if (!select) return;
  const selected = select.value;
  select.replaceChildren(new Option(emptyLabel, ''), ...values.map(value => new Option(value, value)));
  select.value = values.includes(selected) ? selected : '';
}

function updateMachineFilterOptions() {
  replaceMachineFilterOptions($('#machineProvinceFilter'), 'Todas las provincias', machineFilterValues('province'));
  replaceMachineFilterOptions($('#machinePackageFilter'), 'Todos los paquetes', machineFilterValues('package'));
  const dateSelect = $('#machineDateFilter');
  if (dateSelect) {
    const selected = dateSelect.value;
    const dates = machineDateFilterValues();
    dateSelect.replaceChildren(new Option('Todas las fechas', ''), new Option('Sin fecha', '__without_date__'), ...dates.map(value => new Option(formatDateDisplay(value), value)));
    dateSelect.value = dates.includes(selected) || selected === '__without_date__' ? selected : '';
  }
}

function setupMachineViewControls() {
  const toolbar = $('#machineSearch')?.closest('.toolbar');
  const sort = $('#machineSort');
  if (!toolbar || !sort || $('#machineFilterVisibility')) return;
  toolbar.classList.add('machine-toolbar');
  toolbar.closest('.table-panel')?.classList.add('machine-controls-panel');

  const addFilter = (id, label, emptyLabel) => {
    const select = document.createElement('select');
    select.id = id;
    select.setAttribute('aria-label', label);
    select.append(new Option(emptyLabel, ''));
    toolbar.insertBefore(select, sort);
  };
  addFilter('machineProvinceFilter', 'Filtrar por provincia', 'Todas las provincias');
  addFilter('machinePackageFilter', 'Filtrar por paquete', 'Todos los paquetes');
  addFilter('machineDateFilter', 'Filtrar por fecha', 'Todas las fechas');
  if (!Array.from(sort.options).some(option => option.value === 'manual')) {
    sort.append(new Option('Orden manual (arrastrar)', 'manual'));
  }
  try {
    const savedSort = localStorage.getItem(machineSortStorageKey);
    const hasManualOrder = JSON.parse(localStorage.getItem(machineOrderStorageKey) || '[]').length > 0;
    if (Array.from(sort.options).some(option => option.value === savedSort)) sort.value = savedSort;
    else if (hasManualOrder) sort.value = 'manual';
  } catch { /* Preferencia local opcional. */ }

  const filterDefinitions = [
    ['machineViewFilter', 'Tipo de máquina'],
    ['machineStatusFilter', 'Estado'],
    ['machineUpgradeFilter', 'Upgrade'],
    ['machineDateFilter', 'Fecha'],
    ['machineProvinceFilter', 'Provincia'],
    ['machinePackageFilter', 'Paquete']
  ];
  const visibilityMenu = document.createElement('details');
  visibilityMenu.id = 'machineFilterVisibility';
  visibilityMenu.className = 'machine-view-menu';
  visibilityMenu.innerHTML = '<summary>Filtros visibles</summary><div class="machine-view-menu-popover"><strong>Mostrar filtros</strong><div class="machine-view-menu-options"></div><div class="machine-view-menu-actions"><button type="button" data-reset-machine-filters>Restablecer filtros</button><button type="button" data-reset-machine-columns>Restablecer orden de encabezados</button></div></div>';
  const savedVisibility = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(machineVisibleFiltersStorageKey) || 'null');
      return Array.isArray(value) ? new Set(value) : new Set(filterDefinitions.map(([id]) => id));
    } catch { return new Set(filterDefinitions.map(([id]) => id)); }
  })();
  try {
    const upgradeFilterVersionKey = 'novomatic-machine-upgrade-filter-v1';
    if (!localStorage.getItem(upgradeFilterVersionKey)) {
      savedVisibility.add('machineUpgradeFilter');
      localStorage.setItem(machineVisibleFiltersStorageKey, JSON.stringify([...savedVisibility]));
      localStorage.setItem(upgradeFilterVersionKey, 'true');
    }
  } catch { /* Preferencia local opcional. */ }
  try {
    const dateFilterVersionKey = 'novomatic-machine-date-filter-v1';
    if (!localStorage.getItem(dateFilterVersionKey)) {
      savedVisibility.add('machineDateFilter');
      localStorage.setItem(machineVisibleFiltersStorageKey, JSON.stringify([...savedVisibility]));
      localStorage.setItem(dateFilterVersionKey, 'true');
    }
  } catch { /* Preferencia local opcional. */ }
  const options = visibilityMenu.querySelector('.machine-view-menu-options');
  filterDefinitions.forEach(([id, label]) => {
    const select = $(`#${id}`);
    const checkboxLabel = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = savedVisibility.has(id);
    checkbox.dataset.filterVisibility = id;
    checkboxLabel.append(checkbox, document.createTextNode(label));
    options.append(checkboxLabel);
    select.hidden = !checkbox.checked;
    if (!checkbox.checked) select.value = '';
    checkbox.addEventListener('change', () => {
      select.hidden = !checkbox.checked;
      if (!checkbox.checked) select.value = '';
      const visible = filterDefinitions.filter(([filterId]) => $(`[data-filter-visibility="${filterId}"]`).checked).map(([filterId]) => filterId);
      try { localStorage.setItem(machineVisibleFiltersStorageKey, JSON.stringify(visible)); } catch { /* Preferencia local opcional. */ }
      renderMachines();
    });
  });
  toolbar.insertBefore(visibilityMenu, sort);
  visibilityMenu.querySelector('[data-reset-machine-filters]').addEventListener('click', resetMachineFilters);
  visibilityMenu.querySelector('[data-reset-machine-columns]').addEventListener('click', resetMachineColumnOrder);

  setupMachineRowReordering();
  setupMachineColumnReordering();
  setupMachineHorizontalNavigator();
}

function getMachineColumnOrder() {
  let saved = [];
  try {
    const value = JSON.parse(localStorage.getItem(machineColumnOrderStorageKey) || '[]');
    if (Array.isArray(value)) saved = value.map(String);
  } catch { /* Orden de columnas local opcional. */ }
  const available = new Set(machineColumnKeys);
  const ordered = [...new Set(saved)].filter(key => available.has(key));
  machineColumnKeys.forEach((key, index) => {
    if (ordered.includes(key)) return;
    const nextKey = machineColumnKeys.slice(index + 1).find(candidate => ordered.includes(candidate));
    if (nextKey) ordered.splice(ordered.indexOf(nextKey), 0, key);
    else ordered.push(key);
  });
  return ordered;
}

function applyMachineColumnOrder() {
  const header = $('#machineRows')?.closest('table')?.querySelector('thead tr');
  const tbody = $('#machineRows');
  if (!header || !tbody) return;
  const order = getMachineColumnOrder();
  const reorderCells = row => {
    const cells = new Map([...row.children].filter(cell => cell.dataset.machineColumn).map(cell => [cell.dataset.machineColumn, cell]));
    order.forEach(key => { if (cells.has(key)) row.append(cells.get(key)); });
  };
  reorderCells(header);
  [...tbody.rows].forEach(reorderCells);
  updateMachineHorizontalNavigator();
}

function resetMachineFilters() {
  $('#machineSearch').value = '';
  const filterIds = ['machineViewFilter', 'machineStatusFilter', 'machineUpgradeFilter', 'machineDateFilter', 'machineProvinceFilter', 'machinePackageFilter'];
  filterIds.forEach(id => {
    const select = $(`#${id}`);
    select.value = '';
    select.hidden = false;
  });
  $$('#machineFilterVisibility [data-filter-visibility]').forEach(checkbox => { checkbox.checked = true; });
  try { localStorage.setItem(machineVisibleFiltersStorageKey, JSON.stringify(filterIds)); } catch { /* Preferencia local opcional. */ }
  renderMachines();
  showToast('Filtros restablecidos.');
}

function resetMachineColumnOrder() {
  try { localStorage.removeItem(machineColumnOrderStorageKey); } catch { /* Orden de columnas local opcional. */ }
  applyMachineColumnOrder();
  showToast('Orden de encabezados restablecido.');
}

function setupMachineColumnReordering() {
  const header = $('#machineRows')?.closest('table')?.querySelector('thead tr');
  if (!header || header.dataset.columnReorderingReady) return;
  header.dataset.columnReorderingReady = 'true';
  [...header.cells].forEach((cell, index) => {
    cell.dataset.machineColumn = machineColumnKeys[index];
    cell.draggable = true;
    cell.title = 'Arrastrá para reordenar esta columna';
  });
  applyMachineColumnOrder();
  header.addEventListener('dragstart', event => {
    const cell = event.target.closest('th[data-machine-column]');
    if (!cell) { event.preventDefault(); return; }
    draggedMachineColumn = cell;
    cell.classList.add('machine-column-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cell.dataset.machineColumn);
  });
  header.addEventListener('dragover', event => {
    if (!draggedMachineColumn) return;
    event.preventDefault();
    const target = event.target.closest('th[data-machine-column]');
    header.querySelectorAll('.machine-column-drop-before,.machine-column-drop-after').forEach(cell => cell.classList.remove('machine-column-drop-before', 'machine-column-drop-after'));
    if (!target || target === draggedMachineColumn) return;
    const after = event.clientX > target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
    target.classList.add(after ? 'machine-column-drop-after' : 'machine-column-drop-before');
  });
  header.addEventListener('drop', event => {
    if (!draggedMachineColumn) return;
    event.preventDefault();
    const target = event.target.closest('th[data-machine-column]');
    if (target && target !== draggedMachineColumn) {
      const after = event.clientX > target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
      header.insertBefore(draggedMachineColumn, after ? target.nextElementSibling : target);
      const order = [...header.cells].map(cell => cell.dataset.machineColumn);
      try { localStorage.setItem(machineColumnOrderStorageKey, JSON.stringify(order)); } catch { /* Orden de columnas local opcional. */ }
      applyMachineColumnOrder();
      showToast('Orden de columnas guardado.');
    }
    draggedMachineColumn?.classList.remove('machine-column-dragging');
    draggedMachineColumn = null;
  });
  header.addEventListener('dragend', () => {
    header.querySelectorAll('.machine-column-dragging').forEach(cell => cell.classList.remove('machine-column-dragging'));
    draggedMachineColumn = null;
    header.querySelectorAll('.machine-column-drop-before,.machine-column-drop-after').forEach(cell => cell.classList.remove('machine-column-drop-before', 'machine-column-drop-after'));
  });
}

function updateMachineHorizontalNavigator() {
  const wrapper = $('#machineRows')?.closest('.table-wrap');
  const navigator = $('#machineHorizontalNavigator');
  const track = $('#machineHorizontalTrack');
  const spacer = $('#machineHorizontalSpacer');
  if (!wrapper || !navigator || !track || !spacer) return;
  const activePage = wrapper.closest('.page-view')?.classList.contains('active');
  const hasOverflow = wrapper.scrollWidth > wrapper.clientWidth + 2;
  navigator.hidden = !activePage || !hasOverflow;
  const maximumScroll = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
  spacer.style.width = `${maximumScroll + (navigator.hidden ? 0 : track.clientWidth)}px`;
  $('#appShell')?.classList.toggle('machine-horizontal-visible', !navigator.hidden);
  if (!navigator.hidden && Math.abs(track.scrollLeft - wrapper.scrollLeft) > 1) track.scrollLeft = wrapper.scrollLeft;
}

function setupMachineHorizontalNavigator() {
  if ($('#machineHorizontalNavigator')) return;
  const wrapper = $('#machineRows')?.closest('.table-wrap');
  const app = $('#appShell');
  if (!wrapper || !app) return;
  const navigator = document.createElement('div');
  navigator.id = 'machineHorizontalNavigator';
  navigator.className = 'machine-horizontal-navigator';
  navigator.hidden = true;
  navigator.innerHTML = '<span class="machine-horizontal-label">Columnas</span><button type="button" data-horizontal-step="-1" aria-label="Desplazar tabla a la izquierda">‹</button><div id="machineHorizontalTrack" class="machine-horizontal-track" role="region" tabindex="0" aria-label="Desplazamiento horizontal de la tabla" aria-controls="machineRows"><div id="machineHorizontalSpacer"></div></div><button type="button" data-horizontal-step="1" aria-label="Desplazar tabla a la derecha">›</button>';
  app.append(navigator);
  const track = $('#machineHorizontalTrack');
  let syncing = false;
  wrapper.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    track.scrollLeft = wrapper.scrollLeft;
    syncing = false;
  }, { passive: true });
  track.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    wrapper.scrollLeft = track.scrollLeft;
    syncing = false;
  }, { passive: true });
  navigator.querySelectorAll('[data-horizontal-step]').forEach(button => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.horizontalStep);
      wrapper.scrollBy({ left: direction * Math.max(wrapper.clientWidth * 0.7, 160), behavior: 'smooth' });
    });
  });
  window.addEventListener('resize', updateMachineHorizontalNavigator);
  if ('ResizeObserver' in window) {
    machineHorizontalResizeObserver = new ResizeObserver(updateMachineHorizontalNavigator);
    machineHorizontalResizeObserver.observe(wrapper);
    const table = wrapper.querySelector('table');
    if (table) machineHorizontalResizeObserver.observe(table);
  }
  updateMachineHorizontalNavigator();
}

function currentMachineOrder() {
  const ids = machineGroups.map(row => String(row.id));
  const existing = new Set(ids);
  let saved = [];
  try {
    const value = JSON.parse(localStorage.getItem(machineOrderStorageKey) || '[]');
    if (Array.isArray(value)) saved = value.map(String);
  } catch { /* Orden local opcional. */ }
  const ordered = [...new Set(saved)].filter(id => existing.has(id));
  return [...ordered, ...ids.filter(id => !ordered.includes(id))];
}

function manuallyOrderMachineRows(rows) {
  const positions = new Map(currentMachineOrder().map((id, index) => [id, index]));
  return [...rows].sort((a, b) => (positions.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) - (positions.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER));
}

function saveVisibleMachineOrder(visibleIds) {
  const uniqueVisible = [...new Set(visibleIds.map(String))];
  const visibleSet = new Set(uniqueVisible);
  const merged = currentMachineOrder();
  let index = 0;
  for (let position = 0; position < merged.length; position += 1) {
    if (visibleSet.has(merged[position])) merged[position] = uniqueVisible[index++];
  }
  while (index < uniqueVisible.length) merged.push(uniqueVisible[index++]);
  try { localStorage.setItem(machineOrderStorageKey, JSON.stringify(merged)); } catch { /* Orden local opcional. */ }
}

function setupMachineRowReordering() {
  const tbody = $('#machineRows');
  if (!tbody || tbody.dataset.reorderingReady) return;
  tbody.dataset.reorderingReady = 'true';
  tbody.addEventListener('dragstart', event => {
    const handle = event.target.closest('[data-drag-handle]');
    if (!handle) { event.preventDefault(); return; }
    draggedMachineRow = handle.closest('tr[data-record-row-id]');
    if (!draggedMachineRow) { event.preventDefault(); return; }
    draggedMachineRow.classList.add('machine-row-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedMachineRow.dataset.recordRowId);
  });
  tbody.addEventListener('dragover', event => {
    if (!draggedMachineRow) return;
    event.preventDefault();
    const target = event.target.closest('tr[data-record-row-id]');
    tbody.querySelectorAll('.machine-row-drop-before,.machine-row-drop-after').forEach(row => row.classList.remove('machine-row-drop-before', 'machine-row-drop-after'));
    if (!target || target === draggedMachineRow) return;
    const after = event.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
    target.classList.add(after ? 'machine-row-drop-after' : 'machine-row-drop-before');
  });
  tbody.addEventListener('drop', event => {
    if (!draggedMachineRow) return;
    event.preventDefault();
    const target = event.target.closest('tr[data-record-row-id]');
    if (target && target !== draggedMachineRow) {
      const after = event.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      tbody.insertBefore(draggedMachineRow, after ? target.nextElementSibling : target);
    } else if (!target) tbody.append(draggedMachineRow);
    const ids = [...tbody.querySelectorAll('tr[data-record-row-id]')].map(row => row.dataset.recordRowId);
    if (ids.length > 1) {
      saveVisibleMachineOrder(ids);
      $('#machineSort').value = 'manual';
      try { localStorage.setItem(machineSortStorageKey, 'manual'); } catch { /* Preferencia local opcional. */ }
      renderMachines();
      showToast('Orden manual guardado.');
    }
    draggedMachineRow = null;
  });
  tbody.addEventListener('dragend', () => {
    draggedMachineRow?.classList.remove('machine-row-dragging');
    draggedMachineRow = null;
    tbody.querySelectorAll('.machine-row-drop-before,.machine-row-drop-after').forEach(row => row.classList.remove('machine-row-drop-before', 'machine-row-drop-after'));
  });
}

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
    ...stock.map(row => ({ ...row, client: row.client || row.destination || 'Sin destino', location: row.location || row.destination || 'Stock', origin: row.sourceId, detail: [row.condition, row.game, row.signage, row.notes].filter(Boolean).join(' · ') }))
  ];
  updateMachineFilterOptions();
  updateRecordSuggestions();
}

function updateRecordSuggestions() {
  const records = [...machineGroups, ...nonEgm];
  const allRecords = [...records, ...upgrades];
  const valuesByField = {
    client: allRecords.map(row => row.client),
    location: records.map(row => row.location),
    roomLocation: records.map(row => row.roomLocation),
    province: installations.map(row => row.province),
    model: allRecords.map(row => row.model),
    category: nonEgm.map(row => row.category),
    package: installations.map(row => row.package),
    islands: [...installations, ...assignments].map(row => row.islands),
    condition: stock.map(row => row.condition),
    destination: stock.map(row => row.destination),
    game: allRecords.map(row => row.game),
    signage: records.map(row => row.signage)
  };
  const form = $('#recordForm');
  Object.entries(valuesByField).forEach(([fieldName, values]) => {
    const input = form.elements.namedItem(fieldName);
    const listId = `record-${fieldName}-options`;
    let list = document.getElementById(listId);
    if (!list) {
      list = document.createElement('datalist');
      list.id = listId;
      form.append(list);
    }
    input.setAttribute('list', listId);
    const uniqueValues = [...new Map(values
      .map(value => String(value ?? '').trim())
      .filter(Boolean)
      .map(value => [normalize(value), value])).values()]
      .sort((a, b) => a.localeCompare(b, 'es-AR'));
    list.replaceChildren(...uniqueValues.map(value => new Option(value, value)));
  });

  if (!$('#recordSuggestionHelp')) {
    const help = document.createElement('p');
    help.id = 'recordSuggestionHelp';
    help.className = 'dialog-help suggestion-help';
    help.textContent = 'En los campos con sugerencias, elegí un valor existente o escribí uno nuevo. Los valores nuevos se incorporan al guardar.';
    form.querySelector('.dialog-help').insertAdjacentElement('afterend', help);
  }
}

function setupRecordLocationFields() {
  const form = $('#recordForm');
  const salaInput = form.elements.namedItem('location');
  const salaLabel = salaInput.closest('label');
  const salaText = [...salaLabel.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
  if (salaText) salaText.textContent = 'Sala';
  if (form.elements.namedItem('roomLocation')) return;

  const locationField = document.createElement('div');
  locationField.className = 'maps-location-field';
  const locationLabel = document.createElement('label');
  locationLabel.htmlFor = 'roomLocationInput';
  locationLabel.textContent = 'Ubicación de sala';
  const controls = document.createElement('div');
  controls.className = 'maps-location-controls';
  const locationInput = document.createElement('input');
  locationInput.id = 'roomLocationInput';
  locationInput.name = 'roomLocation';
  locationInput.maxLength = 240;
  locationInput.placeholder = 'Dirección, ciudad o referencia';
  locationInput.autocomplete = 'street-address';
  controls.append(locationInput);
  const mapsButton = document.createElement('button');
  mapsButton.id = 'searchGoogleMaps';
  mapsButton.type = 'button';
  mapsButton.className = 'button button-secondary maps-search-button';
  mapsButton.textContent = 'Buscar en Google Maps';
  controls.append(mapsButton);
  locationField.append(locationLabel, controls);
  salaLabel.insertAdjacentElement('afterend', locationField);

  const mapLinkLabel = document.createElement('label');
  mapLinkLabel.textContent = 'Enlace de Google Maps (opcional)';
  const mapLinkInput = document.createElement('input');
  mapLinkInput.name = 'mapsUrl';
  mapLinkInput.type = 'url';
  mapLinkInput.maxLength = 2000;
  mapLinkInput.placeholder = 'Pegá el enlace de una ubicación específica';
  const mapHelp = document.createElement('small');
  mapHelp.className = 'maps-link-help';
  mapHelp.textContent = 'La búsqueda usa cliente, sala y provincia; podés pegar el enlace del punto exacto.';
  mapLinkLabel.append(mapLinkInput, mapHelp);
  locationField.insertAdjacentElement('afterend', mapLinkLabel);
}

function googleMapsSearchUrl(record) {
  const place = [record.client, record.location, record.roomLocation, record.province]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
  const query = place ? `${place}, Argentina` : '';
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
}

function safeGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowedHost = hostname === 'google.com' || hostname.endsWith('.google.com') || hostname === 'maps.app.goo.gl' || (hostname === 'goo.gl' && url.pathname.startsWith('/maps'));
    return url.protocol === 'https:' && allowedHost ? url.href : '';
  } catch {
    return '';
  }
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

function recordActions(row, { allowDelete = false, allowReorder = false } = {}) {
  const item = row.client || row.sourceId || row.model;
  const deleteAction = allowDelete && !row.sourceQuantity ? `<button class="table-action danger" data-delete-id="${row.id}" type="button">Eliminar</button>` : '';
  const reorderAction = allowReorder ? `<button class="table-action row-drag-handle" type="button" data-drag-handle draggable="true" title="Arrastrá para reordenar" aria-label="Arrastrar fila para reordenar">↕</button>` : '';
  return `<div class="record-row-actions">${reorderAction}<button class="table-action table-action-detail" data-view-record-id="${row.id}" type="button" aria-label="Ver detalle de ${escapeHTML(item)}">Ver detalle</button><button class="table-action" data-edit-id="${row.id}" type="button">${row.sourceQuantity ? 'Editar lote' : 'Editar'}</button>${deleteAction}</div>`;
}

function machineRow(row) {
  const upgradeTag = row.isUpgrade ? ' <span class="badge badge-upgrade">Upgrade</span>' : '';
  return `<tr data-record-row-id="${escapeHTML(row.id)}"><td data-machine-column="client"><b>${display(row.client)}</b>${recordActions(row, { allowDelete: true, allowReorder: true })}</td><td data-machine-column="location">${display(row.location)}</td><td data-machine-column="roomLocation">${display(row.roomLocation)}</td><td data-machine-column="province">${display(row.province)}</td><td data-machine-column="model"><b>${display(row.model)}</b>${upgradeTag}</td><td data-machine-column="quantity">${fmt.format(row.quantity)}</td><td data-machine-column="status">${badge(row.status)}</td><td data-machine-column="date">${display(formatDateDisplay(row.date))}</td><td data-machine-column="origin">${display(row.origin || row.sourceId)}${row.detail ? ` · ${escapeHTML(row.detail)}` : ''}</td></tr>`;
}

function installationRow(row) {
  const packageSignage = [row.package, row.signage].filter(Boolean).join(' · ');
  const game = [row.game, row.linked === 'Sí' ? 'Sí' : ''].filter(Boolean).join(' · ');
  const note = [row.islands ? `${row.islands} isla(s)` : '', row.date ? `Instalación ${formatDateDisplay(row.date)}` : '', row.notes].filter(Boolean).join(' · ');
  return `<tr><td><b>${display(row.client)}</b>${recordActions(row)}</td><td>${display(row.location)}</td><td>${display(row.roomLocation)}</td><td>${display(row.province)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${display(packageSignage)}</td><td>${display(game)}</td><td>${badge(row.status)}${note ? `<small class="cell-note">${escapeHTML(note)}</small>` : ''}</td></tr>`;
}

function stockRow(row) {
  const tech = [row.game, row.signage, row.linked === 'Sí' ? 'Linkeado' : ''].filter(Boolean).join(' · ');
  const sourceClass = row.sourceClass === 'Gaming cabinet' ? 'Gaming cabinet · incluido como EGM en Resumen' : row.sourceClass;
  const place = [...new Set([row.client, row.location, row.destination].map(value => String(value || '').trim()).filter(Boolean))].join(' \u00b7 ') || 'Sin destino';
  return `<tr><td><b>${display(row.sourceId)}</b>${recordActions(row)}</td><td>${display(place)}</td><td>${display(row.roomLocation)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.condition)}</td><td>${display(tech)}</td><td>${display([sourceClass, row.notes].filter(Boolean).join(' · '))}</td></tr>`;
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
  const serialNumbers = Array.isArray(row.serialNumbers) ? row.serialNumbers.join(' ') : '';
  return `${ordinaryFields} ${unitFields} ${serialNumbers}`;
}

function machineUnitDetails(row) {
  const units = Array.isArray(row.units) ? row.units : [];
  const serialNumbers = Array.isArray(row.serialNumbers) ? row.serialNumbers : [];
  const knownSerials = new Set(units.map(unit => String(unit.serialNumber || '').trim()).filter(Boolean));
  const extraSerials = serialNumbers.filter(serialNumber => !knownSerials.has(String(serialNumber).trim()));
  return [...units.map(unit => [unit.serialNumber, unit.renoId ? `RENO ${unit.renoId}` : '', unit.game].filter(Boolean).join(' · ')), ...extraSerials].join(' | ');
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
  const province = $('#machineProvinceFilter')?.value || '';
  const packageName = $('#machinePackageFilter')?.value || '';
  const upgrade = $('#machineUpgradeFilter')?.value || '';
  const date = $('#machineDateFilter')?.value || '';
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
  const filteredRows = machineRowsForView(view).filter(row => matchesView(row)
    && (!status || row.status === status)
    && (!province || row.province === province)
    && (!packageName || row.package === packageName)
    && (!upgrade || Boolean(row.isUpgrade) === (upgrade === 'yes'))
    && (!date || (date === '__without_date__' ? !row.date : String(row.date || '') === date))
    && (!normalize(term) || normalize(machineSearchText(row)).includes(normalize(term))));
  const rows = sort === 'manual' ? manuallyOrderMachineRows(filteredRows) : sorted(filteredRows, sort);
  const tbody = $('#machineRows');
  if (rows.length) tbody.innerHTML = rows.map(machineRow).join('');
  else setEmpty(tbody, 9, 'No hay registros que coincidan con la búsqueda.');
  applyMachineColumnOrder();
  $('#machineRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows))} EGM en el filtro`;
}

function renderInstallations() {
  const term = $('#installSearch').value;
  const province = $('#provinceFilter').value;
  const sort = $('#installSort').value || 'client';
  const rows = sorted(filtered(installations.filter(row => !province || row.province === province), term, ['client', 'location', 'roomLocation', 'province', 'model', 'package', 'signage', 'game', 'status', 'notes']), sort);
  const tbody = $('#installationRows');
  if (rows.length) tbody.innerHTML = rows.map(installationRow).join('');
  else setEmpty(tbody, 9, 'No hay instalaciones que coincidan.');
  $('#installationRowCount').textContent = `${fmt.format(rows.length)} agrupaciones · ${fmt.format(sum(rows.filter(row => row.status === 'Operativa')))} operativas · ${fmt.format(sum(rows.filter(row => row.status === 'Inoperativa')))} inoperativas`;
}

function renderStock() {
  const term = $('#stockSearch').value;
  const status = $('#stockStatusFilter').value;
  const rows = filtered(stock.filter(row => !status || row.status === status), term, ['sourceId', 'client', 'location', 'roomLocation', 'destination', 'model', 'status', 'condition', 'game', 'signage', 'notes', 'sourceClass']);
  const tbody = $('#stockRows');
  if (rows.length) tbody.innerHTML = rows.map(stockRow).join('');
  else setEmpty(tbody, 9, 'No hay lotes que coincidan.');
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
  $('#recentRows').innerHTML = rows.map(row => `<tr><td><b>${display(row.client)}</b></td><td>${display(row.location)}</td><td>${display(row.roomLocation)}</td><td><b>${display(row.model)}</b></td><td>${fmt.format(row.quantity)}</td><td>${badge(row.status)}</td><td>${display(row.origin || row.sourceId)}</td></tr>`).join('');
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
  if (view === 'installations') return filtered(installations.filter(row => !$('#provinceFilter').value || row.province === $('#provinceFilter').value), $('#installSearch').value, ['client', 'location', 'roomLocation', 'province', 'model', 'package', 'signage', 'game', 'status', 'notes']).map(row => ({ Cliente: row.client, Sala: row.location, UbicacionSala: row.roomLocation, GoogleMaps: row.mapsUrl, Provincia: row.province, Modelo: row.model, Cantidad: row.quantity, Paquete: row.package, Carteleria: row.signage, Juego: row.game, Linkeado: row.linked, Estado: row.status, Fecha: formatDateDisplay(row.date), Observaciones: row.notes }));
  if (view === 'stock') return filtered(stock.filter(row => !$('#stockStatusFilter').value || row.status === $('#stockStatusFilter').value), $('#stockSearch').value, ['sourceId', 'client', 'location', 'roomLocation', 'destination', 'model', 'status', 'condition', 'game', 'signage', 'notes', 'sourceClass']).map(row => ({ Lote: row.sourceId, Cliente: row.client, Sala: row.location, UbicacionSala: row.roomLocation, Destino: row.destination, GoogleMaps: row.mapsUrl, Modelo: row.model, Cantidad: row.quantity, Estado: row.status, Condicion: row.condition, ClaseOrigen: row.sourceClass, Juego: row.game, Carteleria: row.signage, Notas: row.notes }));
  if (view === 'upgrades') return filtered(upgrades, $('#upgradeSearch').value, ['id', 'client', 'model', 'from', 'to', 'game', 'type', 'date', 'status', 'notes']).map(row => ({ ID: row.id, Cliente: row.client, Modelo: row.model, Cantidad: row.quantity, PlataformaAnterior: row.from, PlataformaNueva: row.to, Juego: row.game, Fecha: formatDateDisplay(row.date), Estado: row.status, Observaciones: row.notes }));
  const term = $('#machineSearch').value;
  const viewFilter = $('#machineViewFilter').value;
  const status = $('#machineStatusFilter').value;
  const province = $('#machineProvinceFilter')?.value || '';
  const packageName = $('#machinePackageFilter')?.value || '';
  const upgrade = $('#machineUpgradeFilter')?.value || '';
  const date = $('#machineDateFilter')?.value || '';
  const sort = $('#machineSort').value || 'client';
  const matchesView = row => {
    if (!viewFilter) return true;
    if (viewFilter === 'operational') return row.recordType === 'installation' && row.status === 'Operativa';
    if (viewFilter === 'inoperational') return row.recordType === 'installation' && row.status === 'Inoperativa';
    if (viewFilter === 'stock-unassigned') return row.recordType === 'stock' && ['Stock sin destino', 'Nuevo ingreso a stock'].includes(row.status);
    if (viewFilter === 'stock-preparation') return row.recordType === 'stock' && row.status === 'Stock / preparación';
    return row.recordType === viewFilter;
  };
  const matchingRows = machineRowsForView(viewFilter).filter(row => matchesView(row)
    && (!status || row.status === status)
    && (!province || row.province === province)
    && (!packageName || row.package === packageName)
    && (!upgrade || Boolean(row.isUpgrade) === (upgrade === 'yes'))
    && (!date || (date === '__without_date__' ? !row.date : String(row.date || '') === date))
    && (!normalize(term) || normalize(machineSearchText(row)).includes(normalize(term))));
  const rows = sort === 'manual' ? manuallyOrderMachineRows(matchingRows) : sorted(matchingRows, sort);
  return rows.map(row => ({
    Cliente: row.client,
    Sala: row.location,
    UbicacionSala: row.roomLocation,
    GoogleMaps: row.mapsUrl,
    Provincia: row.province,
    Modelo: row.model,
    Cantidad: row.quantity,
    Paquete: row.package,
    Estado: row.status,
    Fecha: formatDateDisplay(row.date),
    Origen: row.origin || row.sourceId,
    Detalle: row.detail,
    Upgrade: row.isUpgrade ? 'Sí' : 'No',
    'Números de serie': [...new Set([...(Array.isArray(row.units) ? row.units.map(unit => unit.serialNumber) : []), ...(Array.isArray(row.serialNumbers) ? row.serialNumbers : [])].filter(Boolean))].join('; '),
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

function showToast(message, type = '') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('toast-success', type === 'success');
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), type === 'success' ? 4200 : 2800);
}

function updateSidebarToggle() {
  const toggle = $('#sidebarToggle');
  const isMobile = window.matchMedia('(max-width: 800px)').matches;
  const isOpen = isMobile ? $('#sidebar').classList.contains('open') : !$('#appShell').classList.contains('sidebar-hidden');
  const label = isOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral';
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
}

function toggleSidebar() {
  const sidebar = $('#sidebar');
  if (window.matchMedia('(max-width: 800px)').matches) {
    sidebar.classList.toggle('open');
  } else {
    $('#appShell').classList.toggle('sidebar-hidden');
    try { localStorage.setItem('novomatic-sidebar-hidden', String($('#appShell').classList.contains('sidebar-hidden'))); } catch { /* Preferencia local opcional. */ }
  }
  updateSidebarToggle();
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
  updateSidebarToggle();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  updateMachineHorizontalNavigator();
}

function focusSavedRecord(recordId, recordType) {
  const findVisibleRow = () => {
    const action = $$('#appShell [data-view-record-id]')
      .find(button => button.dataset.viewRecordId === String(recordId) && button.closest('tr')?.getClientRects().length);
    return action?.closest('tr') || null;
  };
  let row = findVisibleRow();
  if (!row) {
    if (recordType === 'installation') {
      setView('instalaciones', false);
      $('#installSearch').value = '';
      $('#provinceFilter').value = '';
      renderInstallations();
    } else if (recordType === 'assignment') {
      setView('maquinas', false);
      $('#machineSearch').value = '';
      $('#machineViewFilter').value = 'assignment';
      $('#machineStatusFilter').value = '';
      $('#machineProvinceFilter').value = '';
      $('#machinePackageFilter').value = '';
      $('#machineUpgradeFilter').value = '';
      $('#machineDateFilter').value = '';
      renderMachines();
    } else if (recordType === 'stock' || recordType === 'non_egm') {
      setView('stock', false);
      $('#stockSearch').value = '';
      $('#stockStatusFilter').value = '';
      renderStock();
    } else {
      setView('maquinas', false);
      $('#machineSearch').value = '';
      $('#machineViewFilter').value = '';
      $('#machineStatusFilter').value = '';
      $('#machineProvinceFilter').value = '';
      $('#machinePackageFilter').value = '';
      $('#machineUpgradeFilter').value = '';
      $('#machineDateFilter').value = '';
      renderMachines();
    }
    row = findVisibleRow();
  }
  if (!row) return;
  $$('.record-row-highlight').forEach(item => item.classList.remove('record-row-highlight'));
  row.classList.remove('record-row-highlight');
  void row.offsetWidth;
  row.classList.add('record-row-highlight');
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  clearTimeout(focusSavedRecord.timer);
  focusSavedRecord.timer = setTimeout(() => row.classList.remove('record-row-highlight'), 4200);
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
  const serialNumbers = [...new Set([...(Array.isArray(record.serialNumbers) ? record.serialNumbers : []), ...units.map(unit => unit.serialNumber)].map(value => String(value || '').trim()).filter(Boolean))];
  const unitDetails = units.map(unit => [unit.serialNumber, unit.renoId ? `RENO ${unit.renoId}` : '', unit.game].filter(Boolean).join(' · ')).join('\n');
  const fields = [
    ['Tipo de registro', typeLabels[record.recordType] || record.recordType],
    ['Cliente / destino', record.client], ['Sala', record.location], ['Ubicación de sala', record.roomLocation], ['Provincia', record.province],
    ['Lote / origen', record.sourceId], ['Modelo / equipo', record.model], ['Categoría', record.category],
    ['Cantidad', record.quantity == null ? '' : fmt.format(record.quantity)], ['Estado', record.status],
    ['Es upgrade?', record.isUpgrade ? 'Sí' : 'No'], ['Números de serie', serialNumbers.join('; ')],
    ['Paquete', record.package], ['Condición', record.condition], ['Destino', record.destination],
    ['Islas', record.islands], ['Jackpot Controllers', record.jackpotControllers], ['Juego', record.game], ['Cartelería', record.signage],
    ['Linkeada', record.linked], ['Fecha', formatDateDisplay(record.date)], ['Clasificación de origen', record.sourceClass],
    ['Detalle por máquina', unitDetails],
    ['Observaciones', record.notes], ['Fila en la fuente', record.sourceRow]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
  const savedMapUrl = safeGoogleMapsUrl(record.mapsUrl);
  const mapUrl = savedMapUrl || googleMapsSearchUrl(record);
  const mapLink = mapUrl
    ? `<div class="detail-item"><span>Google Maps</span><strong><a class="detail-map-link" href="${escapeHTML(mapUrl)}" target="_blank" rel="noopener noreferrer">${savedMapUrl ? 'Abrir enlace guardado' : 'Buscar ubicación'}</a></strong></div>`
    : '';
  $('#installationDetailContent').innerHTML = fields.map(([label, value]) => {
    const wide = ['Detalle por máquina', 'Números de serie'].includes(label) ? ' detail-item-wide' : '';
    return `<div class="detail-item${wide}"><span>${escapeHTML(label)}</span><strong>${display(value)}</strong></div>`;
  }).join('') + mapLink;
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

function addSerialNumberInput(value = '') {
  const container = $('#serialNumberFields');
  const row = document.createElement('div');
  row.className = 'serial-number-row';
  const label = document.createElement('label');
  label.textContent = 'Número de serie';
  const input = document.createElement('input');
  input.name = 'serialNumbers';
  input.maxLength = 120;
  input.autocomplete = 'off';
  input.value = value;
  label.append(input);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'button button-secondary serial-remove-button';
  remove.textContent = 'Quitar';
  remove.setAttribute('aria-label', 'Quitar número de serie');
  remove.addEventListener('click', () => {
    row.remove();
    if (!container.querySelector('input[name="serialNumbers"]')) addSerialNumberInput();
  });
  row.append(label, remove);
  container.append(row);
}

function setSerialNumberInputs(record) {
  const values = [...new Set([...(Array.isArray(record?.serialNumbers) ? record.serialNumbers : []), ...(Array.isArray(record?.units) ? record.units.map(unit => unit.serialNumber) : [])].map(value => String(value || '').trim()).filter(Boolean))];
  $('#serialNumberFields').replaceChildren();
  (values.length ? values : ['']).forEach(addSerialNumberInput);
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
  setField(form, 'roomLocation', record?.roomLocation || '');
  setField(form, 'mapsUrl', record?.mapsUrl || '');
  setField(form, 'province', record?.province || '');
  setField(form, 'model', record?.model || '');
  setField(form, 'isUpgrade', record?.isUpgrade ? 'true' : 'false');
  setSerialNumberInputs(record);
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
  setupMachineViewControls();
  setupRecordLocationFields();
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
  ['machineViewFilter', 'machineStatusFilter', 'machineUpgradeFilter', 'machineDateFilter', 'machineProvinceFilter', 'machinePackageFilter'].forEach(id => $(`#${id}`).addEventListener('change', renderMachines));
  $('#machineSort').addEventListener('change', () => {
    try { localStorage.setItem(machineSortStorageKey, $('#machineSort').value); } catch { /* Preferencia local opcional. */ }
    renderMachines();
  });
  $('#installSearch').addEventListener('input', renderInstallations);
  $('#provinceFilter').addEventListener('change', renderInstallations);
  $('#installSort').addEventListener('change', renderInstallations);
  $('#stockSearch').addEventListener('input', renderStock);
  $('#stockStatusFilter').addEventListener('change', renderStock);
  $('#upgradeSearch').addEventListener('input', renderUpgrades);
  $$('[data-export]').forEach(button => button.addEventListener('click', () => exportCSV(button.dataset.export || 'machines')));
  $('#newRecordButton').addEventListener('click', () => openRecord(null));
  $('#addSerialNumber').addEventListener('click', () => addSerialNumberInput());
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
    input.serialNumbers = values.getAll('serialNumbers');
    input.quantity = Number(input.quantity);
    input.date = form.elements.namedItem('date').dataset.isoDate || '';
    const errorBox = $('#recordError');
    const button = form.querySelector('button[type="submit"]');
    errorBox.hidden = true;
    button.disabled = true;
    try {
      const saved = await request(id ? `/api/records/${id}` : '/api/records', { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) });
      $('#recordDialog').close();
      await loadMaestra();
      focusSavedRecord(id ? Number(id) : Number(saved?.id), input.recordType);
      const recordLabel = [input.client || input.destination || 'registro', input.location, input.roomLocation, input.model, input.status].filter(Boolean).join(' · ');
      showToast(id ? `Cambios en ${recordLabel} guardados exitosamente.` : `${recordLabel} agregado exitosamente.`, 'success');
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
  $('#searchGoogleMaps').addEventListener('click', () => {
    const form = $('#recordForm');
    const url = googleMapsSearchUrl({
      client: form.elements.client.value,
      location: form.elements.location.value,
      roomLocation: form.elements.roomLocation.value,
      province: form.elements.province.value
    });
    if (!url) {
      showToast('Completá el cliente, la sala o la provincia para buscar el casino.');
      return;
    }
    if (!form.elements.mapsUrl.value) form.elements.mapsUrl.value = url;
    window.open(url, '_blank', 'noopener,noreferrer');
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
  $('#sidebarToggle').addEventListener('click', toggleSidebar);
  window.addEventListener('resize', updateSidebarToggle);
  try { $('#appShell').classList.toggle('sidebar-hidden', localStorage.getItem('novomatic-sidebar-hidden') === 'true'); } catch { /* Preferencia local opcional. */ }
  updateSidebarToggle();
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
