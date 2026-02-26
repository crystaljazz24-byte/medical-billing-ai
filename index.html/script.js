function $(id){ return document.getElementById(id); }

const STORAGE_KEY = "assuremed_rev_optimizer_v2";
const PRO_KEY = "ASSUREMED-PRO"; // simple launch-key (replace later with real auth)
const PRO_FLAG_KEY = "assuremed_isPro";

// Put your Stripe Payment Link here (when you create it)
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/cNi4gzgMDavS0EJ68u8IU01";

const CPTS = [
  { code:"90832", title:"90832 — Psychotherapy (30 min)", desc:"Individual psychotherapy, 30 minutes." },
  { code:"90834", title:"90834 — Psychotherapy (45 min)", desc:"Individual psychotherapy, 45 minutes." },
  { code:"90837", title:"90837 — Psychotherapy (60 min)", desc:"Individual psychotherapy, 60 minutes." },
  { code:"90853", title:"90853 — Group psychotherapy", desc:"Group psychotherapy (non multi-family group)." },
  { code:"90791", title:"90791 — Psych diagnostic eval (no med)", desc:"Psychiatric diagnostic evaluation without medical services." },
  { code:"90792", title:"90792 — Psych diagnostic eval (with med)", desc:"Psychiatric diagnostic evaluation with medical services." },
  { code:"90839", title:"90839 — Crisis psychotherapy (first 60 min)", desc:"Psychotherapy for crisis, first 60 minutes. Optional add-on 90840 for additional 30 min." }
];

function money(n){
  if (!Number.isFinite(n)) return "$0.00";
  return "$" + n.toFixed(2);
}
function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function int0(v){
  const n = Math.floor(num(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setVisible(el, yes){
  if (!el) return;
  el.classList.toggle("hidden", !yes);
}
function showWarn(lines){
  const box = $("warnBox");
  if (!lines || lines.length === 0){
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  box.style.display = "block";
  box.innerHTML = lines.map(l => `• ${l}`).join("<br>");
}
function showGood(msg){
  const box = $("goodBox");
  if (!msg){
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  box.style.display = "block";
  box.innerHTML = msg;
}

// ---------- Pro mode ----------
function isPro(){
  try { return localStorage.getItem(PRO_FLAG_KEY) === "true"; }
  catch { return false; }
}
function setPro(v){
  try { localStorage.setItem(PRO_FLAG_KEY, v ? "true" : "false"); } catch {}
  renderPlanUI();
}
function renderPlanUI(){
  const pro = isPro();
  $("planLabel").textContent = pro ? "Pro" : "Free";
  $("proDot").classList.toggle("pro", pro);

  setVisible($("lockBtn"), pro);

  // Lock/unlock Pro sections
  $("proMixSection").style.opacity = pro ? "1" : "0.55";
  $("proCompareSection").style.opacity = pro ? "1" : "0.55";

  // Disable Pro controls when not pro
  const proInputs = [
    "mixCode","mixRate","mixCount","addMixBtn","clearMixBtn",
    "rate90834","rate90837","sessionsForCompare","calcCompare"
  ];
  proInputs.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.disabled = !pro;
  });

  if (!pro){
    $("compareBox").innerHTML = "<div class='mini'>Unlock Pro to use the loss estimator.</div>";
    $("mixTotals").innerHTML = "<div class='mini'>Unlock Pro to use weekly mix totals.</div>";
  } else {
    // refresh outputs
    renderMixTable();
    calc();
  }
}

// ---------- State ----------
let mix = []; // {code, rate, count}

function getState(){
  return {
    cpt: $("cpt").value,
    rate: $("rate").value,
    sessionsPerWeek: $("sessionsPerWeek").value,
    weeksPerMonth: $("weeksPerMonth").value,
    payerMultiplier: $("payerMultiplier").value,
    addon90840: $("addon90840").checked,
    crisisRate: $("crisisRate").value,
    crisisAddonsPerWeek: $("crisisSessionsPerWeek").value,
    rate90834: $("rate90834").value,
    rate90837: $("rate90837").value,
    sessionsForCompare: $("sessionsForCompare").value,
    mix
  };
}
function setState(s){
  if (!s) return;
  if (s.cpt) $("cpt").value = s.cpt;

  $("rate").value = s.rate ?? "";
  $("sessionsPerWeek").value = s.sessionsPerWeek ?? "";
  $("weeksPerMonth").value = s.weeksPerMonth ?? "4.33";
  $("payerMultiplier").value = s.payerMultiplier ?? "";

  $("addon90840").checked = !!s.addon90840;
  $("crisisRate").value = s.crisisRate ?? "";
  $("crisisSessionsPerWeek").value = s.crisisAddonsPerWeek ?? "";

  $("rate90834").value = s.rate90834 ?? "";
  $("rate90837").value = s.rate90837 ?? "";
  $("sessionsForCompare").value = s.sessionsForCompare ?? "";

  if (Array.isArray(s.mix)) mix = s.mix;
}
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
  }catch(e){}
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}

// ---------- Populate UI ----------
function populateCPTs(){
  const sel = $("cpt");
  const mixSel = $("mixCode");
  sel.innerHTML = "";
  mixSel.innerHTML = "";
  CPTS.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.code;
    opt.textContent = item.title;
    sel.appendChild(opt);

    const opt2 = document.createElement("option");
    opt2.value = item.code;
    opt2.textContent = item.code;
    mixSel.appendChild(opt2);
  });
  sel.value = "90834";
  mixSel.value = "90834";
}

