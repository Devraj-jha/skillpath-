import { icon, escapeHTML, initials, prettyDate, levelLabel, statusLabel, safeURL, apiRequest, notify, brandMarkup, appearanceMarkup, saveAppearance, applyAppearance } from './core.js';
import { renderAuthPage, renderForgotPage, handleAuthSubmit } from './auth.js';
import { initializeDemo, renderDemoPage, handleDemoChange, handleDemoClick, handleDemoSubmit, getDemoState } from './demo.js';

const appRoot = document.getElementById('app');
let currentUser = null;
let dashboardData = null;
let rolesData = [];
let resourcesData = [];
let currentRoute = 'home';
let routeRenderToken = 0;

const appNav = [
  { group: 'Workspace', items: [
    ['overview', 'Overview', 'grid'], ['profile', 'My profile', 'user'], ['careers', 'Career explorer', 'globe'], ['assessment', 'Skill assessment', 'target'], ['gaps', 'Skill gap analysis', 'chart'], ['recommendations', 'Recommendations', 'spark'], ['roadmap', 'Learning roadmap', 'book'], ['projects', 'Projects', 'briefcase'], ['progress', 'Progress', 'award']
  ]},
  { group: 'Personal', items: [['settings', 'Settings', 'settings']] }
];

function siteHeader(active = 'home') {
  const loggedIn = Boolean(currentUser);
  const links = loggedIn
    ? `<a href="#/app/overview" class="${active === 'workspace' ? 'active' : ''}">Workspace</a><a href="#/demo" class="${active === 'demo' ? 'active' : ''}">Demo lab</a><a href="#/home" data-scroll-target="how-it-works">How it works</a>`
    : `<a href="#/home" class="${active === 'home' ? 'active' : ''}">Home</a><a href="#/home" data-scroll-target="careers">Explore careers</a><a href="#/home" data-scroll-target="how-it-works">How it works</a><a href="#/home" data-scroll-target="about">About</a>`;
  return `<header class="site-header"><div class="site-header-inner">${brandMarkup()}<nav class="nav-links" id="main-navigation">${links}</nav><div class="header-actions"><div class="appearance-wrap"><button class="btn-icon" type="button" data-appearance-toggle aria-label="Change appearance" title="Appearance">${icon('palette', 16)}</button>${appearanceMarkup()}</div><button class="btn-icon mobile-menu-btn" type="button" data-mobile-menu aria-label="Open navigation">${icon('menu', 16)}</button>${loggedIn ? `<a class="btn btn-secondary" href="#/app/overview">Go to workspace</a><button class="btn btn-primary" type="button" data-auth-logout>Sign out</button>` : `<a class="btn btn-secondary" href="#/login">Log in</a><a class="btn btn-primary" href="#/register">Get started ${icon('arrow', 13)}</a>`}</div></div></header>`;
}

function landingPage() {
  const roles = [
    ['Software Developer', 'Engineering', 'Turn programming fundamentals into dependable software.', 'code', 'var(--blue)'],
    ['Web Developer', 'Product & web', 'Build accessible interfaces and complete web experiences.', 'globe', 'var(--accent)'],
    ['Data Analyst', 'Data & intelligence', 'Use data to uncover patterns and support decisions.', 'chart', 'var(--gold)'],
    ['Cybersecurity Associate', 'Security & infrastructure', 'Understand systems and strengthen their defences.', 'shield', 'var(--violet)']
  ];
  return `<main>
    <section class="landing-hero"><div class="container hero-grid"><div class="hero-copy"><div class="hero-announcement"><span class="live-dot"></span><span>Student career alignment, made practical</span><b>SIH26134</b></div><h1 class="hero-title display">Your Skills.<span class="line-accent">Your Career.</span>Your Future.</h1><p class="hero-description">Discover where your skills stand, understand what industries expect and build a learning pathway towards the career you want. One honest assessment at a time.</p><div class="hero-ctas"><a class="btn btn-primary" href="#/demo">Try the live demo ${icon('arrow', 15)}</a><a class="btn btn-secondary" href="#/home" data-scroll-target="careers">Explore career paths ${icon('chevron', 14)}</a></div><div class="hero-trust"><div class="avatar-stack"><span>A</span><span>M</span><span>R</span></div><span>Designed for students who want a clearer next step.</span></div><div class="hero-footnote">A student-first skill development platform</div></div><div class="hero-art"><img src="/assets/hero-lab.svg" alt=""><div class="hero-art-caption">${icon('spark', 14)} <span><strong>Small steps.</strong> Visible progress.</span></div><div class="hero-pixel">${Array.from({length:16}, () => '<i></i>').join('')}</div></div></div></section>
    <section class="section section-alt" id="how-it-works"><div class="container"><div class="section-header"><div><span class="section-kicker">01 / the process</span><h2 class="section-title display">Clarity first. Progress next.</h2></div><p class="section-description">SkillPath turns career aspirations into a set of specific, manageable steps — with a clear view of what you already know and what to learn next.</p></div><div class="step-grid">
      <article class="step-card"><div class="step-number"><span>STEP / 01</span>${icon('arrow', 14)}</div><div class="step-icon">${icon('user', 20)}</div><h3>Map your current skills</h3><p>Build a profile of your technical and professional competencies. Rate yourself using a simple four-level scale.</p><span class="pixel-index">01</span></article>
      <article class="step-card"><div class="step-number"><span>STEP / 02</span>${icon('arrow', 14)}</div><div class="step-icon">${icon('target', 20)}</div><h3>Measure the skill gap</h3><p>Compare your skills with a selected career role. See possessed, developing and missing competencies clearly.</p><span class="pixel-index">02</span></article>
      <article class="step-card"><div class="step-number"><span>STEP / 03</span>${icon('arrow', 14)}</div><div class="step-icon">${icon('bookOpen', 20)}</div><h3>Build a learning path</h3><p>Get relevant resources, practice activities and portfolio projects. Track milestones and reassess as you grow.</p><span class="pixel-index">03</span></article>
    </div></div></section>
    <section class="section" id="careers"><div class="container"><div class="section-header"><div><span class="section-kicker">02 / explore possibilities</span><h2 class="section-title display">Choose a direction.<br>Understand the requirements.</h2></div><p class="section-description">Start with one of four example career profiles. Each role has a skill benchmark, a weighted assessment and a staged learning roadmap.</p></div><div class="roles-grid">${roles.map(([title, category, desc, glyph, color]) => `<article class="role-card" style="--role-color:${color}"><div class="role-card-top"><span class="role-glyph">${icon(glyph, 20)}</span><span class="role-tag">${category}</span></div><h3>${title}</h3><p>${desc}</p><div class="role-card-bottom"><span>ROLE PROFILE / 0${roles.findIndex(item => item[0] === title) + 1}</span><a href="#/demo">Try scenario ${icon('arrow', 11)}</a></div></article>`).join('')}</div></div></section>
    <section class="section section-alt" id="about"><div class="container"><div class="section-header"><div><span class="section-kicker">03 / built for the learning journey</span><h2 class="section-title display">Not another course catalogue.</h2></div><p class="section-description">The hard part is not finding more content. It is knowing which skill deserves your attention and how to turn practice into demonstrable ability.</p></div><div class="features-grid"><article class="feature-card dark-feature"><span class="section-kicker">A more useful signal</span><h3>See the shape of your skill profile.</h3><p>Go beyond a single score. Understand the competencies behind it, their importance and how close you are to the required level.</p><div class="feature-demo-bars"><div class="feature-bar-row"><span>JavaScript</span><div class="feature-bar"><i style="width:88%"></i></div><b>88</b></div><div class="feature-bar-row"><span>Databases</span><div class="feature-bar"><i style="width:44%"></i></div><b>44</b></div><div class="feature-bar-row"><span>Communication</span><div class="feature-bar"><i style="width:72%"></i></div><b>72</b></div></div></article><article class="feature-card"><span class="section-kicker">Your next action</span><h3>Turn gaps into a sequence you can follow.</h3><p>Recommendations connect your lowest-alignment skills to learning resources and portfolio-sized tasks.</p><div class="feature-mini-grid"><div class="feature-mini">${icon('book', 15)} Foundation resources</div><div class="feature-mini">${icon('zap', 15)} Focused practice</div><div class="feature-mini">${icon('briefcase', 15)} Project evidence</div><div class="feature-mini">${icon('chart', 15)} Progress tracking</div></div></article></div></div></section>
    <section class="quote-band"><div class="container quote-content"><blockquote>“A career goal feels less distant when you can see the <span>next useful step.</span>”</blockquote><p class="quote-aside">SkillPath is built around progress you can explain: what you know, what you are building and why it matters.</p></div></section>
    <section class="section"><div class="container"><div class="cta-panel"><div><span class="section-kicker">04 / your first step</span><h2 class="display">See your next move clearly.</h2><p>Open the public demo and experiment with a role, a student profile and individual skill levels. No login needed.</p></div><a href="#/demo" class="btn btn-primary">Explore the demo ${icon('arrow', 15)}</a></div></div></section>
  </main><footer class="footer"><div class="container"><div class="footer-top"><div>${brandMarkup()}<p class="footer-blurb">A web-based skill assessment and career guidance platform created to help students align learning with industry expectations.</p></div><div class="footer-links"><div><strong>Explore</strong><a href="#/demo">Interactive demo</a><a href="#/home" data-scroll-target="careers">Career paths</a><a href="#/home" data-scroll-target="how-it-works">How it works</a></div><div><strong>Platform</strong><a href="#/login">Student login</a><a href="#/register">Create profile</a><a href="#/home" data-scroll-target="about">About SkillPath</a></div></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} SKILLPATH / SIH26134</span><span>Built for learning. Designed for direction.</span></div></div></footer>`;
}

