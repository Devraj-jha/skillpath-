import { escapeHTML, brandMarkup, icon, apiRequest, notify } from './core.js';

export function renderAuthPage(mode = 'login') {
  const register = mode === 'register';
  return `<main class="auth-page"><div class="auth-layout">
    <aside class="auth-aside">${brandMarkup()}<h1>${register ? 'Build a path that belongs to you.' : 'Good to see you again.'}</h1><p>${register ? 'Create your student workspace, map your current skills and turn career goals into a practical learning plan.' : 'Pick up where you left off. Your skill profile, career alignment and learning progress are ready when you are.'}<div class="auth-pixel">${Array.from({length:25}, () => '<i></i>').join('')}</div><div class="auth-aside-bottom"><span>SIH26134 / SKILL DEVELOPMENT</span><span>EST. 2026</span></div></aside>
    <section class="auth-card"><span class="eyebrow">${register ? 'Start with a profile' : 'Student workspace'}</span><h2>${register ? 'Create your account' : 'Welcome back'}</h2><p>${register ? 'A few details to create your personal learning space.' : 'Sign in to continue your skill development journey.'}</p>
      <form class="auth-form" data-auth-form="${register ? 'register' : 'login'}" novalidate>
        ${register ? `<div class="field"><label for="auth-name">Full name</label><input class="input" id="auth-name" name="name" placeholder="e.g. Aarav Sharma" autocomplete="name" required maxlength="100"></div>` : ''}
        <div class="field"><label for="auth-email">Email address</label><input class="input" id="auth-email" name="email" type="email" placeholder="you@college.edu" autocomplete="email" required></div>
        <div class="field"><label for="auth-password">Password</label><input class="input" id="auth-password" name="password" type="password" placeholder="${register ? 'At least 8 characters' : 'Enter your password'}" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="8" required></div>
        ${register ? `<div class="field"><label for="auth-confirm">Confirm password</label><input class="input" id="auth-confirm" name="confirmPassword" type="password" placeholder="Enter your password again" autocomplete="new-password" required></div>
        <div class="form-grid"><div class="field"><label for="auth-college">College / institution</label><input class="input" id="auth-college" name="college" placeholder="Your institution" maxlength="160"></div><div class="field"><label for="auth-semester">Current semester</label><select class="select" id="auth-semester" name="semester"><option value="">Select</option>${Array.from({length:8}, (_, i) => `<option value="${i+1}">${i+1}${['st','nd','rd'][i] || 'th'} semester</option>`).join('')}</select></div></div>
        <div class="field"><label for="auth-programme">Programme</label><input class="input" id="auth-programme" name="programme" value="B.Tech Computer Science & Engineering" maxlength="160"></div>` : ''}
        <button class="btn btn-primary" type="submit">${register ? 'Create student account' : 'Sign in to SkillPath'} ${icon('arrow', 14)}</button>
      </form>
      <div class="auth-switch">${register ? 'Already have an account?' : 'New to SkillPath?'} <a href="#/${register ? 'login' : 'register'}">${register ? 'Sign in' : 'Create an account'}</a></div>
      ${!register ? `<div class="demo-credentials"><strong>Project evaluation accounts</strong><p>Student · student@skillpath.demo<br>Password · SkillpathDemo26!</p><p style="margin-top:5px">Admin · admin@skillpath.demo<br>Password · AdminDemo26!</p></div>` : `<p class="field-hint" style="margin-top:18px">Your password is hashed on the server. SkillPath never stores it in plain text.</p>`}
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:19px"><a class="text-link" href="#/demo">Explore the public demo ${icon('arrow', 12)}</a>${!register ? `<a class="text-link" href="#/forgot">Forgot password?</a>` : ''}</div>
    </section>
  </div></main>`;
}

export async function handleAuthSubmit(form) {
  const mode = form.dataset.authForm;
  const values = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = mode === 'register' ? 'Creating account…' : 'Signing in…';
  try {
    const result = await apiRequest(`/auth/${mode}`, { method: 'POST', body: values });
    notify(mode === 'register' ? 'Account created' : `Welcome back, ${result.user.name.split(' ')[0]}`, 'Your workspace is ready.');
    location.hash = '#/app/overview';
  } catch (error) {
    notify('Could not sign in', error.message, 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export function renderForgotPage() {
  return `<main class="auth-page"><section class="content-card" style="width:min(480px,100%);padding:30px"><span class="eyebrow">Account recovery</span><h1 class="display" style="font-size:29px;letter-spacing:-.06em;margin:12px 0 8px">Forgot your password?</h1><p class="muted" style="font-size:11px;line-height:1.8">This academic demo does not send password-reset emails. A production recovery flow needs verified email ownership, a time-limited reset token and an email delivery provider. For the local evaluation accounts, use the demonstration credentials shown on the sign-in screen.</p><div class="demo-note" style="margin:18px 0"><strong>Evaluation account</strong><br>Student: student@skillpath.demo<br>Admin: admin@skillpath.demo</div><a href="#/login" class="btn btn-primary" style="width:100%">Back to sign in ${icon('arrow',13)}</a></section></main>`;
}
