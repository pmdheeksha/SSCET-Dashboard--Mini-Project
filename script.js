// ===== DATASET (1385 students embedded as JSON) =====


let D = [];
let F = [];
let CH = {};

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', async () => {
  tick();
  setInterval(tick, 1000);

  const response = await fetch("students_data.json");
  D = await response.json();

  F = [...D];

  applyF();
});

// ===== LIVE CLOCK =====
function tick() {
  document.getElementById('ltm').textContent =
    '🕐 ' + new Date().toLocaleTimeString('en-IN');
}

// ===== SLICER FILTER FUNCTION =====
function applyF() {
  const dep = document.getElementById('sd').value;
  const yr  = document.getElementById('sy').value;
  const sec = document.getElementById('ss').value;
  const gen = document.getElementById('sg2').value;
  const pl  = document.getElementById('sp').value;
  const it  = document.getElementById('si').value;

  // Filter master data based on selected slicers
  F = D.filter(s =>
    (!dep || s.Department         === dep) &&
    (!yr  || s.Year               === yr)  &&
    (!sec || s.Section            === sec) &&
    (!gen || s.Gender             === gen) &&
    (!pl  || s.Placement_Eligible === pl)  &&
    (!it  || s.Internship_Status  === it)
  );

  document.getElementById('fc').textContent = F.length;

  // Re-render all components
  rKPI();
  rDept();
  rCharts();
  rTable();
}

// ===== RESET ALL FILTERS =====
function resetF() {
  ['sd','sy','ss','sg2','sp','si']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('srch').value = '';
  document.getElementById('pp').className = 'pp';
  applyF();
}

// ===== AVERAGE HELPER =====
function avg2(arr, key) {
  const v = arr.map(s => +s[key]).filter(x => x > 0);
  return v.length ? (v.reduce((a,b) => a+b, 0) / v.length) : 0;
}

// ===== KPI CARDS RENDERER =====
function rKPI() {
  const d  = F;
  const t  = d.length;
  const el = d.filter(s => s.Placement_Eligible === 'Eligible').length;
  const ac = avg2(d, 'Current_CGPA').toFixed(2);
  const aa = avg2(d, 'Overall_Attendance_Percentage').toFixed(1);
  const wa = d.filter(s => s.Arrear_Count > 0).length;
  const pi = d.filter(s => s.Internship_Status === 'Paid Internship').length;
  const ct = d.reduce((a,s) => a + (+s.Certification_Count || 0), 0);
  const la = d.filter(s =>
    +s.Overall_Attendance_Percentage > 0 &&
    +s.Overall_Attendance_Percentage < 75).length;

  const ks = [
    { i:'👥', v:t,       l:'Total Students',        s:'7 Departments',              c:'b' },
    { i:'🎯', v:el,      l:'Placement Eligible',     s:((el/t)*100).toFixed(1)+'%', c:'g' },
    { i:'🏆', v:ac,      l:'Avg Current CGPA',       s:'Active semesters',           c:'a' },
    { i:'📅', v:aa+'%',  l:'Avg Attendance',         s:'Overall all semesters',      c:'b' },
    { i:'⚠️', v:wa,      l:'Students w/ Arrears',    s:((wa/t)*100).toFixed(1)+'%', c:'r' },
    { i:'💼', v:pi,      l:'Paid Internships',       s:'Active',                     c:'g' },
    { i:'📜', v:ct,      l:'Total Certifications',   s:'All departments',            c:'p' },
    { i:'🚨', v:la,      l:'Below 75% Attendance',   s:'Action required',            c:'r' },
  ];

  document.getElementById('kgrid').innerHTML = ks.map(k => `
    <div class="kc ${k.c}">
      <div class="ki">${k.i}</div>
      <div class="kv">${k.v}</div>
      <div class="kl">${k.l}</div>
      <div class="ks">${k.s}</div>
    </div>`).join('');
}