function sidebarLink(id, label, glyph, active, href = `#/app/${id}`) {
  return `<a class="sidebar-link ${active === id ? 'active' : ''}" href="${href}">${icon(glyph, 15)}<span>${label}</span></a>`;
}

function appShell(page, body) {
  const name = currentUser?.name || 'Student';
  const isAdmin = currentUser?.role === 'admin';
  return `${siteHeader('workspace')}<div class="app-layout"><aside class="sidebar" id="app-sidebar"><div class="sidebar-profile"><span class="avatar">${initials(name)}</span><div><strong>${escapeHTML(name)}</strong><small>${isAdmin ? 'Administrator' : 'Student workspace'}</small></div></div>
    ${appNav.map(group => `<div class="sidebar-label">${group.group}</div><nav class="sidebar-nav">${group.items.map(([id,label,glyph]) => sidebarLink(id,label,glyph,page)).join('')}</nav>`).join('')}
    ${isAdmin ? `<div class="sidebar-label">Administration</div><nav class="sidebar-nav">${sidebarLink('admin','Admin console','settings',page)}</nav>` : ''}
    <div class="sidebar-spacer"></div><div class="sidebar-help"><strong>Need a clearer next step?</strong><p>Try another career scenario in the public demo.</p><a href="#/demo" class="text-link">Open demo lab ${icon('arrow', 11)}</a></div><div class="sidebar-bottom"><span>SKILLPATH / 01</span><span>SIH26134</span></div></aside><button class="sidebar-backdrop" id="sidebar-backdrop" data-sidebar-close hidden aria-label="Close navigation"></button>
    <main class="app-main"><div class="app-topbar"><div style="display:flex;align-items:center;gap:10px"><button class="btn-icon mobile-sidebar-toggle" data-sidebar-toggle aria-label="Open workspace navigation">${icon('menu',15)}</button><div class="breadcrumb">WORKSPACE <span style="padding:0 7px;color:var(--subtle)">/</span><b>${escapeHTML(page.replace(/-/g,' '))}</b></div></div><div class="app-top-actions"><a class="btn btn-secondary btn-small" href="#/demo">${icon('spark',12)} Demo lab</a><div class="appearance-wrap"><button class="btn-icon" type="button" data-appearance-toggle aria-label="Change appearance">${icon('palette',15)}</button>${appearanceMarkup()}</div><button class="btn-icon" type="button" data-auth-logout title="Sign out">${icon('logout',15)}</button></div></div>${body}</main></div>`;
}

function pageHeading(kicker, title, desc, action = '') {
  return `<div class="page-heading"><div><span class="section-kicker">${kicker}</span><h1 class="display">${title}</h1><p>${desc}</p></div>${action}</div>`;
}

