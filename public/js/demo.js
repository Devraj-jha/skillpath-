import { escapeHTML, icon, levelLabel, statusLabel, safeURL, prettyDate, notify } from './core.js';

const STORAGE = 'skillpath:demo-lab:v2';
const starterLevels = {
  html: 1, css: 1, javascript: 1, typescript: 0, react: 0, node: 0, sql: 0, git: 1, dsa: 0, python: 1,
  statistics: 0, excel: 1, pandas: 0, visualization: 0, networking: 1, linux: 0, security: 0, owasp: 0,
  communication: 1, 'problem-solving': 1, teamwork: 1, 'critical-thinking': 0
};
const balancedLevels = {
  html: 2, css: 1, javascript: 2, typescript: 0, react: 1, node: 1, sql: 1, git: 2, dsa: 1, python: 1,
  statistics: 0, excel: 1, pandas: 0, visualization: 0, networking: 1, linux: 1, security: 0, owasp: 0,
  communication: 2, 'problem-solving': 2, teamwork: 1, 'critical-thinking': 1
};
const advancedLevels = {
  html: 3, css: 3, javascript: 3, typescript: 2, react: 2, node: 2, sql: 2, git: 3, dsa: 2, python: 2,
  statistics: 2, excel: 2, pandas: 2, visualization: 2, networking: 2, linux: 2, security: 2, owasp: 2,
  communication: 3, 'problem-solving': 3, teamwork: 2, 'critical-thinking': 2
};
const personaLevels = { starter: starterLevels, balanced: balancedLevels, advanced: advancedLevels };

let data = { roles: [], skills: [], resources: [] };
let state = loadState();

function loadState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    return {
      roleId: value.roleId || 'web-developer',
      persona: value.persona || 'balanced',
      skillLevels: { ...balancedLevels, ...(value.skillLevels || {}) },
      customSkills: Array.isArray(value.customSkills) ? value.customSkills : [],
      tasks: value.tasks || {},
      activeTab: value.activeTab || 'overview',
      showSoft: value.showSoft !== false
    };
  } catch {
    return { roleId: 'web-developer', persona: 'balanced', skillLevels: { ...balancedLevels }, customSkills: [], tasks: {}, activeTab: 'overview', showSoft: true };
  }
}
function persist() { localStorage.setItem(STORAGE, JSON.stringify(state)); }
function roleNow() { return data.roles.find(role => role.id === state.roleId) || data.roles[0]; }
function catalogSkill(id) { return data.skills.find(skill => skill.id === id) || state.customSkills.find(skill => skill.id === id) || { id, name: id, category: 'Custom skill' }; }

export async function initializeDemo() {
  try {
    const result = await fetch('/api/roles').then(res => { if (!res.ok) throw new Error('Unable to load career data.'); return res.json(); });
    data.roles = result.roles || [];
    data.skills = result.skills || [];
    try {
      const resources = await fetch('/api/health').then(res => res.json());
      if (resources.ok) {
        const response = await fetch('/api/roles');
        if (response.ok) data.roles = (await response.json()).roles || data.roles;
      }
    } catch { /* role data is already available */ }
    const resourceResponse = await fetch('/api/resources-public').catch(() => null);
    if (resourceResponse?.ok) data.resources = (await resourceResponse.json()).resources || [];
  } catch (error) {
    console.warn('SkillPath demo data could not be loaded:', error);
    data.roles = [];
    data.skills = [];
  }
  if (data.roles.length && !data.roles.some(role => role.id === state.roleId)) state.roleId = data.roles[0].id;
  persist();
}

export function getDemoState() { return state; }
export function getDemoRole() { return roleNow(); }

