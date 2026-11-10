/* ==========================================================
   ACCOUNT DATA - sign-up, sign-in, applications and emails.
   Shared by signup.html, login.html, payment.html and mailbox.html.
   DEMO: everything is kept in THIS browser (localStorage), so an account only works on the
   computer where it was created, and no real email is sent.
   EDIT LATER (backend): replace the functions marked [server] with calls to your server and
   keep everything else the same.
   ========================================================== */
const Accounts = (() => {
  const K = { accounts: 'emmynetAccounts', current: 'emmynetAccountEmail', signed: 'emmynetSignedIn', apps: 'emmynetApplications', outbox: 'emmynetOutbox' };
  const mem = {};   // used if the browser blocks localStorage (lasts until the page is closed)
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); if (raw !== null) return JSON.parse(raw); } catch (e) { /* blocked */ }
    return key in mem ? JSON.parse(mem[key]) : fallback;
  };
  const write = (key, value) => { const text = JSON.stringify(value); mem[key] = text; try { localStorage.setItem(key, text); } catch (e) { /* blocked */ } };
  const remove = key => { delete mem[key]; try { localStorage.removeItem(key); } catch (e) { /* blocked */ } };
  const norm = email => String(email || '').trim().toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // a one-way scramble of the password, so the password itself is never saved. [server] a real site does this on the server.
  async function hashPassword(email, password) {
    const text = norm(email) + '|' + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;   // small fallback for browsers that block crypto.subtle (not secure)
    for (let i = 0; i < text.length; i++) { const ch = text.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'x' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  // ---------- accounts ----------
  // [server] info = { name, email, password, role, gender, country, state }. Signing up does NOT sign the student in.
  async function createAccount(info) {
    const email = norm(info.email), all = read(K.accounts, {});
    if (all[email]) return { ok: false, reason: 'exists' };
    all[email] = { name: info.name, email, role: info.role || '', gender: info.gender || '', country: info.country || '', state: info.state || '',
      hash: await hashPassword(email, info.password), created: Date.now() };
    write(K.accounts, all);
    write(K.current, email);   // this browser now knows who is applying, but the student still has to sign in for the dashboard
    remove(K.signed);
    return { ok: true };
  }
  // [server] returns 'ok', 'noaccount' or 'wrong'
  async function checkLogin(email, password) {
    const acc = read(K.accounts, {})[norm(email)];
    if (!acc) return 'noaccount';
    return acc.hash === await hashPassword(email, password) ? 'ok' : 'wrong';
  }
  const currentEmail = () => read(K.current, '') || '';
  const getAccount = email => read(K.accounts, {})[norm(email)] || null;
  const signIn = email => { write(K.current, norm(email)); write(K.signed, '1'); };
  const signOut = () => remove(K.signed);
  const isSignedIn = () => !!read(K.signed, null) && !!currentEmail();

  // ---------- applications (one per account for now) ----------
  // status: 'submitted' (application sent, payment still to do) or 'paid'
  const getApplication = email => read(K.apps, {})[norm(email)] || null;
  function saveApplication(email, data) {   // [server]
    const all = read(K.apps, {}), key = norm(email);
    all[key] = Object.assign(all[key] || {}, data);
    write(K.apps, all);
    return all[key];
  }

  // ---------- emails (DEMO: kept in the demo mailbox instead of being sent) ----------
  function sendEmail(mail) {   // [server] mail = { to, subject, html }
    const box = read(K.outbox, []);
    box.unshift({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), to: mail.to, subject: mail.subject, html: mail.html, sent: Date.now() });
    write(K.outbox, box.slice(0, 50));
  }
  const outbox = () => read(K.outbox, []);

  // the congratulation email: a = { name, programme, appNo, payUrl }
  function applicationEmail(a) {
    return {
      subject: 'Congratulations! Your application has been submitted',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #d3ddf3;border-radius:12px;overflow:hidden;color:#0a1a5c">
  <div style="background:#0a1a5c;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">⌘ EMMYNET <span style="color:#f5a800">ICT HUB</span></div>
  <div style="padding:26px 24px">
    <h2 style="margin:0 0 10px;font-size:24px">🎉 Congratulations, ${esc(a.name)}!</h2>
    <p style="font-size:16px;line-height:1.6;margin:0 0 6px">Your application for <b>${esc(a.programme)}</b> has been submitted successfully.</p>
    <p style="font-size:14px;color:#5b6b9a;margin:0 0 20px">Application number: <b>${esc(a.appNo)}</b></p>
    <div style="background:#f3f6fd;border-radius:10px;padding:18px;text-align:center">
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold">Proceed to payment to access your training materials and student dashboard.</p>
      <a href="${esc(a.payUrl)}" style="display:inline-block;background:#1243e0;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:12px 34px;border-radius:8px">Click here</a>
    </div>
    <p style="font-size:13px;color:#5b6b9a;margin:20px 0 0">Questions? Reply to this email or call +234 816 5960618.</p>
  </div>
</div>`
    };
  }

  return { createAccount, checkLogin, currentEmail, getAccount, signIn, signOut, isSignedIn, getApplication, saveApplication, sendEmail, outbox, applicationEmail };
})();