function overviewContent(data) {
  const profile = data.profile || {};
  const latest = data.latestAssessment;
  const completion = Math.min(100, Math.round((Object.values(profile.skills || {}).filter(level => level > 0).length / Math.max(1, data.skills?.length || 20)) * 100));
  const role = data.roles.find(item => item.id === profile.targetRole);
  const name = (profile.name || currentUser.name).split(' ')[0];
  const recent = latest ? `<div class="content-card"><div class="content-card-header"><div><h3>Latest career alignment</h3><p>${escapeHTML(latest.roleTitle)} · ${prettyDate(latest.createdAt)}</p></div><a class="text-link" href="#/app/gaps">View report ${icon('arrow', 11)}</a></div><div class="content-card-body"><div class="progress-summary"><div style="width:75px;height:75px;display:grid;place-items:center;border-radius:50%;border:7px solid var(--surface-3);border-right-color:var(--accent);font:600 20px var(--font-display)">${latest.match}%</div><div><strong>${latest.counts.possessed + latest.counts.improve + latest.counts.missing} competencies compared</strong><span>${latest.counts.possessed} possessed · ${latest.counts.improve} to improve · ${latest.counts.missing} missing</span></div></div></div></div>` : `<div class="content-card"><div class="empty-state"><div class="empty-icon">${icon('target', 22)}</div><h3>Your first assessment is one step away.</h3><p>Choose a career role, complete your skill profile and see how your current abilities compare.</p><a href="#/app/assessment" class="btn btn-primary btn-small">Start skill assessment ${icon('arrow', 12)}</a></div></div>`;
  const tasksDone = data.stats?.completedRoadmap || 0;
  return `${pageHeading('YOUR WORKSPACE', `Good to have you here, ${escapeHTML(name)}.`, 'Here is a quick read on your profile and the work ahead.', `<a href="#/app/profile" class="btn btn-secondary btn-small">Edit profile ${icon('arrow', 12)}</a>`)}
    <div class="welcome-banner"><div><span class="eyebrow">Your learning dashboard</span><h2>Progress is built one capability at a time.</h2><p>${role ? `Current target: ${escapeHTML(role.title)}. ` : ''}Keep your profile honest and your learning plan focused. Your next reassessment will reflect the skills you add here.</p></div><a href="#/app/assessment" class="btn btn-primary btn-small">${latest ? 'Reassess skills' : 'Assess my skills'} ${icon('arrow', 12)}</a></div>
    <div class="app-grid cols-4" style="margin-bottom:14px"><article class="metric-card"><div class="metric-top"><span>Profile completeness</span><span class="metric-icon">${icon('user',14)}</span></div><strong class="metric-value">${completion}%</strong><div class="progress-track" style="margin-top:10px"><i style="width:${completion}%"></i></div><div class="metric-foot">${Object.values(profile.skills || {}).filter(level => level > 0).length} skills added</div></article><article class="metric-card"><div class="metric-top"><span>Career match</span><span class="metric-icon">${icon('target',14)}</span></div><strong class="metric-value">${latest ? `${latest.match}%` : '—'}</strong><div class="metric-foot">${latest ? 'Latest assessment score' : 'Not assessed yet'}</div></article><article class="metric-card"><div class="metric-top"><span>Skills to improve</span><span class="metric-icon">${icon('layers',14)}</span></div><strong class="metric-value">${latest?.counts?.improve ?? '—'}</strong><div class="metric-foot">${latest ? `${latest.counts.missing} skills not yet recorded` : 'Run an assessment to reveal gaps'}</div></article><article class="metric-card"><div class="metric-top"><span>Roadmap completed</span><span class="metric-icon">${icon('checkCircle',14)}</span></div><strong class="metric-value">${tasksDone}</strong><div class="metric-foot">Milestones marked complete</div></article></div>
    <div class="app-grid cols-2"><div>${recent}</div><div class="content-card"><div class="content-card-header"><div><h3>Recommended next actions</h3><p>Keep your momentum focused.</p></div>${icon('spark', 15)}</div><div class="content-card-body"><div class="mini-recommendation"><span class="rec-number">01</span><div><strong>Complete your skill profile</strong><small>Rate your current technical and soft skills honestly.</small></div></div><div class="mini-recommendation"><span class="rec-number">02</span><div><strong>${latest ? 'Review your strongest gaps' : 'Choose a career to explore'}</strong><small>${latest ? 'Start with one missing high-priority competency.' : 'Compare your skills against a role benchmark.'}</small></div></div><div class="mini-recommendation"><span class="rec-number">03</span><div><strong>Build proof through a project</strong><small>Apply a skill in something you can demonstrate.</small></div></div></div></div></div>`;
}

function profileContent(profile, roles, skills) {
  profile = profile || { skills: {}, projects: [], interests: [] };
  const group = [...new Set(skills.map(skill => skill.category))];
  const skillControls = group.map(category => `<div class="content-card" style="margin-bottom:12px"><div class="content-card-header"><h3>${escapeHTML(category)}</h3><span class="mono tiny muted">${skills.filter(item => item.category === category).length} SKILLS</span></div><div class="content-card-body"><div class="profile-skills">${skills.filter(item => item.category === category).map(skill => `<div class="profile-skill"><div><strong>${escapeHTML(skill.name)}</strong><small>${escapeHTML(skill.description || '')}</small></div><select class="select" name="skill_${escapeHTML(skill.id)}" aria-label="${escapeHTML(skill.name)} proficiency">${[0,1,2,3].map(level => `<option value="${level}" ${(Number(profile.skills?.[skill.id]) || 0) === level ? 'selected' : ''}>${level} · ${levelLabel(level)}</option>`).join('')}</select></div>`).join('')}</div></div></div>`).join('');
  const project = profile.projects?.[0] || {};
  return `${pageHeading('PROFILE / YOUR BASELINE', 'Your skills, in context.', 'Keep your profile current. SkillPath uses these details to calculate your career alignment.')}
    <form data-profile-form><div class="app-grid cols-2"><div><div class="content-card" style="margin-bottom:13px"><div class="content-card-header"><div><h3>Academic profile</h3><p>Your current learning context.</p></div>${icon('user',15)}</div><div class="content-card-body"><div class="form-grid"><div class="field"><label>Full name</label><input class="input" name="name" value="${escapeHTML(profile.name || currentUser.name)}" required></div><div class="field"><label>Email</label><input class="input" value="${escapeHTML(currentUser.email)}" disabled></div><div class="field span-2"><label>College / institution</label><input class="input" name="college" value="${escapeHTML(profile.college || '')}" placeholder="Your college"></div><div class="field span-2"><label>Programme</label><input class="input" name="programme" value="${escapeHTML(profile.programme || 'B.Tech Computer Science & Engineering')}"></div><div class="field"><label>Current semester</label><select class="select" name="semester">${Array.from({length:8}, (_,i) => `<option value="${i+1}" ${String(profile.semester || '5') === String(i+1) ? 'selected' : ''}>Semester ${i+1}</option>`).join('')}</select></div><div class="field"><label>Graduation year</label><input class="input" name="graduationYear" value="${escapeHTML(profile.graduationYear || '')}" placeholder="2027"></div><div class="field span-2"><label>Target career</label><select class="select" name="targetRole">${roles.map(role => `<option value="${escapeHTML(role.id)}" ${profile.targetRole === role.id ? 'selected' : ''}>${escapeHTML(role.title)}</option>`).join('')}</select></div><div class="field span-2"><label>Interests <span class="muted">· comma separated</span></label><input class="input" name="interests" value="${escapeHTML((profile.interests || []).join(', '))}" placeholder="Frontend, AI, problem solving"></div></div></div></div>
      <div class="content-card"><div class="content-card-header"><div><h3>Project evidence</h3><p>One project is enough to start.</p></div>${icon('briefcase',15)}</div><div class="content-card-body"><div class="field" style="margin-bottom:12px"><label>Project title</label><input class="input" name="projectTitle" value="${escapeHTML(project.title || '')}" placeholder="e.g. Campus Notes"></div><div class="field" style="margin-bottom:12px"><label>Short description</label><textarea class="textarea" name="projectDescription" placeholder="What does it do?">${escapeHTML(project.description || '')}</textarea></div><div class="field" style="margin-bottom:12px"><label>Technologies <span class="muted">· comma separated</span></label><input class="input" name="projectTechnologies" value="${escapeHTML((project.technologies || []).join(', '))}" placeholder="HTML, CSS, JavaScript"></div><div class="field"><label>GitHub URL</label><input class="input" type="url" name="projectGithub" value="${escapeHTML(project.github || '')}" placeholder="https://github.com/username/project"></div></div></div></div>
      <div><div class="content-card"><div class="content-card-header"><div><h3>Skill proficiency</h3><p>Be candid — this is a starting point, not a grade.</p></div><span class="status-tag planned">4 LEVELS</span></div><div class="content-card-body"><div class="demo-note" style="margin-bottom:15px"><strong>0 No exposure</strong> · Haven't used it yet.<br><strong>1 Beginner</strong> · Can follow a guided example.<br><strong>2 Intermediate</strong> · Can build independently.<br><strong>3 Proficient</strong> · Can explain and adapt it.</div>${skillControls}</div></div></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" type="submit">Save profile ${icon('check', 13)}</button></div></form>`;
}

