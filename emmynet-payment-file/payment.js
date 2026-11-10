
// ---------- 1. Mobile dropdown menu ----------
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('mainNav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.textContent = open ? '✕' : '☰';
});

// ---------- 2. Step names (used by BOTH the top indicator and the sidebar) ----------
const STEPS = ['Personal Information','Educational Background','Programme Selection',
               'Additional Information','Review & Submit','Payment','Enrolment Confirmation'];
let current = 1;     
// the step the user is on
let busy = false;    
// true while the indicator is animating (blocks double clicks)

const progress = document.getElementById('progress');
const sideSteps = document.getElementById('sideSteps');
STEPS.forEach(name => {
  progress.insertAdjacentHTML('beforeend',
    `<div class="p-step"><span class="line"><span class="fill"></span></span><div class="p-dot"></div>${name}</div>`);
  sideSteps.insertAdjacentHTML('beforeend', `<li><b></b>${name}</li>`);
});

// ---------- 3. Paint the page for the current step ----------
function paint() {
  progress.querySelectorAll('.p-step').forEach((el, i) => {
    const n = i + 1;
    const state = n < current ? 'done' : n === current ? 'current' : 'todo';
    el.className = 'p-step ' + state;
    el.querySelector('.p-dot').textContent = n < current ? '✓' : n;
    el.querySelector('.fill').style.width = n <= current ? '100%' : '0';   // green bar
  });
  sideSteps.querySelectorAll('li').forEach((li, i) => {
    const n = i + 1;
    li.className = n < current ? 'done' : n === current ? 'current' : 'todo';
    li.querySelector('b').textContent = n < current ? '✓' : n;
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', +p.dataset.step === current));
  document.getElementById('backBtn').hidden = current === 1 || current === 7;
  document.getElementById('nextBtn').hidden = current >= 6;
  // on step 5 the button says "Submit Application" and the summary is rebuilt from the answers
  document.getElementById('nextBtn').textContent = current === 5 ? 'Submit Application' : 'Next Step >';
  if (current === 5) renderReview();
  if (current === 7) renderSuccess();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- 4. Check the required fields on the visible step ----------
function validate() {
  let ok = true;
  document.querySelectorAll('.panel.active [required]').forEach(f => {
    const bad = !f.value.trim() || !f.checkValidity();
    f.closest('.field').classList.toggle('invalid', bad);   
    // red border + message
    if (bad) ok = false;
  });
  return ok;
}
// remove the red error as soon as the user edits the field
document.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));

// ---------- 5. Move forward (+1) or back (-1) with the indicator animation ----------
function go(dir) {
  if (busy) return;
  //if (dir > 0 && !validate()) return;         
   // stay put if the page is not filled in
  const target = current + dir;
  if (target < 1 || target > STEPS.length) return;
  busy = true;
  const fills = progress.querySelectorAll('.fill');
  // forward: grow the green bar into the next step; back: shrink the current step's bar
  if (dir > 0) fills[target - 1].style.width = '100%';
  else fills[current - 1].style.width = '0';
  // wait for the bar to finish (0.6s), then change the step and the page
  setTimeout(() => { current = target; paint(); busy = false; }, 650);
}
document.getElementById('nextBtn').addEventListener('click', () => go(1));
document.getElementById('backBtn').addEventListener('click', () => go(-1));

// ---------- 6. Payment step ----------
const payBtn = document.getElementById('payBtn');
const msg = document.getElementById('msg');
let chosen = null;
document.querySelectorAll('input[name="method"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.method').forEach(m => m.classList.remove('selected'));
    radio.closest('.method').classList.add('selected');
    chosen = radio.value;
    payBtn.disabled = false;
    msg.textContent = '';
    showPayDetails(chosen);   
    // show the card form / bank details / note for this method
  });
});
const setStatus = (id, cls) => document.getElementById(id).className = 's-item ' + cls;

// ---------- 6b. Demo details for each payment method (EDIT THIS LATER) ----------
// EDIT: put your real bank account details here
const BANK = { bank: 'Your Bank Name', name: 'Emmynet ICT Hub', number: '0123456789' };
const payDetails = document.getElementById('payDetails');

