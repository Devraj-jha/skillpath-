import { randomUUID } from 'node:crypto';
import { initializeData, readCollection, writeCollection, hashPassword, verifyPassword } from './database.js';
import { calculateAssessment } from './matching.js';
import { buildRecommendations } from './recommendations.js';
import { createSessionCookie, clearSessionCookie, requireRole } from './auth.js';
import { cleanText, emailValue, passwordValue, levelValue, safeId, objectBody } from './validation.js';

function send(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(body);
}

async function bodyOf(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return objectBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
  catch (error) { if (error.status) throw error; const bad = new Error('Request body must be valid JSON.'); bad.status = 400; throw bad; }
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

async function userBySession(session) {
  const users = await readCollection('users');
  return users.find(user => user.id === session.sub) || null;
}

async function profileFor(userId) {
  const profiles = await readCollection('student-profiles');
  return profiles.find(profile => profile.userId === userId) || null;
}

function safeProfileInput(body, existing, user, skillsCatalog) {
  const allowed = new Set(skillsCatalog.map(skill => skill.id));
  const skills = { ...(existing?.skills || {}) };
  if (body.skills && typeof body.skills === 'object' && !Array.isArray(body.skills)) {
    for (const [key, value] of Object.entries(body.skills)) {
      if (!allowed.has(key)) continue;
      skills[key] = levelValue(value);
    }
  }
  const projects = Array.isArray(body.projects) ? body.projects.slice(0, 20).map(project => ({
    id: cleanText(project.id, 80) || randomUUID(),
    title: cleanText(project.title, 100),
    description: cleanText(project.description, 500),
    technologies: Array.isArray(project.technologies) ? project.technologies.slice(0, 12).map(x => cleanText(x, 40)) : [],
    github: cleanText(project.github, 300),
    url: cleanText(project.url, 300),
    contribution: cleanText(project.contribution, 300)
  })).filter(project => project.title) : (existing?.projects || []);
  return {
    ...(existing || {}), id: existing?.id || randomUUID(), userId: user.id,
    name: cleanText(body.name ?? existing?.name ?? user.name, 100), email: user.email,
    college: cleanText(body.college ?? existing?.college, 160),
    programme: cleanText(body.programme ?? existing?.programme, 160),
    semester: cleanText(body.semester ?? existing?.semester, 12),
    graduationYear: cleanText(body.graduationYear ?? existing?.graduationYear, 8),
    targetRole: cleanText(body.targetRole ?? existing?.targetRole, 80), skills,
    projects,
    interests: Array.isArray(body.interests) ? body.interests.slice(0, 20).map(x => cleanText(x, 80)) : (existing?.interests || []),
    updatedAt: new Date().toISOString()
  };
}

async function authenticatedContext(req) {
  const session = requireRole(req, 'student');
  const user = await userBySession(session);
  if (!user) { const error = new Error('Your session is no longer valid. Please sign in again.'); error.status = 401; throw error; }
  return { session, user };
}

function sanitizeRole(body, existing = {}) {
  const skills = Array.isArray(body.skills) ? body.skills.slice(0, 80).map(item => ({
    skillId: safeId(item.skillId), required: levelValue(item.required), weight: Math.max(0.1, Math.min(5, Number(item.weight) || 1)), why: cleanText(item.why, 300)
  })) : (existing.skills || []);
  return {
    ...existing, id: existing.id || safeId(body.id || `role-${randomUUID().slice(0, 8)}`),
    title: cleanText(body.title ?? existing.title, 100),
    category: cleanText(body.category ?? existing.category, 80),
    level: cleanText(body.level ?? existing.level, 60),
    duration: cleanText(body.duration ?? existing.duration, 80),
    description: cleanText(body.description ?? existing.description, 700),
    summary: cleanText(body.summary ?? existing.summary, 200),
    color: cleanText(body.color ?? existing.color, 30), icon: cleanText(body.icon ?? existing.icon, 40),
    skills,
    roadmap: Array.isArray(body.roadmap) ? body.roadmap : (existing.roadmap || []),
    projects: Array.isArray(body.projects) ? body.projects : (existing.projects || [])
  };
}

async function route(req, res) {
  await initializeData();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  if (method === 'GET' && path === '/api/health') return send(res, 200, { ok: true, service: 'SkillPath API', storage: process.env.KV_REST_API_URL ? 'upstash' : (process.env.VERCEL ? 'temporary-filesystem' : 'json-files'), timestamp: new Date().toISOString() });
  if (method === 'GET' && path === '/api/roles') {
    const [roles, skills] = await Promise.all([readCollection('job-roles'), readCollection('skills')]);
    return send(res, 200, { roles, skills });
  }
  if (method === 'GET' && path === '/api/resources-public') {
    const resources = await readCollection('resources');
    return send(res, 200, { resources });
  }
  const roleMatch = path.match(/^\/api\/roles\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && roleMatch) {
    const roles = await readCollection('job-roles');
    const role = roles.find(item => item.id === roleMatch[1]);
    return role ? send(res, 200, { role }) : send(res, 404, { error: 'Career role not found.' });
  }

  if (method === 'POST' && path === '/api/auth/register') {
    const body = await bodyOf(req);
    const name = cleanText(body.name, 100);
    const email = emailValue(body.email);
    const password = passwordValue(body.password);
    if (name.length < 2) return send(res, 400, { error: 'Please enter your full name.' });
    if (password !== body.confirmPassword) return send(res, 400, { error: 'The passwords do not match.' });
    const users = await readCollection('users');
    if (users.some(user => user.email === email)) return send(res, 409, { error: 'An account with this email already exists.' });
    const user = { id: randomUUID(), name, email, passwordHash: await hashPassword(password), role: 'student', createdAt: new Date().toISOString() };
    users.push(user);
    await writeCollection('users', users);
    const profiles = await readCollection('student-profiles');
    profiles.push({ id: randomUUID(), userId: user.id, name, email, college: cleanText(body.college, 160), programme: cleanText(body.programme, 160), semester: cleanText(body.semester, 12), graduationYear: '', targetRole: 'web-developer', skills: {}, projects: [], interests: [], updatedAt: new Date().toISOString() });
    await writeCollection('student-profiles', profiles);
    return send(res, 201, { user: publicUser(user) }, { 'Set-Cookie': createSessionCookie(user) });
  }
  if (method === 'POST' && path === '/api/auth/login') {
    const body = await bodyOf(req);
    const email = emailValue(body.email);
    const password = String(body.password || '');
    const users = await readCollection('users');
    const user = users.find(item => item.email === email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) return send(res, 401, { error: 'Email or password is incorrect.' });
    return send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': createSessionCookie(user) });
  }
  if (method === 'POST' && path === '/api/auth/logout') return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  if (method === 'GET' && path === '/api/auth/me') {
    try { const { user } = await authenticatedContext(req); return send(res, 200, { user: publicUser(user) }); }
    catch (error) { if (error.status === 401) return send(res, 200, { user: null }); throw error; }
  }

  if (path.startsWith('/api/admin/')) {
    const session = requireRole(req, 'admin');
    const admin = await userBySession(session);
    if (!admin || admin.role !== 'admin') return send(res, 403, { error: 'Administrator access required.' });
    if (method === 'GET' && path === '/api/admin/students') {
      const [users, profiles, assessments] = await Promise.all([readCollection('users'), readCollection('student-profiles'), readCollection('assessments')]);
      const students = users.filter(user => user.role === 'student').map(user => ({ ...publicUser(user), profile: profiles.find(profile => profile.userId === user.id) || null, assessmentCount: assessments.filter(item => item.userId === user.id).length }));
      return send(res, 200, { students, totalAssessments: assessments.length });
    }
    if (method === 'POST' && path === '/api/admin/roles') {
      const body = await bodyOf(req); const roles = await readCollection('job-roles'); const role = sanitizeRole(body);
      if (!role.title) return send(res, 400, { error: 'Role title is required.' });
      roles.push(role); await writeCollection('job-roles', roles); return send(res, 201, { role });
    }
    const adminRoleMatch = path.match(/^\/api\/admin\/roles\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PUT' && adminRoleMatch) {
      const body = await bodyOf(req); const roles = await readCollection('job-roles'); const index = roles.findIndex(item => item.id === adminRoleMatch[1]);
      if (index < 0) return send(res, 404, { error: 'Career role not found.' });
      roles[index] = sanitizeRole(body, roles[index]); await writeCollection('job-roles', roles); return send(res, 200, { role: roles[index] });
    }
    if (method === 'POST' && path === '/api/admin/resources') {
      const body = await bodyOf(req); const resources = await readCollection('resources');
      const resource = { id: randomUUID(), skillId: safeId(body.skillId), kind: cleanText(body.kind, 40), title: cleanText(body.title, 140), provider: cleanText(body.provider, 100), level: cleanText(body.level, 40), url: cleanText(body.url, 500) };
      if (!resource.title || !/^https:\/\//.test(resource.url)) return send(res, 400, { error: 'A title and secure HTTPS resource URL are required.' });
      resources.push(resource); await writeCollection('resources', resources); return send(res, 201, { resource });
    }
    const resourceMatch = path.match(/^\/api\/admin\/resources\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PUT' && resourceMatch) {
      const body = await bodyOf(req); const resources = await readCollection('resources'); const index = resources.findIndex(item => item.id === resourceMatch[1]);
      if (index < 0) return send(res, 404, { error: 'Resource not found.' });
      resources[index] = { ...resources[index], ...body, id: resources[index].id, title: cleanText(body.title ?? resources[index].title, 140), url: cleanText(body.url ?? resources[index].url, 500) };
      if (!/^https:\/\//.test(resources[index].url)) return send(res, 400, { error: 'Resource URLs must use HTTPS.' });
      await writeCollection('resources', resources); return send(res, 200, { resource: resources[index] });
    }
    return send(res, 404, { error: 'Admin endpoint not found.' });
  }

  if (path.startsWith('/api/')) {
    const { user } = await authenticatedContext(req);
    if (method === 'GET' && path === '/api/profile') return send(res, 200, { profile: await profileFor(user.id) });
    if (method === 'PUT' && path === '/api/profile') {
      const body = await bodyOf(req); const profiles = await readCollection('student-profiles'); const index = profiles.findIndex(profile => profile.userId === user.id);
      const [skills, roles] = await Promise.all([readCollection('skills'), readCollection('job-roles')]);
      if (body.targetRole && !roles.some(role => role.id === body.targetRole)) return send(res, 400, { error: 'Choose a valid target career role.' });
      const next = safeProfileInput(body, index >= 0 ? profiles[index] : null, user, skills);
      if (index >= 0) profiles[index] = next; else profiles.push(next);
      await writeCollection('student-profiles', profiles);
      if (body.name) {
        const users = await readCollection('users');
        const userIndex = users.findIndex(item => item.id === user.id);
        if (userIndex >= 0) { users[userIndex].name = cleanText(body.name, 100); await writeCollection('users', users); user.name = users[userIndex].name; }
      }
      return send(res, 200, { profile: next });
    }
    if (method === 'GET' && path === '/api/dashboard') {
      const [profile, roles, assessments, progress] = await Promise.all([profileFor(user.id), readCollection('job-roles'), readCollection('assessments'), readCollection('learning-progress')]);
      const ownAssessments = assessments.filter(item => item.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const ownProgress = progress.find(item => item.userId === user.id) || null;
      const latest = ownAssessments[0] || null;
      const allSkills = Object.values(profile?.skills || {});
      return send(res, 200, { profile, roles, latestAssessment: latest, assessmentCount: ownAssessments.length, progress: ownProgress, stats: { skillsAdded: allSkills.filter(level => level > 0).length, skillsToImprove: latest?.counts?.improve || 0, missingSkills: latest?.counts?.missing || 0, completedRoadmap: Object.values(ownProgress?.tasks || {}).filter(status => status === 'completed').length } });
    }
    if (method === 'POST' && path === '/api/assessment') {
      const body = await bodyOf(req); const roleId = safeId(body.roleId);
      const [profile, roles, skills, assessments] = await Promise.all([profileFor(user.id), readCollection('job-roles'), readCollection('skills'), readCollection('assessments')]);
      const role = roles.find(item => item.id === roleId);
      if (!role) return send(res, 404, { error: 'Choose a valid career role before assessing.' });
      const assessment = calculateAssessment(profile || { skills: {} }, role, skills);
      assessment.userId = user.id;
      assessments.push(assessment); await writeCollection('assessments', assessments);
      if (profile) {
        const profiles = await readCollection('student-profiles'); const index = profiles.findIndex(item => item.userId === user.id);
        if (index >= 0) { profiles[index].targetRole = roleId; profiles[index].updatedAt = new Date().toISOString(); await writeCollection('student-profiles', profiles); }
      }
      return send(res, 201, { assessment });
    }
    if (method === 'GET' && path === '/api/assessment/history') {
      const assessments = (await readCollection('assessments')).filter(item => item.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return send(res, 200, { assessments });
    }
    const assessmentMatch = path.match(/^\/api\/assessment\/([a-zA-Z0-9_-]+)$/);
    if (method === 'GET' && assessmentMatch) {
      const assessment = (await readCollection('assessments')).find(item => item.id === assessmentMatch[1] && item.userId === user.id);
      return assessment ? send(res, 200, { assessment }) : send(res, 404, { error: 'Assessment not found.' });
    }
    if (method === 'GET' && path === '/api/recommendations') {
      const roleId = url.searchParams.get('roleId');
      const [profile, roles, assessments, resources] = await Promise.all([profileFor(user.id), readCollection('job-roles'), readCollection('assessments'), readCollection('resources')]);
      const role = roles.find(item => item.id === (roleId || profile?.targetRole));
      const assessment = assessments.filter(item => item.userId === user.id && (!role || item.roleId === role.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
      return send(res, 200, { recommendations: buildRecommendations(assessment, resources, role), assessment, role });
    }
    if (method === 'GET' && path === '/api/progress') {
      const all = await readCollection('learning-progress');
      const progress = all.find(item => item.userId === user.id) || { userId: user.id, roleId: (await profileFor(user.id))?.targetRole || 'web-developer', tasks: {} };
      return send(res, 200, { progress });
    }
    if (method === 'POST' && path === '/api/progress') {
      const body = await bodyOf(req); const roleId = safeId(body.roleId); const roles = await readCollection('job-roles');
      const role = roles.find(item => item.id === roleId); if (!role) return send(res, 404, { error: 'Career role not found.' });
      const all = await readCollection('learning-progress'); let item = all.find(row => row.userId === user.id);
      if (!item) { item = { id: randomUUID(), userId: user.id, roleId, tasks: {}, updatedAt: new Date().toISOString() }; all.push(item); }
      if (item.roleId !== roleId) { item.roleId = roleId; item.tasks = {}; }
      const validTaskIds = new Set(role.roadmap.map(task => task.id));
      for (const [taskId, status] of Object.entries(body.tasks || {})) if (validTaskIds.has(taskId) && ['planned', 'in-progress', 'completed'].includes(status)) item.tasks[taskId] = status;
      item.updatedAt = new Date().toISOString(); await writeCollection('learning-progress', all); return send(res, 200, { progress: item });
    }
    const progressMatch = path.match(/^\/api\/progress\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PATCH' && progressMatch) {
      const body = await bodyOf(req); const taskId = progressMatch[1]; const status = body.status;
      if (!['planned', 'in-progress', 'completed'].includes(status)) return send(res, 400, { error: 'Choose planned, in progress or completed.' });
      const all = await readCollection('learning-progress'); let item = all.find(row => row.userId === user.id);
      if (!item) return send(res, 404, { error: 'No learning roadmap has been started.' });
      const roles = await readCollection('job-roles'); const role = roles.find(row => row.id === item.roleId);
      if (!role?.roadmap.some(task => task.id === taskId)) return send(res, 404, { error: 'Roadmap task not found.' });
      item.tasks[taskId] = status; item.updatedAt = new Date().toISOString(); await writeCollection('learning-progress', all); return send(res, 200, { progress: item });
    }
  }
  return send(res, 404, { error: 'API endpoint not found.' });
}

export async function handleApi(req, res) {
  if (!String(req.url || '').startsWith('/api/')) return false;
  try {
    await route(req, res);
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error('[SkillPath API]', error);
    send(res, status, { error: status === 503 ? error.message : status >= 500 ? 'Something went wrong on the server. Please try again.' : error.message });
  }
  return true;
}