function careersContent(roles, profile) {
  return `${pageHeading('CAREER EXPLORER / ROLE LIBRARY', 'Explore the work behind the title.', 'Select a target role to compare your skills against its competencies and learning pathway.')}
  <div class="app-grid cols-2">${roles.map(role => `<article class="role-app-card"><div class="role-card-top"><span class="role-glyph" style="--role-color:${role.color === 'gold' ? 'var(--gold)' : role.color === 'violet' ? 'var(--violet)' : role.color === 'teal' ? 'var(--accent)' : 'var(--blue)'}">${icon(role.icon || 'code', 20)}</span><span class="role-tag">${escapeHTML(role.category)}</span></div><h3>${escapeHTML(role.title)}</h3><p>${escapeHTML(role.description)}</p><div class="role-meta"><span>${escapeHTML(role.level || 'Entry level')}</span><span>${escapeHTML(role.duration || 'Flexible pathway')}</span></div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px"><span class="field-hint">${role.skills.length} competencies · ${role.roadmap.length} milestones</span><button class="btn ${profile.targetRole === role.id ? 'btn-secondary' : 'btn-primary'} btn-small" data-select-role="${escapeHTML(role.id)}">${profile.targetRole === role.id ? 'Current target' : 'Set as target'}</button></div></article>`).join('')}</div>`;
}

function assessmentContent(profile, roles, latest, skills = []) {
  const target = roles.find(role => role.id === profile.targetRole) || roles[0];
  return `${pageHeading('ASSESSMENT / CAREER ALIGNMENT', 'Measure what you know.', 'The assessment compares your self-rated skill levels with a role-specific benchmark.')}<div class="content-card" style="margin-bottom:13px"><div class="content-card-body" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><div><span class="section-kicker">SELECTED ROLE</span><h2 class="display" style="margin:7px 0 5px;font-size:22px">${escapeHTML(target?.title || 'Choose a career')}</h2><p class="muted" style="margin:0;font-size:10px">${escapeHTML(target?.summary || '')}</p></div><div style="display:flex;align-items:center;gap:9px"><select class="select" id="assessment-role" style="min-width:190px">${roles.map(role => `<option value="${escapeHTML(role.id)}" ${target?.id === role.id ? 'selected' : ''}>${escapeHTML(role.title)}</option>`).join('')}</select><button class="btn btn-primary" data-run-assessment>Run assessment ${icon('arrow', 13)}</button></div></div></div>
  <div class="app-grid cols-2"><div class="content-card"><div class="content-card-header"><div><h3>What gets compared?</h3><p>Each role has its own requirements and importance weights.</p></div>${icon('target',15)}</div><div class="content-card-body"><div class="profile-skills">${(target?.skills || []).map(item => `<div class="profile-skill"><div><strong>${escapeHTML(skills.find(skill => skill.id === item.skillId)?.name || item.skillId.replace(/-/g,' '))}</strong><small>${escapeHTML(item.why || 'Role requirement')}</small></div><span class="status-tag planned">${item.required}/3 · W ${item.weight}</span></div>`).join('')}</div></div></div><div class="content-card"><div class="content-card-header"><div><h3>Previous result</h3><p>Your most recent saved assessment.</p></div>${icon('chart',15)}</div><div class="content-card-body">${latest ? `<div class="progress-summary"><div style="font:600 30px var(--font-display);color:var(--accent)">${latest.match}%</div><div><strong>${escapeHTML(latest.roleTitle)}</strong><span>Completed ${prettyDate(latest.createdAt)}</span></div></div><a class="text-link" href="#/app/gaps">Open skill gap report ${icon('arrow', 11)}</a>` : `<div class="empty-state" style="min-height:155px"><div class="empty-icon">${icon('chart',20)}</div><h3>No results yet</h3><p>Run your first assessment to create a baseline.</p></div>`}</div></div></div>
  <div class="admin-note" style="margin-top:13px"><strong style="color:var(--text)">Scoring formula:</strong> Σ(skill weight × min(student level ÷ required level, 1)) ÷ Σ(skill weights) × 100. The match percentage is a learning alignment indicator, not a guarantee of employment.</div>`;
}

function gapsContent(latest) {
  if (!latest) return `${pageHeading('ANALYSIS / SKILL PROFILE', 'Find the distance between here and there.', 'A skill gap report is created after your first assessment.')}<div class="content-card"><div class="empty-state"><div class="empty-icon">${icon('chart',22)}</div><h3>No assessment to analyse yet.</h3><p>Complete your skill profile and run an assessment to see strengths, developing competencies and missing skills.</p><a class="btn btn-primary btn-small" href="#/app/assessment">Run assessment ${icon('arrow', 12)}</a></div></div>`;
  const rows = latest.comparisons || [];
  const groups = ['possessed','improve','missing'];
  return `${pageHeading('ANALYSIS / LATEST ASSESSMENT', 'A clear view of your skill gaps.', `${escapeHTML(latest.roleTitle)} · assessed ${prettyDate(latest.createdAt)}`, `<button class="btn btn-secondary btn-small" data-print-report>${icon('file',12)} Print report</button>`)}
    <div class="app-grid cols-4" style="margin-bottom:14px"><article class="metric-card"><div class="metric-top">Match score</div><strong class="metric-value">${latest.match}%</strong><div class="metric-foot">Weighted role alignment</div></article><article class="metric-card"><div class="metric-top">Possessed</div><strong class="metric-value" style="color:var(--success)">${latest.counts.possessed}</strong><div class="metric-foot">Meets required proficiency</div></article><article class="metric-card"><div class="metric-top">Needs improvement</div><strong class="metric-value" style="color:var(--gold)">${latest.counts.improve}</strong><div class="metric-foot">Some knowledge recorded</div></article><article class="metric-card"><div class="metric-top">Missing</div><strong class="metric-value" style="color:var(--danger)">${latest.counts.missing}</strong><div class="metric-foot">No exposure recorded</div></article></div>
    <div class="content-card"><div class="content-card-header"><div><h3>Competency comparison</h3><p>Current proficiency against the selected role requirement.</p></div><span class="status-tag planned">${rows.length} SKILLS</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Skill</th><th>Current</th><th>Required</th><th>Importance</th><th>Contribution</th><th>Status</th></tr></thead><tbody>${rows.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong><br><span class="field-hint">${escapeHTML(item.category)}</span></td><td>${levelLabel(item.current)}</td><td>${levelLabel(item.required)}</td><td>${item.weight}</td><td><div style="display:flex;align-items:center;gap:8px;min-width:90px"><div class="progress-track" style="width:55px"><i style="width:${item.contribution}%"></i></div><span>${item.contribution}%</span></div></td><td><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></td></tr>`).join('')}</tbody></table></div></div>
    <div class="admin-note" style="margin-top:13px">The score is calculated using the role-specific weights. A skill contributes proportionally up to its required proficiency, so skills above the target do not inflate the score beyond 100%.</div>`;
}

function recommendationsContent(recommendations, assessment) {
  if (!assessment) return `${pageHeading('RECOMMENDATIONS / YOUR NEXT ACTIONS', 'Learn with a reason.', 'Recommendations become personal after you complete a career alignment assessment.')}<div class="content-card"><div class="empty-state"><div class="empty-icon">${icon('spark',22)}</div><h3>Start with an assessment.</h3><p>SkillPath will connect your skill gaps to learning resources, practice activities and project ideas.</p><a class="btn btn-primary btn-small" href="#/app/assessment">Assess my skills ${icon('arrow',12)}</a></div></div>`;
  return `${pageHeading('RECOMMENDATIONS / ACTION QUEUE', 'Make your next hour count.', `Based on your latest ${escapeHTML(assessment.roleTitle)} assessment.`)}<div class="app-grid cols-2">${recommendations.map((item, index) => `<article class="recommendation-app-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span class="section-kicker">${item.status === 'missing' ? 'FOUNDATION' : item.status === 'improve' ? 'PRACTICE' : 'PROJECT' } / ${String(index + 1).padStart(2,'0')}</span><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></div><h4>${escapeHTML(item.skill)}</h4><p><strong style="color:var(--text)">${escapeHTML(item.action)}.</strong> ${escapeHTML(item.note)}</p>${item.resource ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><div><strong style="font-size:9px">${escapeHTML(item.resource.title)}</strong><div class="field-hint">${escapeHTML(item.resource.provider)} · ${escapeHTML(item.resource.level)}</div></div><a href="${safeURL(item.resource.url)}" target="_blank" rel="noopener">Open ${icon('external',11)}</a></div>` : ''}</article>`).join('')}</div>`;
}