function showPayDetails(method) {
  let html = '<div class="pay-details"><span class="demo-tag">Demo only</span>';

  if (method === 'Credit/Debit Card') {
    // Paystack / Stripe secure card fields.
    html += `<h4>Card Details</h4>
      <div class="field">
        <label for="cardNo">Card Number</label>
        <input id="cardNo" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000">
      </div>
      <div class="field">
        <label for="cardName">Name on Card</label>
        <input id="cardName" placeholder="Name on card">
      </div>
      <div class="two">
        <div class="field">
          <label for="cardExp">Expiry Date</label>
          <input id="cardExp" maxlength="5" placeholder="MM/YY">
        </div>
        <div class="field">
          <label for="cardCvv">CVV</label>
          <input id="cardCvv" inputmode="numeric" maxlength="4" placeholder="123">
        </div>
      </div>
      <p>This is a demo form. Do not type real card details.</p>`;
  } else if (method === 'Bank Transfer') {
    // Shows the account the student should pay into (edit BANK above)
    html += `<h4>Bank Transfer Details</h4>
      <div class="bank-row"><span>Bank</span><b>${BANK.bank}</b></div>
      <div class="bank-row"><span>Account Name</span><b>${BANK.name}</b></div>
      <div class="bank-row"><span>Account Number</span><b>${BANK.number}</b></div>
      <p>Transfer the amount due, then click Pay Now to confirm.</p>`;
  } else {
    // PayPal / Paystack: on a real site, Pay Now opens their secure popup
    html += `<h4>${method}</h4><p>On the live site, clicking Pay Now opens the secure ${method} window.</p>`;
  }
  payDetails.innerHTML = html + '</div>';

  // add a space after every 4 digits of the card number as the user types
  const cardNo = document.getElementById('cardNo');
  if (cardNo) cardNo.addEventListener('input', () => {
    cardNo.value = cardNo.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
}

// the card form must be complete before paying (other methods have nothing to check)
function payDetailsValid() {
  if (chosen !== 'Credit/Debit Card') return true;
  const ok = document.getElementById('cardNo').value.length === 19 &&
             document.getElementById('cardName').value.trim() !== '' &&
             /^\d\d\/\d\d$/.test(document.getElementById('cardExp').value) &&
             document.getElementById('cardCvv').value.length >= 3;
  if (!ok) msg.textContent = 'Please fill in all card details correctly.';
  return ok;
}

// DEMO ONLY: a real site would call PayPal / Paystack from a server here
payBtn.addEventListener('click', () => {
  if (!chosen) { msg.textContent = 'Please choose a payment method.'; return; }
  if (!payDetailsValid()) return;   // card form must be complete
  payBtn.disabled = true;
  msg.textContent = 'Paying with ' + chosen + '…';
  setStatus('sPending', 'complete');
  setStatus('sProcessing', 'active');
  setTimeout(() => {
    setStatus('sProcessing', 'complete');
    setStatus('sSuccess', 'complete');
    msg.textContent = 'Payment confirmed.';
    setTimeout(() => go(1), 900);              // indicator moves to step 7
  }, 2000);
});

// ---------- 7. Programme cards (step 3) ----------
// Edit this list to change the programmes, durations and prices
const PROGRAMMES = [
  { name: 'Frontend Development',   duration: '2 Months', price: 120000, icon: '', color: '#1243e0' },
   { name: 'Backend Development',   duration: '2 Months', price: 120000, icon: '', color: '#1243e0' },
  { name: 'Excutive Assistant',   duration: '1 Months', price: 120000, icon: '🌐', color: '#1243e0' },
  { name: 'AI Automation',   duration: '1 Month',  price: 50000,  icon: '💻', color: '#f59e0b' },
  { name: 'Graphic Design',    duration: '3 Months', price: 100000, icon: '🎨', color: '#2563eb' },
  { name: 'Digital Marketing', duration: '2 Months', price: 80000,  icon: '📣', color: '#7c3aed' },
   { name: 'Customer support',   duration: '1 Month',  price: 50000,  icon: '💻', color: '#f59e0b' },
  { name: 'Computer Basics',   duration: '1 Month',  price: 50000,  icon: '💻', color: '#f59e0b' },
 
];
const progList = document.getElementById('progList');
PROGRAMMES.forEach((p, i) => {
  progList.insertAdjacentHTML('beforeend',
    `<label class="prog"><span class="pico" style="background:${p.color}">${p.icon}</span>
     <div><strong>${p.name}</strong><small>${p.duration}</small><div class="price">₦${p.price.toLocaleString('en-US')}</div></div>
     <input type="radio" name="programme" value="${i}"></label>`);
});
// highlight the chosen card and send the name + price to the Payment step
function selectProgramme(i) {
  progList.querySelectorAll('.prog').forEach((card, k) => {
    card.classList.toggle('selected', k === i);
    card.querySelector('input').checked = (k === i);
  });
  document.getElementById('progName').textContent = PROGRAMMES[i].name;
  document.getElementById('progAmount').textContent = '₦' + PROGRAMMES[i].price.toLocaleString('en-US');
}
progList.addEventListener('change', e => selectProgramme(+e.target.value));
selectProgramme(0);   // Web Development is selected by default
// Apply Now sends the programme in the link, e.g. payment.html?programme=Graphic%20Design
const wanted = new URLSearchParams(location.search).get('programme');
const wantedIndex = wanted ? PROGRAMMES.findIndex(p => p.name.toLowerCase() === wanted.trim().toLowerCase()) : -1;
if (wantedIndex >= 0) selectProgramme(wantedIndex);
// a programme on the training page that is not in this form's list yet: say so, so nobody pays for the wrong one by mistake
if (wanted && wantedIndex < 0) {
  const note = document.getElementById('wantedNote');
  note.textContent = 'You chose "' + wanted + '" on the training page, but it is not in this list yet. Please choose the programme you want below, or contact us.';
  note.hidden = false;
}

// ---------- 7b. Review summary (step 5) ----------
const val = id => document.getElementById(id).value.trim();
// make typed text safe to show inside HTML
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderReview() {
  const p = PROGRAMMES[+document.querySelector('input[name="programme"]:checked').value];
  const cards = [
    { step: 1, icon: '👤', title: 'Personal Information',
      lines: [val('name'), val('email') + ' | ' + val('phone'), val('gender') + ' | ' + val('location')] },
    { step: 2, icon: '🎓', title: 'Educational Background',
      lines: [val('qualification') + ' in ' + val('course'), val('institution') + ' | ' + val('gradYear')] },
    { step: 3, icon: '📚', title: 'Programme Selection',
      lines: [`${p.name} (${p.duration}) | ₦${p.price.toLocaleString('en-US')}`] },
    { step: 4, icon: 'ℹ️', title: 'Additional Information',
      lines: [val('reason'), 'Prior experience: ' + val('experience'), 'Heard about us: ' + val('source')] }
  ];
  document.getElementById('reviewBox').innerHTML = cards.map(c =>
    `<div class="rev"><span class="rico">${c.icon}</span>
       <div><strong>${c.title}</strong>${c.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
       <button class="edit" data-step="${c.step}">Edit</button></div>`).join('');
}
// "Edit" jumps straight back to that step
document.getElementById('reviewBox').addEventListener('click', e => {
  if (e.target.dataset.step) { current = +e.target.dataset.step; paint(); }
});

// ---------- 7c. Payment successful screen (step 7) ----------
let receipt = null;   // the reference and date are created once, when payment succeeds
function renderSuccess() {
  if (!receipt) {
    const now = new Date();
    receipt = {
      ref: 'PYT-' + now.getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '  |  ' +
            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amount: document.getElementById('progAmount').textContent,
      programme: document.getElementById('progName').textContent
    };
  }
  document.getElementById('okAmount').textContent = receipt.amount;
  document.getElementById('okRef').textContent = receipt.ref;
  document.getElementById('okDate').textContent = receipt.date;
}

// ---------- Print Receipt: opens the receipt (logo, student details, table and a QR code). In the print window choose "Save as PDF" to keep a copy. ----------
const RECEIPT_LOGO = '';   // OPTIONAL: path to your logo picture, for example 'asset/logo.png'. Empty = the round ⌘ mark is drawn for you.

// the QR code as a small SVG picture (it prints sharply). makeQR() comes from qrcode.js
function qrSvg(text, px) {
  const qr = makeQR(text), n = qr.getModuleCount(), q = 2;          // q = white border around the code
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c + q} ${r + q}h1v1h-1z`;
  const size = n + 2 * q;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
const plainText = s => String(s).normalize('NFD').replace(/[^\x20-\x7E]/g, '');     // the QR code only holds plain letters and numbers

document.getElementById('receiptBtn').addEventListener('click', () => {
  const p = PROGRAMMES.find(x => x.name === receipt.programme);
  const when = new Date(receipt.date.split('  |  ')[0]);
  const isoDate = isNaN(when) ? receipt.date : when.getFullYear() + '-' + String(when.getMonth() + 1).padStart(2, '0') + '-' + String(when.getDate()).padStart(2, '0');
  const amount = 'NGN ' + receipt.amount.replace(/[^0-9.,]/g, '');
  const name = (val('name') || 'Student').toUpperCase();
  const line = (label, value, side) => `<div class="${side}"><b>${label}:</b> ${esc(value || '-')}</div>`;
  const qrText = ['EMMYNET ICT HUB', 'RECEIPT ' + receipt.ref, plainText(name), plainText(receipt.programme), amount, isoDate].join(' | ');
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups so the receipt can open.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${esc(receipt.ref)}</title><style>
  @page{size:A4;margin:14mm}
  *{box-sizing:border-box}
  body{margin:0;background:#e5e7eb;font-family:"Times New Roman",Times,serif;color:#000}
  .bar{padding:12px;text-align:center;font-family:Arial,sans-serif}.bar button{padding:10px 26px;font-size:17px;cursor:pointer;border-radius:8px;border:1px solid #000;background:#fff}
  .page{max-width:190mm;min-height:250mm;margin:0 auto 24px;background:#fff;padding:14mm 12mm;box-shadow:0 4px 20px rgba(0,0,0,.15)}
  .logo{text-align:center;margin-bottom:22px}
  .logo img{height:92px;width:auto}
  .mark{display:inline-grid;place-items:center;width:92px;height:92px;border-radius:50%;border:5px solid #b68e22;font-size:46px;color:#1243e0;font-family:Arial,sans-serif}
  h1{margin:0;text-align:center;font-size:23px;font-weight:bold}
  h2{margin:2px 0 26px;text-align:center;font-size:21px;font-weight:bold;text-decoration:underline}
  .row{display:flex;justify-content:space-between;gap:20px;margin:0 0 16px;font-size:17px}
  .row .r{text-align:right}
  .no{text-align:center;font-size:17px;font-weight:bold;margin:30px 0 34px}
  table{width:100%;border-collapse:collapse;font-size:17px}
  th,td{border:1px solid #555;text-align:center;padding:10px 8px}
  th{font-weight:bold}
  .qr{text-align:right;margin-top:26px}.qr svg{display:inline-block}
  @media print{body{background:#fff}.bar{display:none}.page{box-shadow:none;margin:0;padding:0;max-width:none}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <div class="logo">${RECEIPT_LOGO ? `<img src="${esc(RECEIPT_LOGO)}" alt="Emmynet ICT Hub">` : '<div class="mark">⌘</div>'}</div>
  <h1>EMMYNET ICT HUB</h1>
  <h2>PAYMENT RECEIPT</h2>
  <div class="row">${line('NAME', name, 'l')}${line('PHONE', val('phone'), 'r')}</div>
  <div class="row">${line('EMAIL', val('email'), 'l')}${line('PAYMENT METHOD', (chosen || 'Online payment').toUpperCase(), 'r')}</div>
  <div class="row">${line('PROGRAMME', receipt.programme.toUpperCase(), 'l')}${line('DURATION', p ? p.duration.toUpperCase() : '', 'r')}</div>
  <div class="no">RECEIPT NUMBER: ${esc(receipt.ref)}</div>
  <table>
    <tr><th colspan="4">DESCRIPTION</th></tr>
    <tr><th style="width:9%">SN</th><th style="width:24%">DATE</th><th style="width:35%">ITEM</th><th style="width:32%">AMOUNT</th></tr>
    <tr><td>1</td><td>${esc(isoDate)}</td><td>TRAINING FEES</td><td>${esc(amount)}</td></tr>
  </table>
  <div class="qr">${qrSvg(qrText, 140)}</div>
</div></body></html>`);
  w.document.close();
});
// ---------- 7d. Student dashboard ----------
const dashboard = document.getElementById('dashboard');
const appParts = ['header', '.layout', 'footer'].map(s => document.querySelector(s));  // the application page
const dSide = document.getElementById('dSide');