// ===== DEPARTMENT CARDS RENDERER =====
function rDept() {
  const depts = [
    'AI & DS','CSE','IT','Cyber Security',
    'ECE','BME','Mechanical Engineering'
  ];
  document.getElementById('dgrid').innerHTML = depts.map(dep => {
    const ds = F.filter(s => s.Department === dep);
    if (!ds.length) return '';
    const el = ds.filter(s => s.Placement_Eligible === 'Eligible').length;
    return `<div class="dc">
      <div class="dn">🏛 ${dep}</div>
      <div class="ds"><span>Students</span>
        <span>${ds.length}</span></div>
      <div class="ds"><span>Avg CGPA</span>
        <span>${avg2(ds,'Current_CGPA').toFixed(2)}</span></div>
      <div class="ds"><span>Avg Attendance</span>
        <span>${avg2(ds,'Overall_Attendance_Percentage').toFixed(1)}%</span></div>
      <div class="ds"><span>Placement Eligible</span>
        <span>${el} (${((el/ds.length)*100).toFixed(0)}%)</span></div>
      <div class="ds"><span>Avg Arrears</span>
        <span>${avg2(ds,'Arrear_Count').toFixed(1)}</span></div>
    </div>`;
  }).join('');
}

// ===== CHART DESTROY HELPER =====
function dChart(id) {
  if (CH[id]) { CH[id].destroy(); delete CH[id]; }
}