function roadmapContent(role, progress) {
  if (!role) return `${pageHeading('LEARNING ROADMAP', 'A practical route to your target.', 'Choose a target career to create a roadmap.')}<div class="content-card"><div class="empty-state"><h3>No target role selected</h3><a href="#/app/careers" class="btn btn-primary btn-small">Explore careers</a></div></div>`;
  const tasks = progress?.tasks || {};
  const done = Object.values(tasks).filter(status => status === 'completed').length;
  const pct = role.roadmap.length ? Math.round(done / role.roadmap.length * 100) : 0;
  const stages = ['Foundation','Intermediate','Advanced'];
  return `${pageHeading('LEARNING ROADMAP / STAGED PLAN', `Build towards ${escapeHTML(role.title)}.`, 'Move through the stages at your own pace. Save progress as you complete each milestone.')}
  <div class="content-card" style="margin-bottom:13px"><div class="content-card-body" style="display:flex;align-items:center;justify-content:space-between;gap:18px"><div><span class="section-kicker">YOUR ROADMAP PROGRESS</span><div style="display:flex;align-items:baseline;gap:10px;margin-top:5px"><strong class="display" style="font-size:27px">${pct}%</strong><span class="muted small">${done} of ${role.roadmap.length} milestones completed</span></div><div class="progress-track" style="width:min(440px,70vw);margin-top:12px"><i style="width:${pct}%"></i></div></div><button class="btn btn-secondary btn-small" data-roadmap-save>${icon('check',12)} Save roadmap</button></div></div>
  <form data-roadmap-form><div class="app-grid cols-3">${stages.map(stage => `<section class="roadmap-stage"><div style="display:flex;align-items:center;justify-content:space-between;gap:9px"><h3>${stage}</h3><span class="mono tiny muted">${role.roadmap.filter(task => task.stage === stage).length} STEPS</span></div>${role.roadmap.filter(task => task.stage === stage).map((task, i) => { const status = tasks[task.id] || 'planned'; return `<div class="roadmap-task"><span class="roadmap-check ${status === 'completed' ? 'completed' : ''}">${status === 'completed' ? icon('check',12) : '0'+(i+1)}</span><div><strong>${escapeHTML(task.title)}</strong><p>${escapeHTML(task.detail)}</p><span class="field-hint">${escapeHTML(task.estimate || 'Flexible pace')}</span></div><select class="select" name="task_${escapeHTML(task.id)}" style="max-width:112px;min-height:31px;padding:4px 6px;font-size:8px"><option value="planned" ${status === 'planned' ? 'selected' : ''}>Planned</option><option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>In progress</option><option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option></select></div>`; }).join('') || '<p class="field-hint">No milestones in this stage yet.</p>'}</section>`).join('')}</div></form>`;
}

function projectsContent(role, profile) {
  const suggestions = role?.projects || [];
  const own = profile?.projects || [];
  return `${pageHeading('PROJECTS / PRACTICAL EVIDENCE', 'Build something you can explain.', 'Project work helps convert learning into visible evidence of capability.')}
  ${own.length ? `<div class="content-card" style="margin-bottom:13px"><div class="content-card-header"><h3>Your project evidence</h3><span class="status-tag possessed">${own.length} ADDED</span></div><div class="content-card-body"><div class="app-grid cols-2">${own.map(project => `<div class="recommendation-app-card"><span class="section-kicker">YOUR PROJECT</span><h4>${escapeHTML(project.title)}</h4><p>${escapeHTML(project.description || '')}</p><div class="field-hint" style="margin-top:9px">${escapeHTML((project.technologies || []).join(' · '))}</div>${project.github ? `<a href="${safeURL(project.github)}" target="_blank" rel="noopener">GitHub ${icon('external',11)}</a>` : ''}</div>`).join('')}</div><a href="#/app/profile" class="text-link" style="margin-top:14px">Update profile projects ${icon('arrow', 11)}</a></div></div>` : ''}
  <div class="content-card"><div class="content-card-header"><div><h3>Projects for ${escapeHTML(role?.title || 'your selected role')}</h3><p>Choose a scope that stretches one or two skills at a time.</p></div></div><div class="content-card-body"><div class="app-grid cols-3">${suggestions.map((project, i) => `<article class="recommendation-app-card"><span class="section-kicker">${escapeHTML(project.difficulty)} / PROJECT 0${i+1}</span><h4>${escapeHTML(project.title)}</h4><p>${escapeHTML(project.description)}</p><div class="field-hint" style="margin-top:11px">${escapeHTML(project.technologies.join(' · '))}</div></article>`).join('')}</div></div></div>`;
}

