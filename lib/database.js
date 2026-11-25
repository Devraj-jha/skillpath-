import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scrypt as scryptCallback, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { calculateAssessment } from './matching.js';

const scrypt = promisify(scryptCallback);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.cwd(), 'data');
const RUNTIME_DATA_DIR = process.env.VERCEL ? '/tmp/skillpath-data' : DATA_DIR;
const COLLECTIONS = new Set(['users', 'student-profiles', 'skills', 'job-roles', 'resources', 'assessments', 'learning-progress']);
const queues = new Map();
const isRedis = () => Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function redisCommand(command) {
  const url = process.env.KV_REST_API_URL;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  if (!response.ok) throw new Error(`Persistent store returned ${response.status}.`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

function queueWrite(key, task) {
  const previous = queues.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  const tracked = next.finally(() => { if (queues.get(key) === tracked) queues.delete(key); });
  queues.set(key, tracked);
  return next;
}

export async function readCollection(name) {
  if (!COLLECTIONS.has(name)) throw new Error('Unknown data collection.');
  if (isRedis()) {
    const value = await redisCommand(['GET', `skillpath:${name}`]);
    if (value !== null && value !== undefined) {
      try { return JSON.parse(value); } catch { throw new Error(`Stored collection ${name} is not valid JSON.`); }
    }
  }
  try {
    const raw = await fs.readFile(path.join(RUNTIME_DATA_DIR, `${name}.json`), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (process.env.VERCEL) {
      try { return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf8')); }
      catch (fallbackError) { if (fallbackError.code === 'ENOENT') return []; throw fallbackError; }
    }
    return [];
  }
}

export async function writeCollection(name, value) {
  if (!COLLECTIONS.has(name)) throw new Error('Unknown data collection.');
  if (!Array.isArray(value)) throw new Error('Collections must be arrays.');
  const serialized = JSON.stringify(value, null, 2);
  return queueWrite(name, async () => {
    if (isRedis()) {
      await redisCommand(['SET', `skillpath:${name}`, serialized]);
      return value;
    }
    await fs.mkdir(RUNTIME_DATA_DIR, { recursive: true });
    const target = path.join(RUNTIME_DATA_DIR, `${name}.json`);
    const temporary = `${target}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(temporary, serialized, { mode: 0o600 });
    await fs.rename(temporary, target);
    return value;
  });
}

export async function findById(collection, id) {
  const rows = await readCollection(collection);
  return rows.find(row => row.id === id) || null;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof encoded !== 'string') return false;
  const [scheme, salt, key] = encoded.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(key, 'hex');
  return derived.length === expected.length && (await import('node:crypto')).timingSafeEqual(derived, expected);
}

export async function initializeData() {
  const roles = await readCollection('job-roles');
  if (!roles.length) {
    const bundled = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'job-roles.json'), 'utf8'));
    await writeCollection('job-roles', bundled);
  }
  const users = await readCollection('users');
  if (!users.length) {
    const now = new Date().toISOString();
    const demoHash = await hashPassword('SkillpathDemo26!');
    const adminHash = await hashPassword('AdminDemo26!');
    const seedUsers = [
      { id: 'user_demo_student', name: 'Aarav Sharma', email: 'student@skillpath.demo', passwordHash: demoHash, role: 'student', createdAt: now },
      { id: 'user_demo_admin', name: 'SkillPath Admin', email: 'admin@skillpath.demo', passwordHash: adminHash, role: 'admin', createdAt: now }
    ];
    await writeCollection('users', seedUsers);
    await writeCollection('student-profiles', [{
      id: 'profile_demo_student', userId: 'user_demo_student', name: 'Aarav Sharma', email: 'student@skillpath.demo',
      college: 'Central Institute of Technology', programme: 'B.Tech Computer Science & Engineering', semester: '5', graduationYear: '2027',
      targetRole: 'web-developer', skills: { html: 2, css: 1, javascript: 2, typescript: 0, react: 1, node: 1, sql: 1, git: 2, dsa: 1, python: 1, statistics: 0, excel: 1, pandas: 0, visualization: 0, networking: 1, linux: 1, security: 0, owasp: 0, communication: 2, 'problem-solving': 2, teamwork: 1, 'critical-thinking': 1 },
      projects: [{ id: 'prj-demo-1', title: 'Campus Notes', description: 'A responsive notes application with local storage.', technologies: ['HTML', 'CSS', 'JavaScript'], github: '', url: '', contribution: 'Frontend and interaction design' }],
      interests: ['Frontend development', 'Product engineering'], updatedAt: now
    }]);
  }
  for (const name of ['skills', 'resources', 'assessments', 'learning-progress', 'student-profiles']) {
    const current = await readCollection(name);
    if (!current.length && ['skills', 'resources'].includes(name)) {
      const bundled = JSON.parse(await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf8'));
      await writeCollection(name, bundled);
    }
  }
  const existingAssessments = await readCollection('assessments');
  if (!existingAssessments.length) {
    const [profiles, allRoles, allSkills] = await Promise.all([readCollection('student-profiles'), readCollection('job-roles'), readCollection('skills')]);
    const sampleProfile = profiles.find(profile => profile.userId === 'user_demo_student');
    const sampleRole = allRoles.find(role => role.id === (sampleProfile?.targetRole || 'web-developer'));
    if (sampleProfile && sampleRole) {
      const sample = calculateAssessment(sampleProfile, sampleRole, allSkills);
      sample.userId = 'user_demo_student';
      sample.isDemoSample = true;
      await writeCollection('assessments', [sample]);
    }
  }
}

export function storageMode() {
  return isRedis() ? 'upstash' : 'local-json';
}