// show the dashboard (true) or the application page (false)
function showDashboard(show) {
  appParts.forEach(el => el.hidden = show);
  dashboard.hidden = !show;
  window.scrollTo(0, 0);
}

// "View My Dashboard": fill the dashboard with the user's own details, then show it
document.getElementById('dashBtn').addEventListener('click', () => {
  const name = val('name') || 'Student';
  document.getElementById('dName').textContent = name;
  document.getElementById('dAvatar').textContent = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('dProg').textContent = receipt.programme;
  document.getElementById('dApplied').textContent = receipt.date.split('  |  ')[0];
  document.getElementById('dRef').textContent = receipt.ref;
  document.getElementById('dAmt').textContent = receipt.amount;
  document.getElementById('dMethod').textContent = chosen;
  showDashboard(true);
});

// the dashboard pages: [title, subtitle]. Profile and Support are not built yet.
const VIEWS = {
  dashboard: ['Student Dashboard', 'Track your applications, payments and training progress.'],
  applications: ['My Applications', 'All the programmes you have applied for.'],
  payments: ['Payments', 'Your payment history.'],
  progress: ['My Progress', 'Track your scores and see the certificate you are on track for.'],
  submissions: ['Submissions', 'See which assignments, tests and the final project you have handed in.'],
  certificates: ['Certificates', 'Your certificate status and download.'],
  profile: ['Profile', 'View and update your personal details.'],
  support: ['Support', 'We are here to help you.']
};
// switch the dashboard to another page (the CSS hides the cards that do not belong)
function showView(view) {
  document.querySelector('.d-body').dataset.view = view;
  document.getElementById('dTitle').textContent = VIEWS[view][0];
  document.getElementById('dSub').textContent = VIEWS[view][1];
  dashboard.querySelectorAll('.d-link[data-page]').forEach(x => x.classList.toggle('active', x.dataset.page === view));
  document.getElementById('dMsg').textContent = '';
  dSide.classList.remove('open');
  if (view === 'profile') fillProfile();
  if (view === 'progress') renderProgress();
  if (view === 'submissions') renderSubmissions();
  if (view === 'certificates') renderCertificate();
}