function progressContent(dashboard, history) {
  const tasks = Object.values(dashboard.progress?.tasks || {});
  const complete = tasks.filter(status => status === 'completed').length;
  const ongoing = tasks.filter(status => status === 'in-progress').length;
  return `${pageHeading('PROGRESS / YOUR HISTORY', 'Notice the work you have done.', 'A record of your assessments and learning milestones. Reassess after meaningful practice, not every day.')}
  <div class="app-grid cols-3" style="margin-bottom:13px"><article class="metric-card"><div class="metric-top">Assessments completed</div><strong class="metric-value">${dashboard.assessmentCount || 0}</strong><div class="metric-foot">Saved skill snapshots</div></article><article class="metric-card"><div class="metric-top">Milestones completed</div><strong class="metric-value">${complete}</strong><div class="metric-foot">Across your selected roadmap</div></article><article class="metric-card"><div class="metric-top">Currently in progress</div><strong class="metric-value">${ongoing}</strong><div class="metric-foot">Learning activities underway</div></article></div>
  <div class="content-card"><div class="content-card-header"><div><h3>Assessment history</h3><p>Each assessment is a snapshot of your profile at that time.</p></div>${icon('clock',15)}</div>${history.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Career role</th><th>Match score</th><th>Possessed</th><th>Needs work</th><th>Missing</th><th>Date</th></tr></thead><tbody>${history.map(item => `<tr><td><strong>${escapeHTML(item.roleTitle)}</strong></td><td><strong style="color:var(--accent)">${item.match}%</strong></td><td>${item.counts.possessed}</td><td>${item.counts.improve}</td><td>${item.counts.missing}</td><td>${prettyDate(item.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon">${icon('chart',20)}</div><h3>No history yet</h3><p>Your first completed assessment will appear here.</p><a href="#/app/assessment" class="btn btn-primary btn-small">Run assessment</a></div>`}</div>`;
}

function settingsContent() {
  return `${pageHeading('SETTINGS / PREFERENCES', 'Set up your workspace.', 'Your display preferences are stored on this device. Account security is handled by the Node.js backend.')}
  <div class="app-grid cols-2"><div class="content-card"><div class="content-card-header"><div><h3>Display and canvas</h3><p>Make SkillPath easier on your eyes.</p></div>${icon('palette',15)}</div><div class="content-card-body"><p class="muted small">Use the appearance control in the top bar to switch between dark and light modes, choose a premium accent palette or change the background texture.</p><button class="btn btn-secondary btn-small" data-appearance-toggle>${icon('palette',12)} Open appearance options</button></div></div><div class="content-card"><div class="content-card-header"><div><h3>Account details</h3><p>Signed-in identity.</p></div>${icon('lock',15)}</div><div class="content-card-body"><div class="field" style="margin-bottom:12px"><label>Name</label><input class="input" value="${escapeHTML(currentUser.name)}" disabled></div><div class="field"><label>Email</label><input class="input" value="${escapeHTML(currentUser.email)}" disabled></div><p class="field-hint" style="margin-top:12px">Password hashes use Node.js scrypt. Session cookies are HTTP-only and same-site.</p></div></div></div>
  <div class="admin-note" style="margin-top:13px">For a Vercel deployment, configure <span class="mono">SESSION_SECRET</span> and a durable Upstash Redis REST connection. Without an external store, serverless file changes are temporary.</div>`;
}

async function adminContent() {
  const [studentsResult, rolesResult, resourcesResult] = await Promise.all([
    apiRequest('/admin/students'), apiRequest('/roles'), apiRequest('/resources-public')
  ]);
  const students = studentsResult.students || [];
  const roles = rolesResult.roles || [];
  const resources = resourcesResult.resources || [];
  const selectedRole = roles[0];
  const skillsJson = JSON.stringify((selectedRole?.skills || []).map(({skillId,required,weight,why}) => ({skillId,required,weight,why})), null, 2);
  return `${pageHeading('ADMINISTRATION / PLATFORM CONTROL', 'Keep the career library useful.', 'Manage role benchmarks, learning resources and inspect registered student profiles.')}
  <div class="app-grid cols-3" style="margin-bottom:13px"><article class="metric-card"><div class="metric-top">Registered students</div><strong class="metric-value">${students.length}</strong><div class="metric-foot">Student accounts only</div></article><article class="metric-card"><div class="metric-top">Career roles</div><strong class="metric-value">${roles.length}</strong><div class="metric-foot">Maintained benchmarks</div></article><article class="metric-card"><div class="metric-top">Learning resources</div><strong class="metric-value">${resources.length}</strong><div class="metric-foot">Curated reference links</div></article></div>
  <div class="content-card" style="margin-bottom:13px"><div class="content-card-header"><div><h3>Registered students</h3><p>Basic academic details and assessment activity.</p></div>${icon('users',15)}</div>${students.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Institution</th><th>Programme</th><th>Assessments</th><th>Created</th></tr></thead><tbody>${students.map(student => `<tr><td><strong>${escapeHTML(student.name)}</strong><br><span class="field-hint">${escapeHTML(student.email)}</span></td><td>${escapeHTML(student.profile?.college || '—')}</td><td>${escapeHTML(student.profile?.programme || '—')}</td><td>${student.assessmentCount}</td><td>${prettyDate(student.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><h3>No students have registered.</h3></div>`}</div>
  <div class="app-grid cols-2"><div class="content-card"><div class="content-card-header"><div><h3>Career role editor</h3><p>Use JSON skill requirements to maintain explainable weights.</p></div>${icon('briefcase',15)}</div><div class="content-card-body"><form data-admin-role-form><div class="field" style="margin-bottom:10px"><label>Existing role</label><select class="select" name="existingRole" data-admin-role-edit>${roles.map(role => `<option value="${escapeHTML(role.id)}">${escapeHTML(role.title)}</option>`).join('')}<option value="__new">+ Create new role</option></select></div><input type="hidden" name="id" value="${escapeHTML(selectedRole?.id || '')}"><div class="field" style="margin-bottom:10px"><label>Role title</label><input class="input" name="title" value="${escapeHTML(selectedRole?.title || '')}" required></div><div class="form-grid"><div class="field"><label>Category</label><input class="input" name="category" value="${escapeHTML(selectedRole?.category || '')}"></div><div class="field"><label>Pathway duration</label><input class="input" name="duration" value="${escapeHTML(selectedRole?.duration || '')}"></div></div><div class="field" style="margin:10px 0"><label>Description</label><textarea class="textarea" name="description">${escapeHTML(selectedRole?.description || '')}</textarea></div><div class="field"><label>Skill requirements JSON</label><textarea class="textarea mono" name="skillsJson" style="min-height:190px;font-size:9px">${escapeHTML(skillsJson)}</textarea><span class="field-hint">Format: [{"skillId":"javascript","required":2,"weight":1.2,"why":"..."}] — required 0–3, weight 0.1–5.</span></div><button class="btn btn-primary btn-small" type="submit" style="margin-top:13px">Save career role</button></form></div></div>
  <div class="content-card"><div class="content-card-header"><div><h3>Learning resource manager</h3><p>Add a useful HTTPS resource for a skill.</p></div>${icon('book',15)}</div><div class="content-card-body"><form data-admin-resource-form><div class="field" style="margin-bottom:10px"><label>Skill</label><select class="select" name="skillId">${rolesResult.skills.map(skill => `<option value="${escapeHTML(skill.id)}">${escapeHTML(skill.name)}</option>`).join('')}</select></div><div class="field" style="margin-bottom:10px"><label>Resource title</label><input class="input" name="title" required></div><div class="form-grid"><div class="field"><label>Provider</label><input class="input" name="provider"></div><div class="field"><label>Type</label><select class="select" name="kind"><option>Course</option><option>Practice</option><option>Documentation</option><option>Reference</option></select></div></div><div class="field" style="margin:10px 0"><label>Level</label><select class="select" name="level"><option>Foundation</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></div><div class="field"><label>HTTPS URL</label><input class="input" type="url" name="url" placeholder="https://…" required></div><button class="btn btn-primary btn-small" type="submit" style="margin-top:13px">Add resource</button></form><div style="margin-top:20px;padding-top:15px;border-top:1px solid var(--line)"><div class="field-label" style="margin-bottom:9px">Recent resources (${resources.length})</div>${resources.slice(-5).reverse().map(resource => `<div class="mini-recommendation"><span class="rec-number">${icon('book',12)}</span><div><strong>${escapeHTML(resource.title)}</strong><small>${escapeHTML(resource.provider)} · ${escapeHTML(resource.skillId)}</small></div></div>`).join('')}</div></div></div></div>
  <p class="field-hint" style="margin-top:13px">Administrator APIs are protected on the server. Hiding the admin link in the interface is not the security boundary.</p>`;
}

async function loadWorkspaceData() {
  const [dashboard, rolesResult] = await Promise.all([apiRequest('/dashboard'), apiRequest('/roles')]);
  dashboard.skills = rolesResult.skills;
  dashboardData = dashboard;
  rolesData = dashboard.roles || rolesResult.roles || [];
  return dashboard;
}

async function renderWorkspace(page, token) {
  let body = '';
  const dashboard = await loadWorkspaceData();
  if (token !== routeRenderToken) return;
  const profile = dashboard.profile || {};
  const latest = dashboard.latestAssessment;
  const role = rolesData.find(item => item.id === profile.targetRole) || rolesData[0];
  switch (page) {
    case 'overview': body = overviewContent({ ...dashboard, skills: dashboard.skills }); break;
    case 'profile': body = profileContent(profile, rolesData, dashboard.skills || []); break;
    case 'careers': body = careersContent(rolesData, profile); break;
    case 'assessment': body = assessmentContent(profile, rolesData, latest, dashboard.skills || []); break;
    case 'gaps': body = gapsContent(latest); break;
    case 'recommendations': {
      const result = await apiRequest('/recommendations');
      body = recommendationsContent(result.recommendations || [], result.assessment);
      break;
    }
    case 'roadmap': {
      const result = await apiRequest('/progress');
      body = roadmapContent(role, result.progress);
      break;
    }
    case 'projects': body = projectsContent(role, profile); break;
    case 'progress': {
      const result = await apiRequest('/assessment/history');
      body = progressContent(dashboard, result.assessments || []);
      break;
    }
    case 'settings': body = settingsContent(); break;
    case 'admin':
      if (currentUser.role !== 'admin') { location.hash = '#/app/overview'; notify('Administrator access required', 'Your account does not have admin permissions.', 'error'); return; }
      body = await adminContent();
      break;
    default: location.hash = '#/app/overview'; return;
  }
  if (token !== routeRenderToken) return;
  appRoot.innerHTML = appShell(page, body);
}

async function renderRoute() {
  const token = ++routeRenderToken;
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const [route, subroute] = hash.split('/');
  currentRoute = route;
  if (route === 'home' || route === '') {
    appRoot.innerHTML = `${siteHeader('home')}${landingPage()}`;
    if (window.pendingScrollTarget) {
      const target = window.pendingScrollTarget; window.pendingScrollTarget = null;
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }));
    }
    return;
  }
  if (route === 'demo') {
    appRoot.innerHTML = `${siteHeader('demo')}${renderDemoPage()}`;
    return;
  }
  if (route === 'login' || route === 'register') {
    appRoot.innerHTML = `${siteHeader('')}${renderAuthPage(route)}`;
    return;
  }
  if (route === 'forgot') {
    appRoot.innerHTML = `${siteHeader('')}${renderForgotPage()}`;
    return;
  }
  if (route === 'app') {
    try {
      const auth = await apiRequest('/auth/me');
      currentUser = auth.user;
    } catch { currentUser = null; }
    if (!currentUser) {
      notify('Sign in to open your workspace', 'The demo remains available without an account.', 'warning');
      location.hash = '#/login';
      return;
    }
    const page = subroute || (currentUser.role === 'admin' ? 'admin' : 'overview');
    if (currentUser.role === 'admin' && page === 'overview') { location.hash = '#/app/admin'; return; }
    appRoot.innerHTML = `${siteHeader('workspace')}<div class="app-layout"><div class="sidebar skeleton" style="height:100vh"></div><main class="app-main"><div class="skeleton" style="height:14px;width:160px;margin-bottom:28px"></div><div class="skeleton" style="height:42px;width:55%;margin-bottom:15px"></div><div class="skeleton" style="height:150px"></div></main></div>`;
    try { await renderWorkspace(page, token); }
    catch (error) { if (token === routeRenderToken) { appRoot.innerHTML = `${siteHeader('workspace')}<main class="container" style="padding:80px 0"><div class="content-card"><div class="empty-state"><div class="empty-icon">${icon('server',22)}</div><h3>Workspace could not load.</h3><p>${escapeHTML(error.message)}</p><a href="#/app/overview" class="btn btn-primary btn-small">Try again</a></div></div></main>`; } }
    return;
  }
  location.hash = '#/home';
}

async function saveProfile(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const skills = {};
  for (const [key, value] of Object.entries(values)) if (key.startsWith('skill_')) skills[key.slice(6)] = Number(value);
  const interests = String(values.interests || '').split(',').map(item => item.trim()).filter(Boolean);
  const projectTitle = String(values.projectTitle || '').trim();
  const projects = projectTitle ? [{
    id: dashboardData?.profile?.projects?.[0]?.id || `project-${Date.now()}`,
    title: projectTitle,
    description: values.projectDescription || '',
    technologies: String(values.projectTechnologies || '').split(',').map(item => item.trim()).filter(Boolean),
    github: values.projectGithub || '', url: '', contribution: ''
  }] : (dashboardData?.profile?.projects || []);
  const body = {
    name: values.name, college: values.college, programme: values.programme, semester: values.semester,
    graduationYear: values.graduationYear, targetRole: values.targetRole, interests, skills, projects
  };
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML; button.disabled = true; button.textContent = 'Saving profile…';
  try {
    await apiRequest('/profile', { method: 'PUT', body });
    notify('Profile saved', 'Your skill profile has been updated.');
    await renderRoute();
  } catch (error) { notify('Could not save profile', error.message, 'error'); }
  finally { if (button.isConnected) { button.disabled = false; button.innerHTML = original; } }
}

async function runAssessment() {
  const selector = document.getElementById('assessment-role');
  const roleId = selector?.value || dashboardData?.profile?.targetRole;
  if (!roleId) { notify('Choose a career role', 'Select a target role first.', 'warning'); return; }
  try {
    const result = await apiRequest('/assessment', { method: 'POST', body: { roleId } });
    notify('Assessment complete', `${result.assessment.match}% alignment for ${result.assessment.roleTitle}.`);
    location.hash = '#/app/gaps';
  } catch (error) { notify('Assessment failed', error.message, 'error'); }
}

async function setTargetRole(roleId) {
  try {
    await apiRequest('/profile', { method: 'PUT', body: { targetRole: roleId } });
    notify('Career target updated', 'You can now assess your profile against this role.');
    await renderRoute();
  } catch (error) { notify('Could not update target', error.message, 'error'); }
}

async function saveRoadmap(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const tasks = {};
  for (const [key, value] of Object.entries(values)) if (key.startsWith('task_')) tasks[key.slice(5)] = value;
  try {
    await apiRequest('/progress', { method: 'POST', body: { roleId: dashboardData.profile?.targetRole || 'web-developer', tasks } });
    notify('Roadmap saved', 'Your learning milestones have been updated.');
    await renderRoute();
  } catch (error) { notify('Could not save roadmap', error.message, 'error'); }
}

async function handleAdminRole(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  let skills;
  try { skills = JSON.parse(values.skillsJson || '[]'); if (!Array.isArray(skills)) throw new Error(); }
  catch { notify('Invalid skill JSON', 'Use a JSON array of skill requirements.', 'error'); return; }
  const body = { id: values.id || undefined, title: values.title, category: values.category, duration: values.duration, description: values.description, skills };
  try {
    const result = values.id ? await apiRequest(`/admin/roles/${values.id}`, { method: 'PUT', body }) : await apiRequest('/admin/roles', { method: 'POST', body });
    notify('Career role saved', result.role.title);
    await renderRoute();
  } catch (error) { notify('Could not save role', error.message, 'error'); }
}

async function handleAdminResource(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    await apiRequest('/admin/resources', { method: 'POST', body });
    notify('Resource added', 'The new learning resource is available in recommendations.');
    await renderRoute();
  } catch (error) { notify('Could not add resource', error.message, 'error'); }
}

