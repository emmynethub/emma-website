// DEMO MAILBOX: shows the emails the site "sent" (kept in this browser). Clicking "Click here" inside an email works like the real one.
const { outbox } = Accounts;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function showMail(id) {
  const m = outbox().find(x => x.id === id);
  if (!m) return;
  $('viewer').hidden = false;
  $('mailHead').innerHTML = `<b>${esc(m.subject)}</b><br>To: ${esc(m.to)} &nbsp;|&nbsp; ${new Date(m.sent).toLocaleString('en-US')}`;
  // <base target="_top"> makes the "Click here" link open in the whole window, not inside the small frame
  $('frame').srcdoc = '<base target="_top"><body style="margin:0;padding:16px;background:#f3f6fd">' + m.html + '</body>';
  $('viewer').scrollIntoView({ behavior: 'smooth' });
}

function renderList() {
  const mails = outbox();
  $('list').innerHTML = mails.length
    ? '<table><tr><th>Subject</th><th>To</th><th>Sent</th><th></th></tr>' + mails.map(m =>
        `<tr><td><b>${esc(m.subject)}</b></td><td>${esc(m.to)}</td><td>${new Date(m.sent).toLocaleString('en-US')}</td>` +
        `<td><button class="btn small" type="button" data-id="${m.id}">Open</button></td></tr>`).join('') + '</table>'
    : '<p class="muted">No emails yet. Submit an application and the congratulation email will appear here.</p>';
}
$('list').addEventListener('click', e => { if (e.target.dataset.id) showMail(e.target.dataset.id); });

renderList();
const wanted = new URLSearchParams(location.search).get('id');
if (wanted) showMail(wanted); else if (outbox().length) showMail(outbox()[0].id);