function updateCptInfo(){
  const code = $("cpt").value;
  const meta = CPTS.find(x => x.code === code);
  $("cptTitle").textContent = meta ? meta.title : code;
  $("cptDesc").textContent = meta ? meta.desc : "";
}

function updateAddonVisibility(){
  const code = $("cpt").value;
  const isCrisis = code === "90839";
  setVisible($("addonWrap"), isCrisis);
  setVisible($("addonFields"), isCrisis && $("addon90840").checked);
  if (!isCrisis){
    $("addon90840").checked = false;
    $("crisisRate").value = "";
    $("crisisSessionsPerWeek").value = "";
  }
}

// ---------- Calculations ----------
function calc(){
  updateCptInfo();
  updateAddonVisibility();

  const code = $("cpt").value;

  const rate = num($("rate").value);
  const sessionsPerWeek = int0($("sessionsPerWeek").value);
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  const warn = [];
  if (rate <= 0) warn.push("Enter a session rate greater than $0.");
  if (sessionsPerWeek <= 0) warn.push("Enter sessions per week (1 or more) to see projections.");
  if (weeksPerMonth <= 0) warn.push("Weeks per month must be greater than 0.");
  if (payerMultRaw && payerMult <= 0) warn.push("Payer multiplier must be greater than 0.");

  const addonOn = $("addon90840").checked;
  const addonRate = num($("crisisRate").value);
  const addonCount = int0($("crisisSessionsPerWeek").value);

  if (code === "90839" && addonOn){
    if (addonRate <= 0) warn.push("Add-on enabled but 90840 rate is $0. Enter a 90840 rate.");
    if (addonCount <= 0) warn.push("Add-on enabled but add-ons/week is 0. Enter weekly 90840 count.");
  }

  showWarn(warn);

  const revPerSession = rate * payerMult;
  let weekly = revPerSession * sessionsPerWeek;

  if (code === "90839" && addonOn && addonRate > 0 && addonCount > 0){
    weekly += (addonRate * payerMult) * addonCount;
  }

  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  $("revPerSession").textContent = money(revPerSession);
  $("revWeekly").textContent = money(weekly);
  $("revMonthly").textContent = money(monthly);
  $("revYearly").textContent = money(yearly);

  if (rate > 0 && sessionsPerWeek > 0){
    showGood(`Nice — at ${sessionsPerWeek} sessions/week, you’re projecting <strong>${money(monthly)}</strong> per month (estimate).`);
  } else {
    showGood("");
  }

  if (isPro()){
    renderMixTotals();
  }

  saveState();
}

function calcLoss(){
  if (!isPro()){
    $("compareBox").innerHTML = "<div class='mini'>Unlock Pro to use the loss estimator.</div>";
    return;
  }

  const r34 = num($("rate90834").value);
  const r37 = num($("rate90837").value);
  const sessions = int0($("sessionsForCompare").value);

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  if (r34 <= 0 || r37 <= 0 || sessions <= 0){
    $("compareBox").innerHTML = "<div class='mini'>Please enter both rates and sessions/week.</div>";
    return;
  }

  const diffPerSession = (r37 - r34) * payerMult;
  const weeklyDiff = diffPerSession * sessions;
  const monthlyDiff = weeklyDiff * weeksPerMonth;
  const yearlyDiff = weeklyDiff * 52;

  const label = diffPerSession >= 0 ? "Potential undercoding loss" : "Difference (your 90834 input is higher)";

  $("compareBox").innerHTML = `
    <div><strong>${label} per session:</strong> ${money(diffPerSession)}</div>
    <div style="margin-top:8px;"><strong>Weekly difference:</strong> ${money(weeklyDiff)}</div>
    <div><strong>Monthly difference:</strong> ${money(monthlyDiff)}</div>
    <div><strong>Yearly difference:</strong> ${money(yearlyDiff)}</div>
    <div class="mini" style="margin-top:10px;">Reminder: bill based on documentation/time rules and payer policy.</div>
  `;
  saveState();
}

