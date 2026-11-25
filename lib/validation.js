export function cleanText(value, max = 1200) {
  return String(value ?? '').trim().slice(0, max);
}

export function emailValue(value) {
  const email = cleanText(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return email;
}

export function passwordValue(value) {
  const password = String(value ?? '');
  if (password.length < 8 || password.length > 128) throw new Error('Password must be between 8 and 128 characters.');
  return password;
}

export function levelValue(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 3) throw new Error('Skill levels must be between 0 and 3.');
  return n;
}

export function safeId(value) {
  const id = cleanText(value, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid identifier.');
  return id;
}

export function objectBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('A JSON object is required.');
  return body;
}
