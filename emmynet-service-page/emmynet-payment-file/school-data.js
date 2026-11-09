/* ==========================================================
   SCHOOL DATA - shared by the student dashboard, the instructor page and the verify page.
   Grading rules, saved records (students, work, attendance) and certificates all live here.
   DEMO: records are kept in this browser (localStorage). EDIT LATER (phase 4): replace the
   load() / save() functions with calls to your server, and keep everything else the same.
   ========================================================== */
const School = (() => {
  // ---------- EDIT HERE: the grading rules (the four weights must add up to 100) ----------
  const GRADING = {
    weights: { attendance: 10, assignments: 30, tests: 20, project: 40 },
    minAttendance: 80,                        // below this the certificate is a Certificate of Participation
    levels: [{ name: 'Distinction', min: 80 }, { name: 'Merit', min: 65 }, { name: 'Pass', min: 50 }],
    fallback: 'Certificate of Participation'   // also used when the final score is below 50
  };
  const REMINDER_DAYS = 5;                     // a reminder is due this many days after work is given
  const PARTS = [['attendance', 'Attendance'], ['assignments', 'Assignments'], ['tests', 'Tests / Quizzes'], ['project', 'Final Project']];
  const DAY = 864e5;
  const KEY = 'emmynetSchoolData';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = ms => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtLong = ms => new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ---------- grading ----------
  function gradeFor(pct) {
    const lvl = GRADING.levels.find(l => pct >= l.min);
    return lvl ? lvl.name : GRADING.fallback;
  }
  // what the student sees for one assignment, test or project
  function taskStatus(t) {
    if (t.score !== null) return { label: 'Submitted', cls: '' };                  // the instructor has uploaded the score
    if (t.received) return { label: 'Received, awaiting score', cls: 'info' };
    if (t.given === null) return { label: 'Not given yet', cls: 'locked' };
    return { label: 'Yet to submit', cls: 'warn' };
  }
  const reminderDueAt = t => t.given + REMINDER_DAYS * DAY;
  // true when the work is still not submitted REMINDER_DAYS after it was given
  const dueForReminder = t => t.given !== null && !t.received && t.score === null && Date.now() >= reminderDueAt(t);
  function reminderNote(t) {
    if (t.given === null || t.received || t.score !== null) return '';
    return dueForReminder(t) ? (t.reminded ? 'Reminder sent' : 'Reminder due now') : 'Reminder on ' + fmtDate(reminderDueAt(t));
  }
  // average of a category. Work not handed in only counts as 0 once the final project has been scored.
  function catAverage(items, missingAsZero) {
    const given = items.filter(t => t.given !== null);
    const counted = missingAsZero ? given : given.filter(t => t.score !== null);
    return counted.length ? counted.reduce((a, t) => a + (t.score ?? 0), 0) / counted.length : null;
  }
  // s = { attended, held, assignments: [], tests: [], project }  (see toView)
  function calcPerformance(s) {
    const finished = s.project.score !== null;
    const part = {
      attendance: s.held ? s.attended / s.held * 100 : null,
      assignments: catAverage(s.assignments, finished),
      tests: catAverage(s.tests, finished),
      project: s.project.score
    };
    let earned = 0, doneWeight = 0;
    PARTS.forEach(([k]) => {
      if (part[k] !== null) { earned += part[k] * GRADING.weights[k] / 100; doneWeight += GRADING.weights[k]; }
    });
    const pct = doneWeight ? Math.round(earned / doneWeight * 100) : null;      // score from the work counted so far
    const lowAttendance = part.attendance !== null && part.attendance < GRADING.minAttendance;
    const grade = pct === null ? '' : (lowAttendance ? GRADING.fallback : gradeFor(pct));
    return { part, pct, grade, finished, lowAttendance };
  }
  // turns a saved student record into the shape calcPerformance() needs
  function toView(rec) {
    return {
      attended: rec.attended, held: rec.held,
      assignments: rec.work.filter(t => t.type === 'assignment'),
      tests: rec.work.filter(t => t.type === 'test'),
      project: rec.work.find(t => t.type === 'project') || { title: 'Final Project', given: null, score: null, received: false }
    };
  }

  // ---------- saved records (DEMO: this browser only) ----------
  let memory = null;   // used if the browser blocks localStorage
  function seed() {
    const ago = d => Date.now() - d * DAY;
    const w = (id, type, title, given, score = null, received = false) => ({ id, type, title, given: ago(given), score, received, reminded: false });
    const stu = (id, name, programme, paid, attended, held, work) => ({ id, name, email: '', programme, paid, attended, held, work });
    const s = {
      students: [
        stu('s1', 'John Doe', 'Web Development', true, 18, 20, [w('a1', 'assignment', 'Assignment 1: HTML basics', 30, 85), w('a2', 'assignment', 'Assignment 2: CSS layout', 12), w('t1', 'test', 'Test 1', 25, 68), w('p1', 'project', 'Final Project', 6, null, true)]),
        stu('s2', 'Amina Bello', 'Web Development', true, 19, 20, [w('a1', 'assignment', 'Assignment 1: HTML basics', 30, 90), w('a2', 'assignment', 'Assignment 2: CSS layout', 12, 88), w('t1', 'test', 'Test 1', 25, 85), w('p1', 'project', 'Final Project', 6, 91)]),
        stu('s3', 'Chinedu Okeke', 'AI Automation', true, 12, 20, [w('a1', 'assignment', 'Assignment 1: Prompts', 30, 90), w('t1', 'test', 'Test 1', 25, 88), w('p1', 'project', 'Final Project', 6, 94)]),
        stu('s4', 'Grace Adeyemi', 'Customer Support', false, 4, 5, [w('a1', 'assignment', 'Assignment 1: Email replies', 9), w('t1', 'test', 'Test 1', 2)])
      ],
      classes: [],        // "date|programme" of every class register already saved
      certificates: []    // every certificate issued (the verify page reads this list)
    };
    syncCertificates(s);
    return s;
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { if (memory) return JSON.parse(memory); }
    const s = seed(); save(s); return s;
  }
  function save(s) {
    syncCertificates(s);
    const text = JSON.stringify(s);
    memory = text;
    try { localStorage.setItem(KEY, text); } catch (e) { /* storage blocked: records only last while this page is open */ }
  }
  const mutate = fn => { const s = load(); fn(s); save(s); return s; };
  const resetDemo = () => { const s = seed(); save(s); return s; };
  const getStudent = id => load().students.find(r => r.id === id) || null;

  // ---------- certificates ----------
  // a certificate is issued once the student has paid and the final project is scored. The number never changes.
  function syncCertificates(s) {
    s.students.forEach(rec => {
      const v = toView(rec);
      if (!rec.paid || v.project.score === null) return;
      const perf = calcPerformance(v);
      let cert = s.certificates.find(c => c.studentId === rec.id);
      if (!cert) {
        cert = { no: 'EMM-' + new Date().getFullYear() + '-' + String(s.certificates.length + 1).padStart(6, '0'), studentId: rec.id, date: Date.now() };
        s.certificates.push(cert);
      }
      Object.assign(cert, { name: rec.name, programme: rec.programme, grade: perf.grade, score: perf.pct });
    });
  }
  const certificateFor = id => load().certificates.find(c => c.studentId === id) || null;
  const findCertificate = no => { const n = String(no).trim().toUpperCase(); return load().certificates.find(c => c.no.toUpperCase() === n) || null; };

  // printable certificate: c = { name, programme, grade, score, no, date }
  function certificateHTML(c) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate ${esc(c.no)}</title><style>
  @page{size:A4 landscape;margin:0}
  *{box-sizing:border-box}
  body{margin:0;background:#e5e7eb;font-family:Georgia,"Times New Roman",serif;color:#0a1a5c;text-align:center}
  .page{width:297mm;height:210mm;margin:0 auto;background:#fff;padding:10mm}
  .frame{height:100%;border:3px solid #0a1a5c;padding:6px}
  .inner{height:100%;border:8px double #b68e22;padding:10mm 16mm;display:flex;flex-direction:column;justify-content:space-between}
  .org{letter-spacing:6px;font-size:15px;font-weight:bold;color:#1243e0}
  h1{margin:4px 0 0;font-size:54px;letter-spacing:8px;color:#0a1a5c}
  .sub{font-style:italic;color:#5b6b9a;font-size:18px;margin:0}
  .name{font-size:44px;margin:6px 0;color:#1243e0;border-bottom:2px solid #b68e22;display:inline-block;padding:0 28px 4px}
  p{margin:6px 0;font-size:19px}
  .prog{font-size:26px;font-weight:bold}
  .grade{font-size:30px;font-weight:bold;color:#b68e22;margin:4px 0}
  .row{display:flex;justify-content:space-between;align-items:flex-end}
  .sig{width:60mm;border-top:1px solid #0a1a5c;padding-top:4px;font-size:14px}
  .seal{width:26mm;height:26mm;border-radius:50%;background:radial-gradient(circle,#f5d56b,#b68e22);color:#fff;font-size:34px;display:grid;place-items:center;box-shadow:0 0 0 3px #fff,0 0 0 5px #b68e22}
  .meta{font-size:13px;color:#5b6b9a}
  .bar{padding:12px;text-align:center}.bar button{padding:10px 26px;font-size:17px;cursor:pointer}
  @media print{body{background:#fff}.bar{display:none}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page"><div class="frame"><div class="inner">
  <div><div class="org">EMMYNET ICT HUB</div><h1>CERTIFICATE</h1><p class="sub">of ${c.grade === GRADING.fallback ? 'Participation' : 'Achievement'}</p></div>
  <div><p>This is to certify that</p><div class="name">${esc(c.name)}</div>
    <p>has successfully completed the programme</p><p class="prog">${esc(c.programme)}</p>
    <p class="grade">${esc(c.grade)}</p><p>Final score: ${c.score}%</p></div>
  <div class="row"><div class="sig">Programme Director</div><div class="seal">★</div><div class="sig">Lead Instructor</div></div>
  <div class="meta">Date: ${fmtLong(c.date)} &nbsp;|&nbsp; Certificate No: <b>${esc(c.no)}</b> &nbsp;|&nbsp; Verify this certificate on the Emmynet ICT Hub verify page</div>
</div></div></div></body></html>`;
  }

  // ---------- instructor actions (each one saves, so the student pages update) ----------
  // class register: presentIds = students who came; studentIds = everyone listed. Returns false if this class is already recorded.
  function recordAttendance(date, programme, studentIds, presentIds) {
    const key = date + '|' + programme;
    if (load().classes.includes(key)) return false;
    mutate(s => {
      s.classes.push(key);
      s.students.filter(r => studentIds.includes(r.id)).forEach(r => { r.held += 1; if (presentIds.includes(r.id)) r.attended += 1; });
    });
    return true;
  }
  // give an assignment, test or the final project to every student of a programme ('All' = everyone). Returns how many got it.
  function giveWork(type, title, givenMs, programme) {
    let count = 0;
    mutate(s => s.students.forEach(r => {
      if (programme !== 'All' && r.programme !== programme) return;
      if (type === 'project' && r.work.some(t => t.type === 'project')) return;   // one final project per student
      r.work.push({ id: type[0] + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type, title, given: givenMs, score: null, received: false, reminded: false });
      count++;
    }));
    return count;
  }
  // rows = [{ id, received, score }]
  function saveScores(studentId, paid, rows) {
    mutate(s => {
      const r = s.students.find(x => x.id === studentId);
      r.paid = paid;
      rows.forEach(row => { const t = r.work.find(x => x.id === row.id); if (t) { t.received = row.received || row.score !== null; t.score = row.score; } });
    });
  }
  const markReminded = (studentId, workId) => mutate(s => { s.students.find(r => r.id === studentId).work.find(t => t.id === workId).reminded = true; });

  return { GRADING, REMINDER_DAYS, PARTS, KEY, esc, fmtDate, fmtLong, gradeFor, taskStatus, reminderNote, dueForReminder, reminderDueAt,
    calcPerformance, toView, load, resetDemo, getStudent, certificateFor, findCertificate, certificateHTML,
    recordAttendance, giveWork, saveScores, markReminded };
})();