// ---------- Profile page ----------
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const byId = id => document.getElementById(id);

// fill the Profile page from the answers the user gave in the application
function fillProfile() {
  byId('pFullName').value = val('name');
  byId('pEmailIn').value = val('email');
  byId('pPhone').value = val('phone');
  byId('pLocation').value = val('location');
  byId('pAvatar').textContent = initials(val('name'));
  byId('pName').textContent = val('name');
  byId('pEmail').textContent = val('email');
  byId('pMsg').textContent = '';
  byId('pExtra').innerHTML = [['Date of Birth', val('dob')], ['Gender', val('gender')],
    ['Highest Qualification', val('qualification')], ['Institution', val('institution')],
    ['Programme', receipt.programme]].map(r =>
    `<div class="bank-row"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('');
}

// Save Changes: check the fields, then update the name everywhere
byId('saveProfile').addEventListener('click', () => {
  const name = byId('pFullName').value.trim();
  const email = byId('pEmailIn');
  if (!name || !email.value.trim() || !email.checkValidity() || !byId('pPhone').value.trim() || !byId('pLocation').value.trim()) {
    byId('pMsg').textContent = 'Please fill in every field with valid details.';
    return;
  }
  byId('name').value = name;               // keep the application form in sync
  byId('email').value = email.value.trim();
  byId('phone').value = byId('pPhone').value.trim();
  byId('location').value = byId('pLocation').value.trim();
  byId('dName').textContent = name;
  byId('dAvatar').textContent = initials(name);
  fillProfile();
  byId('pMsg').textContent = 'Changes saved.';
});

// ---------- Support page: message form (DEMO: nothing is sent anywhere) ----------
byId('sendMsg').addEventListener('click', () => {
  if (!byId('sSubject').value.trim() || !byId('sMessage').value.trim()) {
    byId('sOut').textContent = 'Please enter a subject and a message.';
    return;
  }
  byId('sOut').textContent = 'Message sent. (Demo: nothing is actually sent yet.)';
  byId('sSubject').value = '';
  byId('sMessage').value = '';
});

// "View Details" pop-up: lists everything about the application
const modal = document.getElementById('detailsModal');
function openDetails() {
  const p = PROGRAMMES.find(x => x.name === receipt.programme);
  const rows = [['Programme', receipt.programme], ['Duration', p ? p.duration : ''],
    ['Applied Date', receipt.date.split('  |  ')[0]], ['Status', 'Approved'],
    ['Name', val('name')], ['Email', val('email')], ['Phone', val('phone')],
    ['Amount Paid', receipt.amount], ['Payment Reference', receipt.ref]];
  document.getElementById('mBody').innerHTML =
    rows.map(r => `<div class="bank-row"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('');
  modal.hidden = false;
  document.getElementById('mClose').focus();
}
const closeDetails = () => modal.hidden = true;
document.getElementById('mClose').addEventListener('click', closeDetails);
modal.addEventListener('click', e => { if (e.target === modal) closeDetails(); });   
// click outside the box
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetails(); });