// ===== ALL 6 CHARTS RENDERER =====
function rCharts() {
  const d = F;
  const depts = ['AI & DS','CSE','IT','Cyber Security','ECE','BME','Mechanical Engineering'];
  const COLS  = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

  // --- Chart 1: Students per Department (Bar) ---
  dChart('dept');
  CH['dept'] = new Chart(document.getElementById('ch-dept'), {
    type: 'bar',
    data: {
      labels: depts.map(d => d.replace(' Engineering','')),
      datasets: [{
        label: 'Students',
        data: depts.map(dep => d.filter(s => s.Department === dep).length),
        backgroundColor: COLS,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // --- Chart 2: CGPA Distribution (Bar) ---
  dChart('cgpa');
  const cgpaBuckets = ['<5','5-6','6-7','7-8','8-9','9-10'];
  const cgpaCounts  = [
    d.filter(s => +s.Current_CGPA > 0 && +s.Current_CGPA < 5).length,
    d.filter(s => +s.Current_CGPA >= 5 && +s.Current_CGPA < 6).length,
    d.filter(s => +s.Current_CGPA >= 6 && +s.Current_CGPA < 7).length,
    d.filter(s => +s.Current_CGPA >= 7 && +s.Current_CGPA < 8).length,
    d.filter(s => +s.Current_CGPA >= 8 && +s.Current_CGPA < 9).length,
    d.filter(s => +s.Current_CGPA >= 9).length,
  ];
  CH['cgpa'] = new Chart(document.getElementById('ch-cgpa'), {
    type: 'bar',
    data: {
      labels: cgpaBuckets,
      datasets: [{
        data: cgpaCounts,
        backgroundColor: ['#ef4444','#f97316','#f59e0b','#84cc16','#10b981','#2563eb'],
        borderRadius: 6
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // --- Chart 3: Attendance Bands (Doughnut) ---
  dChart('att');
  CH['att'] = new Chart(document.getElementById('ch-att'), {
    type: 'doughnut',
    data: {
      labels: ['<60%','60-75%','75-85%','85-100%'],
      datasets: [{
        data: [
          d.filter(s => +s.Overall_Attendance_Percentage > 0
                     && +s.Overall_Attendance_Percentage < 60).length,
          d.filter(s => +s.Overall_Attendance_Percentage >= 60
                     && +s.Overall_Attendance_Percentage < 75).length,
          d.filter(s => +s.Overall_Attendance_Percentage >= 75
                     && +s.Overall_Attendance_Percentage < 85).length,
          d.filter(s => +s.Overall_Attendance_Percentage >= 85).length,
        ],
        backgroundColor: ['#ef4444','#f59e0b','#84cc16','#10b981'],
        borderWidth: 2
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // --- Chart 4: Placement Eligibility (Doughnut) ---
  dChart('pl');
  const ple = d.filter(s => s.Placement_Eligible === 'Eligible').length;
  CH['pl'] = new Chart(document.getElementById('ch-pl'), {
    type: 'doughnut',
    data: {
      labels: ['Eligible','Ineligible'],
      datasets: [{
        data: [ple, d.length - ple],
        backgroundColor: ['#10b981','#ef4444'],
        borderWidth: 2
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // --- Chart 5: Internship Status (Pie) ---
  dChart('in');
  const iTypes = ['Paid Internship','Unpaid Internship','Not Started'];
  CH['in'] = new Chart(document.getElementById('ch-in'), {
    type: 'pie',
    data: {
      labels: iTypes,
      datasets: [{
        data: iTypes.map(t => d.filter(s => s.Internship_Status === t).length),
        backgroundColor: ['#2563eb','#f59e0b','#94a3b8'],
        borderWidth: 2
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // --- Chart 6: Gender Split (Doughnut) ---
  dChart('g');
  CH['g'] = new Chart(document.getElementById('ch-g'), {
    type: 'doughnut',
    data: {
      labels: ['Male','Female'],
      datasets: [{
        data: [
          d.filter(s => s.Gender === 'Male').length,
          d.filter(s => s.Gender === 'Female').length
        ],
        backgroundColor: ['#2563eb','#ec4899'],
        borderWidth: 2
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// ===== TABLE RENDERER =====
function rTable() {
  const rows = F.slice(0, 250);  // show max 250 rows
  document.getElementById('tcnt').textContent =
    F.length + ' Records' + (F.length > 250 ? ' (showing 250)' : '');

  document.getElementById('tbody').innerHTML = rows.map(s => `
    <tr onclick="showP('${s.SIN_No}')">
      <td><strong>${s.SIN_No}</strong></td>
      <td>${s.Student_Name}</td>
      <td>${s.Department}</td>
      <td>${s.Year}</td>
      <td>${s.Section}</td>
      <td>${s.Gender}</td>
      <td class="${ac3(s.Overall_Attendance_Percentage)}">
        ${(+s.Overall_Attendance_Percentage).toFixed(2)}%
      </td>
      <td><strong>${(+s.Current_CGPA).toFixed(2)}</strong></td>
      <td>${+s.Arrear_Count > 0
        ? '<span style="color:#ef4444;font-weight:700;">' + s.Arrear_Count + '</span>'
        : '<span style="color:#10b981;">0</span>'
      }</td>
      <td>${s.Internal_Mark_1}</td>
      <td>${s.Internal_Mark_2}</td>
      <td>${s.Certification_Count}</td>
      <td>${s.Project_Count}</td>
      <td><span class="pill ${ip(s.Internship_Status)}">
        ${s.Internship_Status}</span></td>
      <td><span class="pill ${s.Placement_Eligible === 'Eligible' ? 'pe' : 'pi'}">
        ${s.Placement_Eligible}</span></td>
    </tr>`).join('');
}

// ===== ATTENDANCE COLOR CLASS =====
function ac3(v) {
  v = +v;
  if (v < 60) return 'al';   // Red
  if (v < 75) return 'am';   // Amber
  return 'ah';                // Green
}

// ===== INTERNSHIP PILL CLASS =====
function ip(s) {
  if (s === 'Paid Internship')   return 'paid';
  if (s === 'Unpaid Internship') return 'unp';
  return 'nos';
}

// ===== SEARCH FUNCTION =====
function doSearch() {
  const q  = document.getElementById('srch').value.trim().toLowerCase();
  const pp = document.getElementById('pp');

  if (!q || q.length < 2) { pp.className = 'pp'; return; }

  // Search in ALL 1385 records (not just filtered)
  const res = D.filter(s =>
    s.Student_Name.toLowerCase().includes(q) ||
    s.SIN_No.toLowerCase().includes(q)
  );

  if (!res.length) {
    pp.className = 'pp vis';
    pp.innerHTML = '<div class="no-res">❌ No student found for "' + q + '"</div>';
    return;
  }

  pp.className  = 'pp vis';
  pp.innerHTML  = res.slice(0, 5).map(s => mkProfile(s)).join('');
}

// ===== ROW CLICK - SHOW PROFILE =====
function showP(sin) {
  const s  = D.find(x => x.SIN_No === sin);
  if (!s) return;
  document.getElementById('srch').value = sin;
  const pp = document.getElementById('pp');
  pp.className = 'pp vis';
  pp.innerHTML = mkProfile(s);
  pp.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== ATTENDANCE COLOR (for profile bar) =====
function aclr(v) {
  v = +v;
  if (!v)    return '#94a3b8';   // Grey - no data
  if (v < 60) return '#ef4444'; // Red
  if (v < 75) return '#f59e0b'; // Amber
  return '#10b981';              // Green
}

// ===== FULL STUDENT PROFILE CARD BUILDER =====
function mkProfile(s) {
  const sems = [1,2,3,4,5,6,7];

  // Semester CGPA chips
  const cg = sems.map(i => {
    const v = +s['Sem'+i+'_CGPA'];
    return v > 0
      ? `<div class="chip"><span>Sem ${i}</span>${v.toFixed(2)}</div>`
      : '';
  }).join('');

  // Semester Attendance chips
  const at = sems.map(i => {
    const v = +s['Sem'+i+'_Attendance_Percentage'];
    return v > 0
      ? `<div class="chip chip-att"><span>Sem ${i}</span>${v.toFixed(1)}%</div>`
      : '';
  }).join('');

  const oa = +s.Overall_Attendance_Percentage;
  const cp = +s.Current_CGPA;

  return `
  <div>
    <!-- Profile Header -->
    <div class="ph">
      <div class="pav">${s.Student_Name.charAt(0)}</div>
      <div>
        <div class="pnm">${s.Student_Name}</div>
        <div class="psub">${s.SIN_No} • ${s.Email_ID}</div>
        <div class="pbadges">
          <span class="badge b-dep">${s.Department}</span>
          <span class="badge b-yr">${s.Year} — Sec ${s.Section}</span>
          <span class="badge ${s.Placement_Eligible === 'Eligible'
            ? 'b-el' : 'b-in'}">
            ${s.Placement_Eligible === 'Eligible'
              ? '✅ Eligible' : '❌ Ineligible'}
          </span>
        </div>
      </div>
    </div>

    <!-- Profile Body -->
    <div class="pb">

      <!-- Personal Info -->
      <div class="psec">
        <h4>👤 Personal Info</h4>
        <div class="prow"><span>DOB</span>
          <span>${String(s.Date_of_Birth).split('T')[0]}</span></div>
        <div class="prow"><span>Gender</span><span>${s.Gender}</span></div>
        <div class="prow"><span>Mentor</span><span>${s.Mentor_Name}</span></div>
        <div class="prow"><span>Parent</span><span>${s.Parent_Name}</span></div>
        <div class="prow"><span>Parent Mob</span>
          <span>${s.Parent_Mobile_No}</span></div>
        <div class="prow"><span>Student Mob</span>
          <span>${s.Student_Mobile_No}</span></div>
      </div>

      <!-- Academic Metrics -->
      <div class="psec">
        <h4>📊 Academic Metrics</h4>
        <div class="prow"><span>Current CGPA</span>
          <span style="color:#2563eb;font-size:1.1rem;">
            ${cp.toFixed(2)}</span></div>
        <!-- CGPA Progress Bar -->
        <div class="mbar">
          <div class="mbf"
            style="width:${Math.min(cp/10*100,100)}%;background:#2563eb">
          </div>
        </div>
        <div class="prow"><span>Overall Attendance</span>
          <span style="color:${aclr(oa)}">${oa.toFixed(2)}%</span></div>
        <!-- Attendance Progress Bar -->
        <div class="mbar">
          <div class="mbf"
            style="width:${Math.min(oa,100)}%;background:${aclr(oa)}">
          </div>
        </div>
        <div class="prow"><span>Internal Mark 1</span>
          <span>${s.Internal_Mark_1}/100</span></div>
        <div class="prow"><span>Internal Mark 2</span>
          <span>${s.Internal_Mark_2}/100</span></div>
        <div class="prow"><span>Arrear Count</span>
          <span style="color:${+s.Arrear_Count > 0
            ? '#ef4444' : '#10b981'}">${s.Arrear_Count}</span></div>
      </div>

      <!-- Activities -->
      <div class="psec">
        <h4>💡 Activities & Status</h4>
        <div class="prow"><span>Certifications</span>
          <span>📜 ${s.Certification_Count}</span></div>
        <div class="prow"><span>Projects</span>
          <span>🔬 ${s.Project_Count}</span></div>
        <div class="prow"><span>Internship</span>
          <span>${s.Internship_Status}</span></div>
        <div class="prow"><span>Placement</span>
          <span>${s.Placement_Eligible}</span></div>
      </div>

      <!-- Semester-wise CGPA & Attendance -->
      <div class="psec" style="grid-column:1/-1">
        <h4>🎓 Semester CGPA</h4>
        <div class="cgrid">${cg}</div>
        <h4 style="margin-top:11px">📅 Semester Attendance</h4>
        <div class="cgrid">${at}</div>
      </div>

    </div>
  </div>`;
}