async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST', body: {} }); } catch { /* cookie may already be gone */ }
  currentUser = null; dashboardData = null;
  notify('Signed out', 'Your workspace session has ended.');
  location.hash = '#/home';
}

function applyAppearanceAndRerender(patch) {
  saveAppearance(patch);
  renderRoute();
}

appRoot.addEventListener('click', async event => {
  const scrollLink = event.target.closest('[data-scroll-target]');
  if (scrollLink) {
    event.preventDefault();
    const target = scrollLink.dataset.scrollTarget;
    if (!location.hash.startsWith('#/home')) { window.pendingScrollTarget = target; location.hash = '#/home'; }
    else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('main-navigation')?.classList.remove('open');
    return;
  }
  if (event.target.closest('[data-mobile-menu]')) { document.getElementById('main-navigation')?.classList.toggle('open'); return; }
  if (event.target.closest('[data-appearance-toggle]')) {
    const panel = event.target.closest('.appearance-wrap')?.querySelector('[data-appearance-panel]');
    if (panel) panel.hidden = !panel.hidden;
    return;
  }
  const themeChoice = event.target.closest('[data-theme-choice]');
  if (themeChoice) { event.preventDefault(); applyAppearanceAndRerender({ theme: themeChoice.dataset.themeChoice }); return; }
  const bgChoice = event.target.closest('[data-bg-choice]');
  if (bgChoice) { event.preventDefault(); applyAppearanceAndRerender({ bg: bgChoice.dataset.bgChoice }); return; }
  const accentChoice = event.target.closest('[data-accent-choice]');
  if (accentChoice) { event.preventDefault(); applyAppearanceAndRerender({ accent: accentChoice.dataset.accentChoice }); return; }
  if (event.target.closest('[data-auth-logout]')) { logout(); return; }
  if (event.target.closest('[data-sidebar-toggle]')) {
    document.getElementById('app-sidebar')?.classList.add('open');
    const backdrop = document.getElementById('sidebar-backdrop'); if (backdrop) backdrop.hidden = false;
    return;
  }
  if (event.target.closest('[data-sidebar-close]')) {
    document.getElementById('app-sidebar')?.classList.remove('open');
    const backdrop = document.getElementById('sidebar-backdrop'); if (backdrop) backdrop.hidden = true;
    return;
  }
  if (event.target.closest('[data-run-assessment]')) { runAssessment(); return; }
  const roleChoice = event.target.closest('[data-select-role]');
  if (roleChoice) { setTargetRole(roleChoice.dataset.selectRole); return; }
  if (event.target.closest('[data-print-report]')) { window.print(); return; }
  if (event.target.closest('[data-roadmap-save]')) { document.querySelector('[data-roadmap-form]')?.requestSubmit(); return; }

  if (event.target.closest('[data-demo-action="toggle-custom"]')) { handleDemoClick(event.target); return; }
  if (handleDemoClick(event.target)) { appRoot.innerHTML = `${siteHeader('demo')}${renderDemoPage()}`; return; }

  const adminEdit = event.target.closest('[data-admin-role-edit]');
  if (adminEdit) return;
});