// clicks inside the dashboard: menu button, sidebar links, View All, View Details and logout
dashboard.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const note = document.getElementById('dMsg');
  if (b.id === 'logoutBtn') { try { localStorage.removeItem('emmynetLoggedIn'); } catch (err) {} window.location.href = LOGIN_URL; return; }   // back to the login page   
  // start again from step 1
  if (b.id === 'dMenu') {                                    
    // mobile: open / close the sidebar
    const open = dSide.classList.toggle('open');
    b.setAttribute('aria-expanded', open);
    return;
  }
  const go = b.dataset.page || b.dataset.go;      
   // sidebar links and "View All" buttons
  if (b.id === 'detailsBtn') {
    openDetails();
  } else if (go && VIEWS[go]) {
    showView(go);
  } else if (go) { 
  // Profile / Support: not built yet
    dashboard.querySelectorAll('.d-link[data-page]').forEach(x => x.classList.toggle('active', x === b));
    note.textContent = 'This page has not been built yet.';
    dSide.classList.remove('open');
  }
});

// ---------- 8. Fill the "Year of Graduation" list (this year back to 1980) ----------
const yearSelect = document.getElementById('gradYear');
for (let y = new Date().getFullYear(); y >= 1980; y--) {
  yearSelect.insertAdjacentHTML('beforeend', `<option>${y}</option>`);
}