export function calculateDemo() {
  const role = roleNow();
  if (!role) return { match: 0, comparisons: [], counts: { possessed: 0, improve: 0, missing: 0 }, role: null };
  const catalog = [...data.skills, ...state.customSkills];
  const requirements = [...role.skills, ...state.customSkills.map(skill => ({ skillId: skill.id, required: skill.required, weight: skill.weight, why: 'Added by you to test a custom role requirement.' }))];
  let total = 0; let weighted = 0;
  const comparisons = requirements.map(item => {
    const current = Math.max(0, Math.min(3, Number(state.skillLevels[item.skillId]) || 0));
    const required = Math.max(0, Math.min(3, Number(item.required) || 0));
    const weight = Math.max(.01, Number(item.weight) || 1);
    const contribution = required === 0 ? 1 : Math.min(current / required, 1);
    weighted += contribution * weight; total += weight;
    const status = current === 0 ? 'missing' : current < required ? 'improve' : 'possessed';
    const skill = catalog.find(s => s.id === item.skillId) || catalogSkill(item.skillId);
    return { skillId: item.skillId, name: skill.name, category: skill.category, current, required, weight, contribution: Math.round(contribution * 100), status, why: item.why || '', custom: state.customSkills.some(s => s.id === item.skillId) };
  });
  const counts = comparisons.reduce((acc, item) => { acc[item.status] += 1; return acc; }, { possessed: 0, improve: 0, missing: 0 });
  return { match: total ? Math.round(weighted / total * 100) : 0, comparisons, counts, role };
}

function recommendationsFor(report) {
  const priority = { missing: 0, improve: 1, possessed: 2 };
  return report.comparisons.slice().sort((a, b) => priority[a.status] - priority[b.status] || b.weight - a.weight).map(item => {
    const meta = item.status === 'missing'
      ? ['Start with the fundamentals', 'Build a small, focused example before moving on.']
      : item.status === 'improve'
        ? ['Practice with intention', 'Use the concept in a realistic feature or exercise.']
        : ['Turn this into evidence', 'Show this competency in a project you can explain.'];
    const resource = data.resources.find(r => r.skillId === item.skillId && (item.status !== 'missing' || r.level === 'Foundation')) || data.resources.find(r => r.skillId === item.skillId);
    return { ...item, action: meta[0], note: meta[1], resource };
  });
}

function skillRow(item) {
  const statusColor = item.status === 'possessed' ? 'var(--success)' : item.status === 'improve' ? 'var(--gold)' : 'var(--danger)';
  const isHidden = !state.showSoft && item.category === 'Soft skills';
  return `<div class="skill-row" data-skill-row="${escapeHTML(item.skillId)}" ${isHidden ? 'hidden' : ''}>
    <div class="skill-name"><strong>${escapeHTML(item.name)}${item.custom ? ' <span class="mono subtle">· custom</span>' : ''}</strong><small>${escapeHTML(item.category || 'Core skill')} · target ${item.required}/3</small></div>
    <div class="skill-bar" aria-label="${item.contribution}% of target"><i style="width:${item.contribution}%;--bar:${statusColor}"></i></div>
    <select class="select skill-level-select" data-demo-skill="${escapeHTML(item.skillId)}" aria-label="Your level in ${escapeHTML(item.name)}">${[0,1,2,3].map(level => `<option value="${level}" ${item.current === level ? 'selected' : ''}>${level} · ${levelLabel(level)}</option>`).join('')}</select>
    <span class="status-tag ${item.status}">${statusLabel(item.status)}</span>
  </div>`;
}

function scoreMarkup(report) {
  const circumference = 345;
  return `<div class="panel score-card">
    <div class="score-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="55"></circle><circle class="value" cx="60" cy="60" r="55" style="stroke-dasharray:${(circumference * report.match / 100).toFixed(1)} ${circumference}"></circle></svg><div class="score-ring-content"><strong class="score-ring-number">${report.match}</strong><span class="score-ring-percent">MATCH / 100</span></div></div>
    <div class="score-content"><span class="eyebrow">Current alignment</span><h2>${report.match >= 80 ? 'A strong foundation.' : report.match >= 60 ? 'You have momentum.' : report.match >= 40 ? 'A clear path forward.' : 'Start with one skill.'}</h2><p>This score compares your current self-rated skill levels with the requirements for <strong>${escapeHTML(report.role.title)}</strong>. It is a learning indicator, not a hiring prediction.</p>
      <div class="score-stats"><span class="score-stat"><i class="stat-dot" style="--stat-color:var(--success)"></i>${report.counts.possessed} possessed</span><span class="score-stat"><i class="stat-dot" style="--stat-color:var(--gold)"></i>${report.counts.improve} to improve</span><span class="score-stat"><i class="stat-dot" style="--stat-color:var(--danger)"></i>${report.counts.missing} missing</span></div>
    </div>
  </div>`;
}