appRoot.addEventListener('change', async event => {
  if (handleDemoChange(event.target)) { appRoot.innerHTML = `${siteHeader('demo')}${renderDemoPage()}`; return; }
  if (event.target.matches('[data-admin-role-edit]')) {
    const roleId = event.target.value;
    const rolesResult = await apiRequest('/roles');
    const role = rolesResult.roles.find(item => item.id === roleId);
    const form = document.querySelector('[data-admin-role-form]');
    if (!form || !role) {
      if (form) { form.reset(); form.elements.id.value = ''; }
      return;
    }
    form.elements.id.value = role.id;
    form.elements.title.value = role.title;
    form.elements.category.value = role.category || '';
    form.elements.duration.value = role.duration || '';
    form.elements.description.value = role.description || '';
    form.elements.skillsJson.value = JSON.stringify(role.skills, null, 2);
  }
});

appRoot.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  if (form.matches('[data-auth-form]')) { await handleAuthSubmit(form); return; }
  if (form.matches('[data-profile-form]')) { await saveProfile(form); return; }
  if (form.matches('[data-roadmap-form]')) { await saveRoadmap(form); return; }
  if (form.matches('[data-admin-role-form]')) { await handleAdminRole(form); return; }
  if (form.matches('[data-admin-resource-form]')) { await handleAdminResource(form); return; }
  if (handleDemoSubmit(form)) { appRoot.innerHTML = `${siteHeader('demo')}${renderDemoPage()}`; }
});

// Close floating controls on outside clicks without interfering with their own actions.
document.addEventListener('click', event => {
  if (!event.target.closest('.appearance-wrap')) {
    document.querySelectorAll('[data-appearance-panel]').forEach(panel => { panel.hidden = true; });
  }
});

applyAppearance();
await initializeDemo();
try { currentUser = (await apiRequest('/auth/me')).user; } catch { currentUser = null; }
window.addEventListener('hashchange', renderRoute);
await renderRoute();