// ---------- Profile photo ----------
const PHOTO_KEY = 'emmynetStudentPhoto';
function showPhoto(url) {
  ['dAvatar', 'pAvatar'].forEach(id => {
    const el = byId(id);
    el.style.backgroundImage = url ? `url("${url}")` : '';
    el.classList.toggle('has-photo', !!url);
    el.style.backgroundSize = url ? 'cover' : '';
    el.style.backgroundPosition = url ? 'center' : '';
  });
  byId('photoRemove').hidden = !url;
}
byId('photoBtn').addEventListener('click', () => byId('photoInput').click());
byId('photoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) { byId('pMsg').textContent = 'Please choose an image file.'; return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 256, canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const s = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      const url = canvas.toDataURL('image/jpeg', 0.85);
      try { localStorage.setItem(PHOTO_KEY, url); } catch (err) {}
      showPhoto(url);
      byId('pMsg').textContent = 'Photo updated.';
    };
    img.onerror = () => { byId('pMsg').textContent = 'That picture could not be opened. Try another one.'; };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
byId('photoRemove').addEventListener('click', () => {
  try { localStorage.removeItem(PHOTO_KEY); } catch (err) {}
  showPhoto('');
  byId('pMsg').textContent = 'Photo removed.';
});
let savedPhoto = '';
try { savedPhoto = localStorage.getItem(PHOTO_KEY) || ''; } catch (err) {}
showPhoto(savedPhoto);

// ---------- Student performance, submissions and certificate ----------
// The grading rules and the saved records live in school-data.js (edit the rules there).
const { GRADING, PARTS, calcPerformance, taskStatus, reminderNote, fmtDate, certificateHTML } = School;
const SHOW_DEMO = true;                     // false = hide the "Demo: choose a student" box

// EXAMPLE students (not saved anywhere). The "live" students come from the instructor page.
const daysAgo = n => n === null ? null : Date.now() - n * 864e5;
const work = (title, given, score = null, received = false) => ({ title, given: daysAgo(given), score, received, reminded: false });
const SCENARIOS = {
  early: { label: 'Early in the course', build: () => ({ attended: 4, held: 5,
    assignments: [work('Assignment 1: HTML basics', 9, 78), work('Assignment 2: CSS layout', 2)],
    tests: [work('Test 1', 7)], project: work('Final Project', null) }) },
  waiting: { label: 'Final project handed in, waiting for the score', build: () => ({ attended: 18, held: 20,
    assignments: [work('Assignment 1: HTML basics', 30, 85), work('Assignment 2: CSS layout', 20, 72)],
    tests: [work('Test 1', 28, 68), work('Test 2', 12, 74)], project: work('Final Project', 6, null, true) }) },
  distinction: { label: 'Finished: Distinction', build: () => ({ attended: 19, held: 20,
    assignments: [work('Assignment 1: HTML basics', 40, 90), work('Assignment 2: CSS layout', 28, 88)],
    tests: [work('Test 1', 35, 85), work('Test 2', 20, 82)], project: work('Final Project', 14, 91) }) },
  pass: { label: 'Finished: Pass (one assignment missed)', build: () => ({ attended: 17, held: 20,
    assignments: [work('Assignment 1: HTML basics', 40, 62), work('Assignment 2: CSS layout', 28)],
    tests: [work('Test 1', 35, 58), work('Test 2', 20, 60)], project: work('Final Project', 14, 66) }) },
  lowattendance: { label: 'Finished: high scores but low attendance', build: () => ({ attended: 12, held: 20,
    assignments: [work('Assignment 1: HTML basics', 40, 90), work('Assignment 2: CSS layout', 28, 92)],
    tests: [work('Test 1', 35, 88), work('Test 2', 20, 90)], project: work('Final Project', 14, 94) }) }
};
let student = SCENARIOS.early.build();
let liveId = null;                          // set when a student saved by the instructor page is chosen

