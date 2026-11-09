// VERIFY PAGE: an employer types a certificate number and sees whether it is real.
// EDIT LATER (phase 4): School.findCertificate() will ask your server instead of this browser.
const { esc, fmtLong, findCertificate } = School;
const certNo = document.getElementById('certNo');
const result = document.getElementById('result');

function check(no) {
  no = no.trim();
  if (!no) { result.innerHTML = ''; return; }
  const c = findCertificate(no);
  result.innerHTML = c
    ? `<div class="result ok"><h2>✅
     This certificate is genuine</h2>
     <dl>
        <dt>Name</dt>
        <dd>${esc(c.name)}</dd>
        <dt>Programme</dt>
        <dd>${esc(c.programme)}</dd>
        <dt>Level</dt>
        <dd>${esc(c.grade)}</dd>
        <dt>Final score</dt>
        <dd>${c.score}%</dd>
        <dt>Date issued</dt>
        <dd>${fmtLong(c.date)}
        </dd>
        <dt>Number</dt>
        <dd>${esc(c.no)}</dd>
        </dl>
        </div>`
    : `<div class="result bad"><h2>❌ Certificate not found</h2>
    <p style="margin:0">No certificate has this number. Check the number and try again.</p>
    </div>`;
}
document.getElementById('verifyForm').addEventListener('submit', e => { e.preventDefault(); check(certNo.value); });
// a link such as verify.html?no=EMM-2026-000001 fills the box and checks it straight away
const fromLink = new URLSearchParams(location.search).get('no');
if (fromLink) { certNo.value = fromLink; check(fromLink); }