// ---------- Weekly Mix (Pro) ----------
function addMixItem(){
  if (!isPro()) return;

  const code = $("mixCode").value;
  const rate = num($("mixRate").value);
  const count = int0($("mixCount").value);

  if (!code || rate <= 0 || count <= 0) return;

  mix.push({ code, rate, count });
  $("mixRate").value = "";
  $("mixCount").value = "";
  renderMixTable();
  renderMixTotals();
  saveState();
}

function removeMixItem(idx){
  mix.splice(idx, 1);
  renderMixTable();
  renderMixTotals();
  saveState();
}

function clearMix(){
  mix = [];
  renderMixTable();
  renderMixTotals();
  saveState();
}

function renderMixTable(){
  const tbody = $("mixTbody");
  tbody.innerHTML = "";

  if (!isPro()){
    tbody.innerHTML = "";
    return;
  }

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  mix.forEach((item, idx) => {
    const weekly = (item.rate * payerMult) * item.count;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>${money(item.rate)}</td>
      <td>${item.count}</td>
      <td>${money(weekly)}</td>
      <td><button class="btn btnGhost" data-remove="${idx}" style="padding:8px 10px;font-size:12px;">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeMixItem(parseInt(btn.dataset.remove, 10)));
  });
}

function renderMixTotals(){
  const box = $("mixTotals");

  if (!isPro()){
    box.innerHTML = "<div class='mini'>Unlock Pro to use weekly mix totals.</div>";
    return;
  }
  if (!mix.length){
    box.innerHTML = "<div class='mini'>Add codes to see weekly/monthly/yearly totals.</div>";
    return;
  }

  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;
  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  let weekly = 0;
  let totalCount = 0;

  for (const item of mix){
    weekly += (item.rate * payerMult) * item.count;
    totalCount += item.count;
  }

  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  box.innerHTML = `
    <div><strong>Weekly sessions (mix):</strong> ${totalCount}</div>
    <div><strong>Weekly revenue (mix):</strong> ${money(weekly)}</div>
    <div><strong>Monthly revenue (mix):</strong> ${money(monthly)}</div>
    <div><strong>Yearly revenue (mix):</strong> ${money(yearly)}</div>
    <div class="mini" style="margin-top:8px;">Multiplier applied: ${payerMult.toFixed(2)}</div>
  `;
}

