const iconPaths = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.3-3.1 1.7 1.7 0 0 1 1.2-2.9H18a3 3 0 0 0 3-3c0-5-4-9-9-9Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M3 3v18h18M8 15l4-4 3 3 5-7"/><path d="M17 7h3v3"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4 1a4 4 0 0 1 0 7m6 5v-2a4 4 0 0 0-3-3.87"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5Zm0 0V20a2 2 0 0 0 2 2"/><path d="M8 7h8M8 11h8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.4-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bookOpen: '<path d="M12 7v14m0-14C9 4 5 4 2 5v14c3-1 7-1 10 2m0-14c3-3 7-3 10-2v14c-3-1-7-1-10 2"/>',
  message: '<path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.7A8.5 8.5 0 1 1 21 11.5Z"/>',
  lightbulb: '<path d="M9 18h6m-5 4h4m-5-8.5A6 6 0 1 1 15 13c-.8.8-1 1.5-1 2.5h-4c0-1-.2-1.7-1-2.5Z"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  git: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8m0-7c0 5 12 1 12 7"/>',
  binary: '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/><path d="M14 4h7M3 20h7"/>',
  terminal: '<path d="m4 17 6-5-6-5m8 10h8"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16m6-16v16"/>',
  network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10.5 7.5-4 8m7-8 4 8m-9.5 2.5h8"/>',
  shieldCheck: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  brain: '<path d="M12 18V5a3 3 0 0 0-5.8-1 3 3 0 0 0-2.2 4.8A3.5 3.5 0 0 0 5 15.5 3 3 0 0 0 8 20h1a3 3 0 0 0 3-2Zm0-13a3 3 0 0 1 5.8-1 3 3 0 0 1 2.2 4.8 3.5 3.5 0 0 1-1 7.7 3 3 0 0 1-3 3h-1a3 3 0 0 1-3-2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4L7.7 15a8 8 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.9H14l.3 1.9a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.8Z"/>',
  logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1 8 4.8-2.8 4.8 2.8-1-8"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  external: '<path d="M14 3h7v7m0-7-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  zap: '<path d="m13 2-3 9h7l-6 11 1-9H5l8-11Z"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};

export function icon(name, size = 16, extra = '') {
  const paths = iconPaths[name] || '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8v8H8z"/>';
  return `<svg ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const initials = name => String(name || 'SP').split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'SP';
export const prettyDate = value => value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not yet';
export const levelLabel = level => ['No exposure', 'Beginner', 'Intermediate', 'Proficient'][Number(level)] || 'No exposure';
export const statusLabel = status => ({ possessed: 'Possessed', improve: 'Improve', missing: 'Missing', planned: 'Planned', 'in-progress': 'In progress', completed: 'Completed' }[status] || status);
export const safeURL = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : '#'; } catch { return '#'; } };

export async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { method: options.method || 'GET', credentials: 'include', headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(`/api${path}`, init);
  let payload;
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

export function notify(title, message = '', type = 'success') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.setProperty('--toast-color', type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--gold)' : 'var(--accent)');
  toast.innerHTML = `<div><strong>${escapeHTML(title)}</strong>${message ? `<span>${escapeHTML(message)}</span>` : ''}</div>`;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

const preferenceKey = 'skillpath:appearance:v1';
export function getAppearance() {
  try { return { theme: 'dark', bg: 'grid', accent: 'mint', ...JSON.parse(localStorage.getItem(preferenceKey) || '{}') }; }
  catch { return { theme: 'dark', bg: 'grid', accent: 'mint' }; }
}
export function saveAppearance(patch) {
  const next = { ...getAppearance(), ...patch };
  localStorage.setItem(preferenceKey, JSON.stringify(next));
  applyAppearance(next);
  return next;
}
export function applyAppearance(value = getAppearance()) {
  document.body.dataset.theme = value.theme || 'dark';
  document.body.dataset.bg = value.bg || 'grid';
  document.body.dataset.accent = value.accent || 'mint';
  const theme = value.theme === 'light' ? '#f3f7f5' : '#0b161e';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme);
}

export function appearanceMarkup() {
  const settings = getAppearance();
  const theme = ['dark', 'light'].map(key => `<button type="button" data-theme-choice="${key}" class="${settings.theme === key ? 'active' : ''}">${key === 'dark' ? icon('moon', 12) : icon('sun', 12)} ${key[0].toUpperCase() + key.slice(1)}</button>`).join('');
  const accents = ['mint', 'ocean', 'violet', 'amber'].map(key => `<button type="button" class="swatch ${settings.accent === key ? 'active' : ''}" data-accent-choice="${key}" aria-label="${key} accent" title="${key}"></button>`).join('');
  const bgs = [['plain', 'Plain'], ['grid', 'Grid'], ['pixel', 'Pixel'], ['paper', 'Paper'], ['aurora', 'Aurora']].map(([key, label]) => `<button type="button" data-bg-choice="${key}" class="background-chip ${settings.bg === key ? 'active' : ''}"><span class="bg-preview ${key}"></span>${label}</button>`).join('');
  return `<div class="appearance-panel" data-appearance-panel hidden>
    <div class="appearance-heading"><strong>Make it yours</strong><span class="mono tiny muted">APPEARANCE</span></div>
    <div class="appearance-section"><span class="appearance-label">Color mode</span><div class="segmented">${theme}</div></div>
    <div class="appearance-section"><span class="appearance-label">Accent palette</span><div class="swatch-row">${accents}</div></div>
    <div class="appearance-section"><span class="appearance-label">Canvas background</span><div class="background-options">${bgs}</div></div>
    <p class="field-hint" style="margin:12px 0 0">Your display choices are saved on this device.</p>
  </div>`;
}

export function brandMarkup() {
  return `<a class="brand" href="#/home" aria-label="SkillPath home"><img src="/assets/brand-mark.svg" alt=""><span class="brand-copy"><span class="brand-name">skillpath<span style="color:var(--accent)">.</span></span><span class="brand-tag">learn with direction</span></span></a>`;
}

applyAppearance();
