// ==========================================================
// INSTRUCTOR PAGE: attendance, give work, scores, reminders, certificates.
// All saving goes through school-data.js (the "School" object), so the student dashboard stays in step.
// ==========================================================
const { esc, fmtDate, fmtLong, taskStatus, dueForReminder, reminderDueAt, calcPerformance, toView, REMINDER_DAYS } = School;
const $ = id => document.getElementById(id);
const todayText = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dateToMs = text => new Date(text + 'T09:00:00').getTime();
const TYPE_LABEL = { assignment: 'Assignment', test: 'Test', project: 'Final Project' };

// ---------- passcode gate (DEMO ONLY: anyone can read this passcode, so it is not real security) ----------
const PASSCODE = 'emmynet-demo';        // EDIT: change it. Real login comes with the backend.
function openApp() { $('gate').hidden = true; $('app').hidden = false; renderAll(); }
$('gateForm').addEventListener('submit', e => {
  e.preventDefault();
  if ($('passcode').value === PASSCODE) { try { sessionStorage.setItem('instructorOpen', '1'); } catch (err) {} openApp(); }
  else $('gateMsg').textContent = 'Wrong passcode.';
});
$('lockBtn').addEventListener('click', () => { try { sessionStorage.removeItem('instructorOpen'); } catch (err) {} location.reload(); });

// ---------- tabs ----------
function showTab(name) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('main section').forEach(s => { s.hidden = s.dataset.tab !== name; });
}
$('tabs').addEventListener('click', e => { if (e.target.dataset.tab) showTab(e.target.dataset.tab); });

// ---------- shared pieces ----------
function fillProgrammes() {
  const names = [...new Set(School.load().students.map(r => r.programme))];
  ['attProg', 'giveProg'].forEach(id => {
    const sel = $(id), keep = sel.value;
    sel.innerHTML = '<option value="All">All programmes</option>' + names.map(n => `<option>${esc(n)}</option>`).join('');
    if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
  });
}

// ---------- 1. attendance ----------
function renderAttendance() {
  const prog = $('attProg').value || 'All';
  const list = School.load().students.filter(r => prog === 'All' || r.programme === prog);
  $('attList').innerHTML = list.length ? list.map(r => {
    const pct = r.held ? Math.round(r.attended / r.held * 100) : 0;
    return `<label class="check-row"><input type="checkbox" data-id="${r.id}" checked><span><b>${esc(r.name)}</b>` +
      `<small>${esc(r.programme)} · ${r.attended} of ${r.held} classes (${pct}%)</small></span></label>`;
  }).join('') : '<p class="muted">No students in this programme.</p>';
}
$('attProg').addEventListener('change', renderAttendance);
$('attSave').addEventListener('click', () => {
  const boxes = [...$('attList').querySelectorAll('input')];
  if (!boxes.length) { $('attMsg').textContent = 'No students to record.'; return; }
  if (!$('attDate').value) { $('attMsg').textContent = 'Please choose the class date.'; return; }
  const ok = School.recordAttendance($('attDate').value, $('attProg').value, boxes.map(b => b.dataset.id), boxes.filter(b => b.checked).map(b => b.dataset.id));
  $('attMsg').textContent = ok ? 'Attendance saved. Tick = present, untick = absent.' : 'This class (same date and programme) is already recorded.';
  renderAll();
});

// ---------- 2. give work ----------
function renderGiven() {
  const groups = {};
  School.load().students.forEach(r => r.work.forEach(t => {
    const key = t.type + '|' + t.title + '|' + t.given;
    (groups[key] ||= { t, count: 0, submitted: 0 }).count++;
    if (t.score !== null || t.received) groups[key].submitted++;
  }));
  const rows = Object.values(groups).sort((a, b) => b.t.given - a.t.given);
  $('giveList').innerHTML = '<table><tr><th>Title</th><th>Type</th><th>Given</th><th>Students</th><th>Submitted</th></tr>' +
    (rows.map(g => `<tr><td>${esc(g.t.title)}</td><td>${TYPE_LABEL[g.t.type]}</td><td>${fmtDate(g.t.given)}</td><td>${g.count}</td><td>${g.submitted} of ${g.count}</td></tr>`).join('') ||
      '<tr><td colspan="5">Nothing given yet.</td></tr>') + '</table>';
}
$('giveBtn').addEventListener('click', () => {
  const title = $('giveTitle').value.trim();
  if (!title || !$('giveDate').value) { $('giveMsg').textContent = 'Please enter a title and the date given.'; return; }
  const ms = dateToMs($('giveDate').value);
  const n = School.giveWork($('giveType').value, title, ms, $('giveProg').value);
  $('giveMsg').textContent = n ? `Given to ${n} student${n > 1 ? 's' : ''}. The ${REMINDER_DAYS}-day reminder clock ends on ${fmtDate(ms + REMINDER_DAYS * 864e5)}.`
    : 'Nobody received it (a final project is only given once to each student).';
  if (n) $('giveTitle').value = '';
  renderAll();
});