// ---------- CSV Download ----------
function downloadCSV(){
  const s = getState();
  const payerMult = s.payerMultiplier?.trim() ? num(s.payerMultiplier) : 1;

  const rate = num(s.rate);
  const sessions = int0(s.sessionsPerWeek);
  const weeksPerMonth = num(s.weeksPerMonth) || 4.33;

  const revPerSession = rate * payerMult;
  let weekly = revPerSession * sessions;

  const isCrisis = s.cpt === "90839";
  const addonOn = !!s.addon90840;
  const addonRate = num(s.crisisRate);
  const addonCount = int0(s.crisisAddonsPerWeek);

  if (isCrisis && addonOn && addonRate > 0 && addonCount > 0){
    weekly += (addonRate * payerMult) * addonCount;
  }

  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  // Mix totals (if pro)
  let mixWeekly = 0, mixMonthly = 0, mixYearly = 0, mixCount = 0;
  if (isPro() && Array.isArray(s.mix) && s.mix.length){
    for (const item of s.mix){
      mixWeekly += (num(item.rate) * payerMult) * int0(item.count);
      mixCount += int0(item.count);
    }
    mixMonthly = mixWeekly * weeksPerMonth;
    mixYearly = mixWeekly * 52;
  }

  const rows = [
    ["Assure Med Therapist Revenue Optimizer", ""],
    ["Generated", new Date().toISOString()],
    ["Plan", isPro() ? "Pro" : "Free"],
    ["", ""],
    ["Selected CPT", s.cpt],
    ["Rate per session", rate],
    ["Sessions per week", sessions],
    ["Weeks per month", weeksPerMonth],
    ["Payer multiplier", payerMult],
    ["Crisis add-on enabled", isCrisis ? (addonOn ? "Yes" : "No") : "N/A"],
    ["90840 add-on rate", isCrisis ? addonRate : ""],
    ["90840 add-ons/week", isCrisis ? addonCount : ""],
    ["", ""],
    ["Revenue per session (after multiplier)", revPerSession.toFixed(2)],
    ["Weekly revenue (single)", weekly.toFixed(2)],
    ["Monthly revenue (single)", monthly.toFixed(2)],
    ["Yearly revenue (single)", yearly.toFixed(2)],
    ["", ""],
    ["Weekly sessions (mix)", isPro() ? mixCount : "Locked"],
    ["Weekly revenue (mix)", isPro() ? mixWeekly.toFixed(2) : "Locked"],
    ["Monthly revenue (mix)", isPro() ? mixMonthly.toFixed(2) : "Locked"],
    ["Yearly revenue (mix)", isPro() ? mixYearly.toFixed(2) : "Locked"]
  ];

  const csv = rows.map(r =>
    r.map(cell => {
      const v = String(cell ?? "");
      const needsQuotes = /[",\n]/.test(v);
      const escaped = v.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_revenue_summary.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// ---------- Print / Save PDF ----------
function printPDF(){
  // The page already has print CSS; this opens print dialog.
  // User can choose “Save as PDF”.
  window.print();
}

// ---------- Demo / Reset ----------
function loadDemo(){
  setState({
    cpt: "90834",
    rate: "115",
    sessionsPerWeek: "18",
    weeksPerMonth: "4.33",
    payerMultiplier: "1.05",
    addon90840: false,
    crisisRate: "",
    crisisAddonsPerWeek: "",
    rate90834: "115",
    rate90837: "150",
    sessionsForCompare: "18",
    mix: [
      { code:"90834", rate:115, count:12 },
      { code:"90837", rate:150, count:6 }
    ]
  });
  renderMixTable();
  renderMixTotals();
  calc();
}

function resetAll(){
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  setState({
    cpt: "90834",
    rate: "",
    sessionsPerWeek: "",
    weeksPerMonth: "4.33",
    payerMultiplier: "",
    addon90840: false,
    crisisRate: "",
    crisisAddonsPerWeek: "",
    rate90834: "",
    rate90837: "",
    sessionsForCompare: "",
    mix: []
  });
  renderMixTable();
  renderMixTotals();
  calc();
}

// ---------- Pro buttons ----------
function openPay(){
  if (STRIPE_PAYMENT_LINK.startsWith("http")){
    window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
  } else {
    alert("Add your Stripe Payment Link in script.js (STRIPE_PAYMENT_LINK).");
  }
}

function unlockPro(){
  const key = prompt("Enter your Pro key:");
  if (!key) return;
  if (key.trim() === PRO_KEY){
    setPro(true);
    alert("Pro unlocked!");
  } else {
    alert("That key didn’t match. Try again.");
  }
}

function lockPro(){
  setPro(false);
  alert("Pro locked.");
}

// ---------- Wire up ----------
function wire(){
  populateCPTs();

  const saved = loadState();
  if (saved) setState(saved);

  // Plan UI
  renderPlanUI();

  // Events => calc
  ["cpt","rate","sessionsPerWeek","weeksPerMonth","payerMultiplier","addon90840","crisisRate","crisisSessionsPerWeek"]
    .forEach(id => $(id).addEventListener("input", () => { calc(); renderMixTable(); }));

  // Compare
  $("calcCompare").addEventListener("click", (e) => { e.preventDefault(); calcLoss(); });

  // Mix
  $("addMixBtn").addEventListener("click", (e) => { e.preventDefault(); addMixItem(); });
  $("clearMixBtn").addEventListener("click", (e) => { e.preventDefault(); clearMix(); });

  // Nav + actions
  $("jumpToCalc").addEventListener("click", () => $("calculator").scrollIntoView({behavior:"smooth"}));
  $("demoBtn").addEventListener("click", loadDemo);
  $("resetBtn").addEventListener("click", resetAll);
  $("downloadBtn").addEventListener("click", downloadCSV);
  $("printBtn").addEventListener("click", printPDF);

  // Pro actions
  $("openPayBtn").addEventListener("click", openPay);
  $("unlockBtn").addEventListener("click", unlockPro);
  $("lockBtn").addEventListener("click", lockPro);

  $("yr").textContent = new Date().getFullYear();

  // Initial render
  renderMixTable();
  calc();
}

wire();