// who is being shown: name, programme, payment, and the issued certificate (live students only)
function currentInfo() {
  const rec = liveId && School.getStudent(liveId);
  if (rec) return { name: rec.name, programme: rec.programme, paid: rec.paid, cert: School.certificateFor(liveId) };
  return { name: byId('dName').textContent, programme: receipt ? receipt.programme : '', paid: !!receipt, cert: null };
}

function renderProgress() {
  const c = calcPerformance(student);
  byId('pgScore').textContent = c.pct === null ? '-' : c.pct + '%';
  byId('pgBar').style.width = (c.pct || 0) + '%';
  let note = c.pct === null ? 'No scores yet.'
    : (c.finished ? 'Final score. Certificate level: ' : 'Score so far. You are on track for: ') + c.grade;
  if (c.lowAttendance) note += `. Attendance is below ${GRADING.minAttendance}%, so the certificate is a Certificate of Participation.`;
  byId('pgNote').textContent = note;
  byId('pgRows').innerHTML = PARTS.map(([k, label]) => {
    const v = c.part[k];
    const text = v === null ? (k === 'attendance' ? 'No classes yet' : 'No score yet')
      : Math.round(v) + '%' + (k === 'attendance' ? ` (${student.attended} of ${student.held} classes)` : '');
    return `<div class="perf-row"><div class="top"><span>${label} <small>(${GRADING.weights[k]}% of the total)</small></span><span>${text}</span></div>` +
      `<div class="bar"><i style="width:${v || 0}%"></i></div></div>`;
  }).join('');
}

function taskRow(t) {
  const s = taskStatus(t), rem = reminderNote(t);
  const sub = (t.given === null ? 'Not given yet' : 'Given ' + fmtDate(t.given)) + (rem ? ' · ' + rem : '');
  return `<div class="task"><div><b>${esc(t.title)}</b><small>${sub}</small></div>` +
    `<div><span class="badge ${s.cls}">${s.label}</span>${t.score !== null ? ' <b>' + t.score + '%</b>' : ''}</div></div>`;
}
function renderSubmissions() {
  const list = (items, empty) => items.length ? items.map(taskRow).join('') : `<p class="muted">${empty}</p>`;
  byId('subAssignments').innerHTML = list(student.assignments, 'No assignments given yet.');
  byId('subTests').innerHTML = list(student.tests, 'No tests given yet.');
  byId('subProject').innerHTML = taskRow(student.project);
}

// the certificate unlocks when the payment is complete and the final project score is in
function certState() {
  const c = calcPerformance(student), info = currentInfo();
  const paid = info.paid, submitted = student.project.score !== null, received = student.project.received;
  const attOk = c.part.attendance !== null && c.part.attendance >= GRADING.minAttendance;
  return { c, info, paid, submitted, attOk, unlocked: paid && submitted, pending: paid && !submitted && received };
}
function renderCertificate() {
  const { c, paid, submitted, attOk, unlocked, pending } = certState();
  byId('certBadge').textContent = unlocked ? 'Ready' : (pending ? 'Pending' : 'Locked');
  byId('certBadge').className = 'badge' + (unlocked ? '' : (pending ? ' info' : ' locked'));
  byId('certInfo').innerHTML = unlocked
    ? `<p>Congratulations! Your certificate is a <b>${esc(c.grade)}</b> with a final score of <b>${c.pct}%</b>.</p>`
    : (pending ? '<p class="muted">Your final project has been received. The certificate is ready as soon as the instructor uploads your score.</p>'
      : '<p class="muted">Your certificate unlocks when the payment is complete and your final project has been scored.</p>');
  const mark = ok => ok ? '✅' : '⬜';
  byId('certChecks').innerHTML =
    `<li>${mark(paid)} Payment completed</li>` +
    `<li>${mark(submitted)} Final project submitted and scored</li>` +
    `<li>${mark(attOk)} Attendance of ${GRADING.minAttendance}% or more <small class="muted">(below this you receive a Certificate of Participation)</small></li>`;
  byId('certBtn').disabled = !unlocked;
  byId('certMsg').textContent = '';
}
function renderAll() { renderProgress(); renderSubmissions(); renderCertificate(); }