function overviewView(report, recommendations) {
  const visible = report.comparisons.filter(item => state.showSoft || item.category !== 'Soft skills').slice(0, 7);
  const top = recommendations.slice(0, 3);
  return `<div class="demo-view">
    ${scoreMarkup(report)}
    <div class="panel"><div class="demo-card-head"><div><h3>Your skill snapshot</h3><p>Change any level to recalculate your alignment.</p></div><button class="btn btn-ghost btn-small" data-demo-tab="skills">Edit all skills ${icon('arrow', 12)}</button></div><div class="demo-card-body"><div class="skill-list">${visible.map(skillRow).join('')}</div>${report.comparisons.length > 7 ? `<p class="field-hint">Showing 7 skills. Open the Skill matrix tab to see every requirement.</p>` : ''}</div></div>
    <div class="panel"><div class="demo-card-head"><div><h3>Best next moves</h3><p>Prioritised by the size and importance of your gaps.</p></div><button class="btn btn-ghost btn-small" data-demo-tab="next">See pathway ${icon('arrow', 12)}</button></div><div class="demo-card-body"><div class="recommendation-grid">${top.map((item, i) => `<article class="recommendation-card"><span class="rec-kind">${String(i + 1).padStart(2,'0')} / ${item.status === 'missing' ? 'FOUNDATION' : item.status === 'improve' ? 'PRACTICE' : 'APPLY'}</span><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.action)}. ${escapeHTML(item.note)}</p>${item.resource ? `<a href="${safeURL(item.resource.url)}" target="_blank" rel="noopener">Explore ${escapeHTML(item.resource.provider)} ${icon('external', 11)}</a>` : ''}</article>`).join('')}</div></div></div>
  </div>`;
}

function skillsView(report) {
  return `<div class="demo-view"><div class="panel"><div class="demo-card-head"><div><h3>Skill matrix</h3><p>Set your level honestly. Each role has its own required level and weighting.</p></div><label class="small muted" style="display:flex;align-items:center;gap:7px"><input type="checkbox" data-demo-show-soft ${state.showSoft ? 'checked' : ''}> Include soft skills</label></div><div class="demo-card-body"><div class="skill-list">${report.comparisons.map(skillRow).join('')}</div><div class="add-skill-panel"><span>Add a requirement that matters to your target role.</span><button class="btn btn-secondary btn-small" data-demo-action="toggle-custom">${icon('plus', 12)} Add custom skill</button></div><form class="custom-skill-form" data-demo-custom-form hidden><div class="field"><label for="custom-skill-name">Skill name</label><input class="input" id="custom-skill-name" name="name" placeholder="e.g. Figma" maxlength="45" required></div><div class="field"><label for="custom-skill-required">Required level</label><select class="select" id="custom-skill-required" name="required"><option value="1">1 · Beginner</option><option value="2" selected>2 · Intermediate</option><option value="3">3 · Proficient</option></select></div><div class="field"><label for="custom-skill-weight">Importance</label><select class="select" id="custom-skill-weight" name="weight"><option value="0.7">Low</option><option value="1" selected>Normal</option><option value="1.5">High</option><option value="2">Critical</option></select></div><button class="btn btn-primary btn-small" type="submit">Add requirement</button></form></div></div><p class="demo-footer-note">Level guide: 0 = no exposure · 1 = can follow a tutorial · 2 = can build independently · 3 = can explain trade-offs and help others. You can edit the self-rating at any time.</p></div>`;
}