// ---------- 3. scores ----------
function renderScores() {
  const s = School.load(), sel = $('scStudent'), keep = sel.value;
  sel.innerHTML = s.students.map(r => `<option value="${r.id}">${esc(r.name)} (${esc(r.programme)})</option>`).join('');
  if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
  const rec = s.students.find(r => r.id === sel.value);
  if (!rec) { $('scTable').innerHTML = ''; return; }
  $('scInfo').textContent = `${rec.programme} · attendance ${rec.attended} of ${rec.held} classes`;
  $('scPaid').checked = rec.paid;
  $('scTable').innerHTML = '<table><tr><th>Work</th><th>Given</th><th>Received</th><th>Score (0-100)</th><th>Status</th></tr>' +
    (rec.work.map(t => {
      const st = taskStatus(t);
      return `<tr data-id="${t.id}"><td><b>${esc(t.title)}</b><br><small class="muted">${TYPE_LABEL[t.type]}</small></td><td>${fmtDate(t.given)}</td>` +
        `<td><input type="checkbox" class="recv" ${t.received || t.score !== null ? 'checked' : ''}></td>` +
        `<td><input type="number" class="scr" min="0" max="100" value="${t.score ?? ''}"></td>` +
        `<td><span class="badge ${st.cls}">${st.label}</span></td></tr>`;
    }).join('') || '<tr><td colspan="5">No work given to this student yet.</td></tr>') + '</table>';
  const c = calcPerformance(toView(rec)), cert = School.certificateFor(rec.id);
  $('scSummary').innerHTML = (c.pct === null ? 'No scores yet.' : `Score so far: <b>${c.pct}%</b> · ${c.finished ? 'Certificate level' : 'On track for'}: <b>${esc(c.grade)}</b>`) +
    '<br>' + (cert ? `Certificate issued: <b>${esc(cert.no)}</b> <button class="btn small light" type="button" id="printCert">Print certificate</button>`
      : 'Certificate not issued yet (needs payment and a saved final project score).');
  const pc = $('printCert');
  if (pc) pc.addEventListener('click', () => openCertificate(cert));
}
$('scStudent').addEventListener('change', renderScores);
$('scSave').addEventListener('click', () => {
  const rows = [];
  for (const tr of $('scTable').querySelectorAll('tr[data-id]')) {
    const raw = tr.querySelector('.scr').value.trim(), score = raw === '' ? null : Number(raw);
    if (score !== null && (isNaN(score) || score < 0 || score > 100)) { $('scMsg').textContent = 'Scores must be between 0 and 100.'; return; }
    rows.push({ id: tr.dataset.id, received: tr.querySelector('.recv').checked, score });
  }
  School.saveScores($('scStudent').value, $('scPaid').checked, rows);
  $('scMsg').textContent = 'Saved. The student dashboard now shows these results.';
  renderAll();
});

// ---------- 4. reminders ----------
function renderReminders() {
  const rows = [];
  School.load().students.forEach(r => r.work.forEach(t => { if (dueForReminder(t)) rows.push({ r, t }); }));
  rows.sort((a, b) => a.t.given - b.t.given);
  $('remList').innerHTML = '<table><tr><th>Student</th><th>Work</th><th>Given</th><th>Overdue</th><th>Reminder</th></tr>' +
    (rows.map(({ r, t }) => {
      const days = Math.floor((Date.now() - reminderDueAt(t)) / 864e5);
      const mail = `Subject: Reminder: ${t.title}\n\nHello ${r.name},\n\nThis is a friendly reminder that you have not yet submitted "${t.title}" for the ${r.programme} programme. It was given on ${fmtLong(t.given)}. Please submit it as soon as you can.\n\nEmmynet ICT Hub`;
      return `<tr><td>${esc(r.name)}</td><td>${esc(t.title)}</td><td>${fmtDate(t.given)}</td><td>${days <= 0 ? 'due today' : days + ' day' + (days > 1 ? 's' : '')}</td><td>` +
        (t.reminded ? '<span class="badge">Sent</span>' : `<button class="btn small" type="button" data-rem="${r.id}|${t.id}">Mark as sent</button>`) +
        `<details><summary>Email text</summary><pre>${esc(mail)}</pre></details></td></tr>`;
    }).join('') || '<tr><td colspan="5">Nobody needs a reminder right now.</td></tr>') + '</table>';
}
$('remList').addEventListener('click', e => {
  const v = e.target.dataset.rem;
  if (v) { const [sid, wid] = v.split('|'); School.markReminded(sid, wid); renderAll(); }
});

// ---------- 5. certificates ----------
function openCertificate(c) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups so the certificate can open.'); return; }
  w.document.write(School.certificateHTML(c)); w.document.close();
}
function renderCerts() {
  const certs = School.load().certificates;
  $('certList').innerHTML = '<table><tr><th>Number</th><th>Student</th><th>Programme</th><th>Level</th><th>Score</th><th>Date</th><th></th></tr>' +
    (certs.map((c, i) => `<tr><td><b>${esc(c.no)}</b></td><td>${esc(c.name)}</td><td>${esc(c.programme)}</td><td>${esc(c.grade)}</td><td>${c.score}%</td><td>${fmtDate(c.date)}</td>` +
      `<td><button class="btn small light" type="button" data-print="${i}">Print</button> <a href="verify.html?no=${encodeURIComponent(c.no)}">Verify</a></td></tr>`).join('') ||
      '<tr><td colspan="7">No certificates issued yet.</td></tr>') + '</table>';
}
$('certList').addEventListener('click', e => {
  if (e.target.dataset.print !== undefined) openCertificate(School.load().certificates[+e.target.dataset.print]);
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Delete everything you entered and restore the four example students?')) { School.resetDemo(); renderAll(); }
});

// ---------- start ----------
function renderAll() {
  fillProgrammes();
  renderAttendance(); renderGiven(); renderScores(); renderReminders(); renderCerts();
}
$('attDate').value = todayText();
$('giveDate').value = todayText();
$('remDays').textContent = $('remDays2').textContent = REMINDER_DAYS;
// the student dashboard or another tab changed the records: refresh
window.addEventListener('storage', e => { if (e.key === School.KEY && !$('app').hidden) renderAll(); });
try { if (sessionStorage.getItem('instructorOpen')) openApp(); } catch (err) {}