// Download Certificate: opens the printable certificate. In the print window choose "Save as PDF" to keep a copy.
byId('certBtn').addEventListener('click', () => {
  const { c, info, unlocked } = certState();
  if (!unlocked) return;
  // live students have a real, verifiable number. Example students get a SAMPLE number that will not verify.
  const cert = info.cert || { no: 'SAMPLE-' + (receipt ? receipt.ref : '000000').replace(/\D/g, '').slice(-6), date: Date.now() };
  const w = window.open('', '_blank');
  if (!w) { byId('certMsg').textContent = 'Please allow pop-ups so the certificate can open.'; return; }
  w.document.write(certificateHTML({ name: info.name, programme: info.programme, grade: c.grade, score: c.pct, no: cert.no, date: cert.date }));
  w.document.close();
});

// Demo box: examples (not saved) and live students (saved by the instructor page)
const demoSelect = byId('demoScenario');
function populateDemo() {
  const keep = demoSelect.value;
  demoSelect.innerHTML = '<optgroup label="Examples (not saved)">' +
    Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('') + '</optgroup>' +
    '<optgroup label="Live students (from the instructor page)">' +
    School.load().students.map(r => `<option value="live:${r.id}">${esc(r.name)}</option>`).join('') + '</optgroup>';
  if ([...demoSelect.options].some(o => o.value === keep)) demoSelect.value = keep;
}
function chooseStudent() {
  const v = demoSelect.value;
  const rec = v.startsWith('live:') && School.getStudent(v.slice(5));
  if (rec) { liveId = rec.id; student = School.toView(rec); }
  else { liveId = null; student = (SCENARIOS[v] || SCENARIOS.early).build(); }
}
populateDemo();
demoSelect.addEventListener('change', () => { chooseStudent(); renderAll(); });
// the instructor page (another tab) saved something: refresh the live student
window.addEventListener('storage', e => { if (e.key === School.KEY) { populateDemo(); chooseStudent(); renderAll(); } });
if (!SHOW_DEMO) byId('demoCard').remove();

// ---------- LINKS WITH THE REST OF THE WEBSITE (edit these lines if your folders change) ----------
const LOGIN_URL = '../login%20files/login.html';        // where Logout sends the student
const SIGNUP_URL = '../login%20files/signup.html';      // where visitors without an account are sent (see REQUIRE_ACCOUNT)
// false = anyone can open this page (best while you build). true = visitors must have signed up or logged in first (DEMO ONLY: not real security).
const REQUIRE_ACCOUNT = false;
if (REQUIRE_ACCOUNT) { let ok = false; try { ok = !!localStorage.getItem('emmynetLoggedIn'); } catch (err) {} if (!ok) location.replace(SIGNUP_URL + location.search); }
// The page opens on what comes after the # in its address:
//   payment.html            -> the application form, step 1
//   payment.html#dashboard  -> the student dashboard (login sends students here)
//   payment.html#step3      -> step 3 (also step1 to step7, applications, payments, progress, submissions, certificates, profile, support)
const START_PAGE = location.hash.slice(1);
if (/^step[1-7]$/.test(START_PAGE)) {
  current = +START_PAGE.slice(4);
} else if (Object.prototype.hasOwnProperty.call(VIEWS, START_PAGE)) {
  if (!receipt) receipt = { ref: 'PYT-2026-000000', date: 'Nov 7, 2026  |  10:00 AM', amount: '₦120,000', programme: 'Web Development' };
  if (!chosen) chosen = 'Bank Transfer';
  document.getElementById('dashBtn').click();
  showView(START_PAGE);
}
paint();   // show step 1 when the page loads