function nextView(report, recommendations) {
  const role = report.role;
  const roadmap = role.roadmap || [];
  const done = Object.values(state.tasks).filter(status => status === 'completed').length;
  const pct = roadmap.length ? Math.round(done / roadmap.length * 100) : 0;
  return `<div class="demo-view"><div class="panel"><div class="demo-card-head"><div><h3>Your next learning moves</h3><p>Resources are matched to the skill gaps in this scenario.</p></div><span class="status-tag planned">${recommendations.length} focus areas</span></div><div class="demo-card-body"><div class="recommendation-grid">${recommendations.slice(0, 8).map((item, i) => `<article class="recommendation-card"><span class="rec-kind">${item.status === 'missing' ? 'FOUNDATION' : item.status === 'improve' ? 'PRACTICE' : 'PORTFOLIO'} · ${String(i + 1).padStart(2,'0')}</span><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.action)}. ${escapeHTML(item.note)}</p>${item.resource ? `<a href="${safeURL(item.resource.url)}" target="_blank" rel="noopener">${escapeHTML(item.resource.title)} ${icon('external', 11)}</a>` : '<span class="field-hint">Create a short practice activity for this skill.</span>'}</article>`).join('')}</div></div></div>
    <div class="panel"><div class="demo-card-head"><div><h3>${escapeHTML(role.title)} learning roadmap</h3><p>Mark each milestone to see how your plan develops.</p></div><strong class="mono" style="color:var(--accent);font-size:11px">${pct}% complete</strong></div><div class="demo-card-body"><div class="progress-track" style="margin-bottom:16px"><i style="width:${pct}%"></i></div><div class="demo-steps">${roadmap.map((task, i) => { const status = state.tasks[task.id] || 'planned'; return `<div class="demo-roadmap-item"><button class="roadmap-check ${status === 'completed' ? 'completed' : ''}" data-demo-task="${escapeHTML(task.id)}" title="Cycle status: ${statusLabel(status)}">${status === 'completed' ? icon('check', 13) : String(i + 1).padStart(2,'0')}</button><div><strong>${escapeHTML(task.title)}</strong><p>${escapeHTML(task.detail)}</p><span class="field-hint">${escapeHTML(task.stage)} · ${escapeHTML(task.estimate || 'Flexible pace')}</span></div><span class="roadmap-meta">${statusLabel(status)}</span></div>`; }).join('')}</div></div></div>
  </div>`;
}

function controlsMarkup(report) {
  return `<aside class="panel demo-controls"><div class="panel-overline"><span>01 / Scenario lab</span><span>LIVE</span></div>
    <div class="demo-control-block"><div class="field"><label for="demo-role">Target career</label><select id="demo-role" class="select" data-demo-role>${data.roles.map(role => `<option value="${escapeHTML(role.id)}" ${role.id === state.roleId ? 'selected' : ''}>${escapeHTML(role.title)}</option>`).join('')}</select><span class="field-hint">The benchmark changes with your selection.</span></div></div>
    <div class="demo-control-block"><div class="field-label" style="margin-bottom:9px">Choose a student profile</div><div class="persona-list">
      <button type="button" data-demo-persona="starter" class="persona-option ${state.persona === 'starter' ? 'active' : ''}"><span class="persona-icon">${icon('sprout', 14)}</span><span><strong>Starting out</strong><small>New to most skills</small></span></button>
      <button type="button" data-demo-persona="balanced" class="persona-option ${state.persona === 'balanced' ? 'active' : ''}"><span class="persona-icon">${icon('layers', 14)}</span><span><strong>Balanced builder</strong><small>Some skills, some gaps</small></span></button>
      <button type="button" data-demo-persona="advanced" class="persona-option ${state.persona === 'advanced' ? 'active' : ''}"><span class="persona-icon">${icon('zap', 14)}</span><span><strong>Strong generalist</strong><small>Confident across domains</small></span></button>
    </div></div>
    <div class="demo-control-block"><div class="field-label" style="margin-bottom:9px">Proficiency scale</div><div class="demo-note"><strong>0 — No exposure</strong><br>Haven't used it yet.<br><strong>1 — Beginner</strong><br>Can follow a guided example.<br><strong>2 — Intermediate</strong><br>Can build independently.<br><strong>3 — Proficient</strong><br>Can explain and adapt it.</div></div>
    <div class="demo-control-block"><div class="field-label" style="margin-bottom:9px">Your experiment</div><button type="button" class="btn btn-secondary btn-small" style="width:100%" data-demo-action="reset">${icon('refresh', 12)} Reset this scenario</button><p class="field-hint" style="margin:9px 0 0">Edits are stored locally in this browser. No account is created.</p></div>
  </aside>`;
}

function rightRail(report, recommendations) {
  const focus = recommendations.filter(item => item.status !== 'possessed').slice(0, 3);
  return `<aside class="demo-right">
    <div class="panel insight-card"><div class="panel-overline"><span>02 / At a glance</span>${icon('chart', 13)}</div><h3>How the score breaks down</h3><div class="insight-stat-list"><div class="insight-stat"><span>Possessed skills</span><strong>${report.counts.possessed}</strong></div><div class="insight-line"></div><div class="insight-stat"><span>Needs improvement</span><strong>${report.counts.improve}</strong></div><div class="insight-line"></div><div class="insight-stat"><span>Missing skills</span><strong>${report.counts.missing}</strong></div><div class="insight-line"></div><div class="insight-stat"><span>Role requirements</span><strong>${report.comparisons.length}</strong></div></div></div>
    <div class="panel insight-card"><div class="panel-overline"><span>03 / Focus queue</span>${icon('target', 13)}</div><h3>Start here</h3>${focus.length ? focus.map((item, i) => `<div class="mini-recommendation"><span class="rec-number">0${i + 1}</span><div><strong>${escapeHTML(item.name)}</strong><small>${item.status === 'missing' ? 'Begin with the basics' : `Build from level ${item.current} to ${item.required}`}</small></div></div>`).join('') : '<p class="field-hint">You meet every current requirement. Add a stretch skill to keep growing.</p>'}</div>
    <div class="panel insight-card"><div class="panel-overline"><span>Transparent logic</span>${icon('binary', 13)}</div><h3>How we calculate</h3><p class="field-hint" style="margin:0 0 9px">Each skill earns credit up to its required level. More important skills carry more weight.</p><div class="demo-note mono" style="font-size:9px">Σ(weight × min(level ÷ required, 1)) ÷ Σ(weight) × 100</div><p class="field-hint" style="margin:9px 0 0">This is a learning alignment estimate, not a job-readiness guarantee.</p></div>
  </aside>`;
}

export function renderDemoPage() {
  if (!data.roles.length) return `<main class="demo-page"><div class="container"><div class="panel empty-state"><div class="empty-icon">${icon('layers', 22)}</div><h3>Demo data is not available</h3><p>The career dataset could not be loaded. Start the Node.js server and refresh this page.</p><button class="btn btn-primary" data-demo-action="reload">Try again</button></div></div></main>`;
  const report = calculateDemo();
  const recommendations = recommendationsFor(report);
  const activeContent = state.activeTab === 'skills' ? skillsView(report) : state.activeTab === 'next' ? nextView(report, recommendations) : overviewView(report, recommendations);
  return `<main class="demo-page"><div class="container">
    <div class="demo-heading"><div><span class="eyebrow">Interactive product tour / SIH26134</span><h1 class="demo-title display">A real look at your <span>career alignment.</span></h1><p class="demo-subtitle">Explore the platform with a live sample profile. Change careers, adjust your skill levels and build a learning path — no sign-up, no locked features.</p></div><div class="demo-actions"><span class="demo-status">No login required</span><button class="btn btn-secondary btn-small" data-demo-action="export">${icon('download', 12)} Export scenario</button><button class="btn btn-primary btn-small" data-demo-action="print">${icon('file', 12)} Print report</button></div></div>
    <div class="demo-workspace">${controlsMarkup(report)}<section class="demo-main"><div class="demo-tabs" role="tablist" aria-label="Demo sections"><button class="demo-tab ${state.activeTab === 'overview' ? 'active' : ''}" data-demo-tab="overview" role="tab" aria-selected="${state.activeTab === 'overview'}">Alignment overview</button><button class="demo-tab ${state.activeTab === 'skills' ? 'active' : ''}" data-demo-tab="skills" role="tab" aria-selected="${state.activeTab === 'skills'}">Skill matrix</button><button class="demo-tab ${state.activeTab === 'next' ? 'active' : ''}" data-demo-tab="next" role="tab" aria-selected="${state.activeTab === 'next'}">Learning pathway</button></div>${activeContent}</section>${rightRail(report, recommendations)}</div>
    <div class="demo-bottom-strip" style="margin-top:14px"><div><strong>Try a different path.</strong><span>Switch to Data Analyst or Cybersecurity Associate and watch the skill benchmark change.</span></div><button class="btn btn-secondary btn-small" data-demo-action="cycle-role">Explore another career ${icon('arrow', 12)}</button></div>
    <p class="demo-footer-note">Demonstration data is fictional. Your adjustments are stored only in your browser using local storage. The assessment uses the transparent weighted matching formula described above.</p>
  </div></main>`;
}

export function handleDemoChange(target) {
  if (target.matches('[data-demo-role]')) {
    state.roleId = target.value;
    state.persona = 'balanced';
    state.skillLevels = { ...balancedLevels };
    state.tasks = {};
    state.customSkills = [];
    persist();
    return true;
  }
  if (target.matches('[data-demo-skill]')) {
    state.skillLevels[target.dataset.demoSkill] = Number(target.value);
    persist();
    return true;
  }
  if (target.matches('[data-demo-show-soft]')) {
    state.showSoft = target.checked;
    persist();
    return true;
  }
  return false;
}

export function handleDemoClick(target) {
  const persona = target.closest('[data-demo-persona]');
  if (persona) {
    state.persona = persona.dataset.demoPersona;
    state.skillLevels = { ...personaLevels[state.persona] };
    persist();
    return true;
  }
  const tab = target.closest('[data-demo-tab]');
  if (tab) { state.activeTab = tab.dataset.demoTab; persist(); return true; }
  const task = target.closest('[data-demo-task]');
  if (task) {
    const id = task.dataset.demoTask;
    const current = state.tasks[id] || 'planned';
    state.tasks[id] = current === 'planned' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'planned';
    persist();
    notify('Roadmap updated', `Marked this milestone as ${statusLabel(state.tasks[id]).toLowerCase()}.`);
    return true;
  }
  const action = target.closest('[data-demo-action]')?.dataset.demoAction;
  if (!action) return false;
  if (action === 'reset') {
    state = { roleId: state.roleId, persona: 'balanced', skillLevels: { ...balancedLevels }, customSkills: [], tasks: {}, activeTab: 'overview', showSoft: true };
    persist(); notify('Scenario reset', 'The balanced student profile has been restored.'); return true;
  }
  if (action === 'toggle-custom') {
    const form = document.querySelector('[data-demo-custom-form]');
    if (form) { form.hidden = !form.hidden; if (!form.hidden) form.querySelector('input')?.focus(); }
    return true;
  }
  if (action === 'print') { window.print(); return true; }
  if (action === 'export') { exportScenario(); return true; }
  if (action === 'cycle-role') {
    const index = data.roles.findIndex(role => role.id === state.roleId);
    state.roleId = data.roles[(index + 1) % data.roles.length].id;
    state.persona = 'balanced'; state.skillLevels = { ...balancedLevels }; state.tasks = {}; state.customSkills = [];
    persist(); return true;
  }
  if (action === 'reload') { window.location.reload(); return true; }
  return false;
}

export function handleDemoSubmit(form) {
  if (!form.matches('[data-demo-custom-form]')) return false;
  const values = new FormData(form);
  const name = String(values.get('name') || '').trim();
  if (name.length < 2) { notify('Add a skill name', 'Use at least two characters.', 'warning'); return true; }
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}-${Date.now().toString(36).slice(-4)}`;
  const skill = { id, name: name.slice(0, 45), category: 'Custom skill', required: Number(values.get('required')) || 2, weight: Number(values.get('weight')) || 1 };
  state.customSkills.push(skill);
  state.skillLevels[id] = 0;
  state.activeTab = 'skills';
  persist();
  notify('Custom skill added', `${skill.name} is now part of your scenario.`);
  return true;
}

function exportScenario() {
  const report = calculateDemo();
  const payload = {
    product: 'SkillPath',
    disclaimer: 'Demonstration assessment only; not a guarantee of employment or job readiness.',
    exportedAt: new Date().toISOString(),
    role: report.role.title,
    persona: state.persona,
    matchPercentage: report.match,
    counts: report.counts,
    formula: 'Sum(weight × min(current level / required level, 1)) / sum(weights) × 100',
    skills: report.comparisons,
    roadmapProgress: state.tasks
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'skillpath-demo-report.json'; link.click(); URL.revokeObjectURL(url);
  notify('Scenario exported', 'Your demo report has been saved as a JSON file.');
}
