function $(id){ return document.getElementById(id); }

const STORAGE_KEY = "assuremed_session_sheet_v1";
const PRO_FLAG_KEY = "assuremed_isPro";
const PRO_KEY = "ASSUREMED-PRO";

// Put your Stripe Payment Link here
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/abc123xyz";

// --- Catalog (safe labels, not official AMA CPT descriptors) ---
const CODES = [
  { code:"99483", label:"Cognitive assessment & care planning", category:"Care Planning", unit:"per service", isAddon:false },

  { code:"90785", label:"Interactive complexity", category:"Complexity (Add-on)", unit:"add-on", isAddon:true },
  { code:"90791", label:"Psych diagnostic eval (no med)", category:"Diagnostic", unit:"per service", isAddon:false },
  { code:"90792", label:"Psych diagnostic eval (with med)", category:"Diagnostic", unit:"per service", isAddon:false },

  { code:"90832", label:"Psychotherapy (30 min)", category:"Psychotherapy", unit:"per session", isAddon:false },
  { code:"90834", label:"Psychotherapy (45 min)", category:"Psychotherapy", unit:"per session", isAddon:false },
  { code:"90837", label:"Psychotherapy (60 min)", category:"Psychotherapy", unit:"per session", isAddon:false },

  { code:"90833", label:"Psychotherapy add-on (30 min) w/E/M", category:"Psychotherapy (Add-on)", unit:"add-on", isAddon:true },
  { code:"90836", label:"Psychotherapy add-on (45 min) w/E/M", category:"Psychotherapy (Add-on)", unit:"add-on", isAddon:true },
  { code:"90838", label:"Psychotherapy add-on (60 min) w/E/M", category:"Psychotherapy (Add-on)", unit:"add-on", isAddon:true },

  { code:"90839", label:"Crisis psychotherapy (base)", category:"Crisis", unit:"per service", isAddon:false },
  { code:"90840", label:"Crisis add-on (each addl 30 min)", category:"Crisis (Add-on)", unit:"add-on", isAddon:true },

  { code:"G0017", label:"Crisis psychotherapy (applicable site)", category:"Crisis (HCPCS)", unit:"per service", isAddon:false },
  { code:"G0018", label:"Crisis add-on (applicable site)", category:"Crisis (HCPCS Add-on)", unit:"add-on", isAddon:true },

  { code:"90845", label:"Psychoanalysis", category:"Psychotherapy", unit:"per service", isAddon:false },
  { code:"90846", label:"Family therapy (no patient)", category:"Family Therapy", unit:"per session", isAddon:false },
  { code:"90847", label:"Family therapy (with patient)", category:"Family Therapy", unit:"per session", isAddon:false },
  { code:"90849", label:"Multiple-family group psychotherapy", category:"Family Therapy", unit:"per session", isAddon:false },
  { code:"90853", label:"Group psychotherapy", category:"Group Therapy", unit:"per session", isAddon:false },

  { code:"90870", label:"ECT", category:"Procedures", unit:"per service", isAddon:false },
  { code:"90880", label:"Hypnotherapy", category:"Psychotherapy", unit:"per service", isAddon:false },
  { code:"90889", label:"Psych report", category:"Reports", unit:"per report", isAddon:false },

  { code:"96116", label:"Neurobehavioral status exam (base)", category:"Neurobehavioral", unit:"per hour", isAddon:false },
  { code:"96121", label:"Neurobehavioral exam (addl hour)", category:"Neurobehavioral (Add-on)", unit:"add-on", isAddon:true },

  { code:"96130", label:"Psych testing eval (base hour)", category:"Testing Eval", unit:"per hour", isAddon:false },
  { code:"96131", label:"Psych testing eval (addl hour)", category:"Testing Eval (Add-on)", unit:"add-on", isAddon:true },
  { code:"96132", label:"Neuropsych testing eval (base hour)", category:"Testing Eval", unit:"per hour", isAddon:false },
  { code:"96133", label:"Neuropsych testing eval (addl hour)", category:"Testing Eval (Add-on)", unit:"add-on", isAddon:true },

  { code:"96136", label:"Test admin/scoring (first 30)", category:"Testing Admin", unit:"per 30 min", isAddon:false },
  { code:"96137", label:"Test admin/scoring (addl 30)", category:"Testing Admin (Add-on)", unit:"add-on", isAddon:true },
  { code:"96138", label:"Test admin/scoring tech (first 30)", category:"Testing Admin", unit:"per 30 min", isAddon:false },
  { code:"96139", label:"Test admin/scoring tech (addl 30)", category:"Testing Admin (Add-on)", unit:"add-on", isAddon:true },
  { code:"96146", label:"Automated test administration", category:"Testing Admin", unit:"per service", isAddon:false },

  { code:"96156", label:"Health behavior assessment", category:"Health Behavior", unit:"per service", isAddon:false },
  { code:"96158", label:"Health behavior intervention (ind, base 30)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96159", label:"Health behavior intervention (ind, addl 15)", category:"Health Behavior (Add-on)", unit:"add-on", isAddon:true },
  { code:"96164", label:"Health behavior intervention (group, base 30)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96165", label:"Health behavior intervention (group, addl 15)", category:"Health Behavior (Add-on)", unit:"add-on", isAddon:true },
  { code:"96167", label:"Health behavior intervention (family, base 30)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96168", label:"Health behavior intervention (family, addl 15)", category:"Health Behavior (Add-on)", unit:"add-on", isAddon:true },
  { code:"96170", label:"Health behavior intervention (remote)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96171", label:"Health behavior intervention (remote addl)", category:"Health Behavior (Add-on)", unit:"add-on", isAddon:true },

  { code:"96161", label:"Caregiver risk assessment instrument", category:"Caregiver", unit:"per service", isAddon:false },
  { code:"96202", label:"Multi-family behavior management (base)", category:"Caregiver Training", unit:"per session", isAddon:false },
  { code:"96203", label:"Multi-family behavior management (addl)", category:"Caregiver Training (Add-on)", unit:"add-on", isAddon:true },

  { code:"97151", label:"Behavior identification assessment", category:"Behavior Services", unit:"per hour", isAddon:false },
  { code:"97152", label:"Behavior identification supporting assessment", category:"Behavior Services", unit:"per hour", isAddon:false },
  { code:"97153", label:"Adaptive behavior treatment (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97154", label:"Adaptive behavior treatment group (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97155", label:"Adaptive behavior treatment w/modification (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97156", label:"Adaptive behavior treatment guidance", category:"Behavior Services", unit:"per service", isAddon:false },
  { code:"97157", label:"Adaptive behavior treatment guidance (group)", category:"Behavior Services", unit:"per service", isAddon:false },
  { code:"97158", label:"Adaptive behavior group w/modification (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false }
];

// --- CMS baseline fee table (2026 GA–Atlanta) ---
// You fill in numbers. Pro supports export/import so you only do it once.
const FEES_STORAGE_KEY = "assuremed_fees_2026_ga_atlanta";

const DEFAULT_FEES = {
  year: "2026",
  locality: "GA_ATLANTA",
  // Each code: { nonfacility: number, facility: number }
  codes: {
    // Example:
    // "90834": { nonfacility: 0, facility: 0 },
  }
};

function loadFees(){
  try{
    const raw = localStorage.getItem(FEES_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_FEES);
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.codes) return structuredClone(DEFAULT_FEES);
    return parsed;
  }catch{
    return structuredClone(DEFAULT_FEES);
  }
}
function saveFees(fees){
  try{ localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(fees)); }catch{}
}

let fees = loadFees();

// --- Pro mode ---
function isPro(){
  try { return localStorage.getItem(PRO_FLAG_KEY) === "true"; } catch { return false; }
}
function setPro(v){
  try { localStorage.setItem(PRO_FLAG_KEY, v ? "true" : "false"); } catch {}
  renderPlanUI();
}
function renderPlanUI(){
  const pro = isPro();
  $("planLabel").textContent = pro ? "Pro" : "Free";
  $("proDot").classList.toggle("pro", pro);
  document.getElementById("lockBtn").classList.toggle("hidden", !pro);

  // Lock Pro sections
  $("proMixSection").style.opacity = pro ? "1" : "0.55";
  $("proCompareSection").style.opacity = pro ? "1" : "0.55";

  // Disable Pro inputs
  ["mixCode","mixRate","mixCount","mixUnits","addMixBtn","clearMixBtn",
   "rate90834","rate90837","compareSessions","calcCompare",
   "exportFeesBtn","importFeesBtn","loadCmsRateBtn"
  ].forEach(id => {
    const el = $(id);
    if (el) el.disabled = !pro;
  });

  if (!pro){
    $("mixTotals").innerHTML = "<div class='mini'>Unlock Pro to use weekly mix totals.</div>";
    $("compareBox").innerHTML = "<div class='mini'>Unlock Pro to use the undercoding estimator.</div>";
  }
}

// --- Helpers ---
function money(n){
  if (!Number.isFinite(n)) return "$0.00";
  return "$" + n.toFixed(2);
}
function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
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
function setVisible(id, yes){
  const el = $(id);
  if (!el) return;
  el.classList.toggle("hidden", !yes);
}

function getMeta(code){
  return CODES.find(x => x.code === code);
}

// Units helper: show minutes + auto units for time-based units
function unitBehavior(code){
  const unit = getMeta(code)?.unit || "per service";
  if (unit === "per 15 min") return { show:true, denom:15, minutesHint:"Units = minutes ÷ 15 (rounded up typically).", unitsHint:"You can fine-tune units if needed.", step:0.25 };
  if (unit === "per 30 min") return { show:true, denom:30, minutesHint:"Units = minutes ÷ 30.", unitsHint:"You can fine-tune units if needed.", step:0.25 };
  if (unit === "per hour")   return { show:true, denom:60, minutesHint:"Units = minutes ÷ 60 (hours).", unitsHint:"Example: 90 minutes = 1.5 units.", step:0.25 };
  return { show:false, denom:null, minutesHint:"", unitsHint:"", step:1 };
}

function codingWarnings(code){
  const warn = [];
  const meta = getMeta(code);
  if (meta?.isAddon) warn.push(`${code} is an add-on code and typically isn’t billed alone.`);
  if (code === "90840") warn.push("90840 typically pairs with 90839 (crisis base).");
  if (code === "G0018") warn.push("G0018 typically pairs with G0017 (crisis base in applicable site).");
  if (code === "96121") warn.push("96121 is typically an add-on to 96116.");
  return warn;
}

// --- App State ---
let mix = []; // {code, rate, count, units}

function getState(){
  return {
    patientName: $("patientName").value,
    patientDob: $("patientDob").value,
    dosDateTime: $("dosDateTime").value,
    note: $("note").value,

    code: $("code").value,
    rate: $("rate").value,
    count: $("count").value,
    minutes: $("minutes").value,
    units: $("units").value,

    weeksPerMonth: $("weeksPerMonth").value,
    payerMultiplier: $("payerMultiplier").value,
    cmsSetting: $("cmsSetting").value,

    rate90834: $("rate90834").value,
    rate90837: $("rate90837").value,
    compareSessions: $("compareSessions").value,

    mix
  };
}
function setState(s){
  if (!s) return;

  $("patientName").value = s.patientName ?? "";
  $("patientDob").value = s.patientDob ?? "";
  $("dosDateTime").value = s.dosDateTime ?? "";
  $("note").value = s.note ?? "";

  if (s.code) $("code").value = s.code;
  $("rate").value = s.rate ?? "";
  $("count").value = s.count ?? "";
  $("minutes").value = s.minutes ?? "";
  $("units").value = s.units ?? "";

  $("weeksPerMonth").value = s.weeksPerMonth ?? "4.33";
  $("payerMultiplier").value = s.payerMultiplier ?? "";
  $("cmsSetting").value = s.cmsSetting ?? "nonfacility";

  $("rate90834").value = s.rate90834 ?? "";
  $("rate90837").value = s.rate90837 ?? "";
  $("compareSessions").value = s.compareSessions ?? "";

  if (Array.isArray(s.mix)) mix = s.mix;
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(getState())); }catch{}
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}

// --- UI Populate ---
function populateDropdowns(){
  const sel = $("code");
  const mixSel = $("mixCode");

  sel.innerHTML = "";
  mixSel.innerHTML = "";

  const sorted = [...CODES].sort((a,b) =>
    (a.category||"").localeCompare(b.category||"") || (a.code||"").localeCompare(b.code||"")
  );

  for (const item of sorted){
    const o = document.createElement("option");
    o.value = item.code;
    o.textContent = `${item.code} — ${item.label}`;
    sel.appendChild(o);

    const o2 = document.createElement("option");
    o2.value = item.code;
    o2.textContent = item.code;
    mixSel.appendChild(o2);
  }

  sel.value = "90834";
  mixSel.value = "90834";
}

function syncCodeInfo(){
  const code = $("code").value;
  const meta = getMeta(code);

  $("codeTitle").textContent = meta ? `${meta.code} — ${meta.label}` : code;
  $("codeMeta").textContent = meta
    ? `Category: ${meta.category} • ${meta.isAddon ? "Add-on" : "Primary"} • Unit: ${meta.unit}`
    : "";

  $("countLabel").textContent = "Count (per week)";

  const ub = unitBehavior(code);
  setVisible("minutesWrap", ub.show);
  setVisible("unitsWrap", ub.show);

  if (ub.show){
    $("minutesHint").textContent = ub.minutesHint;
    $("unitsHint").textContent = ub.unitsHint;
    $("units").step = String(ub.step);

    // If minutes entered but units empty, compute
    const m = num($("minutes").value);
    const uNow = $("units").value.trim();
    if (m > 0 && !uNow){
      const u = m / ub.denom;
      $("units").value = String(roundTo(u, ub.step));
    }
  } else {
    $("minutes").value = "";
    $("units").value = "";
  }

  // Mix hint
  const mixCode = $("mixCode").value;
  const mb = unitBehavior(mixCode);
  $("mixUnitsHint").textContent = mb.show
    ? `Tip: for ${mixCode}, enter units based on minutes (e.g., 60 min = ${mb.denom === 15 ? 4 : (mb.denom === 30 ? 2 : 1)} units).`
    : "Use Units = 1 for per-session / per-service codes.";
  if (!$("mixUnits").value.trim()) $("mixUnits").value = mb.show ? "1" : "1";
}

function roundTo(val, step){
  const s = step || 0.25;
  return Math.round(val / s) * s;
}

// Auto-units when minutes changes
function minutesToUnits(){
  const code = $("code").value;
  const ub = unitBehavior(code);
  if (!ub.show) return;
  const m = num($("minutes").value);
  if (m <= 0) return;
  const u = m / ub.denom;
  $("units").value = String(roundTo(u, ub.step));
}

// --- CMS Baseline ---
function getCmsBaseline(code, setting){
  // fees.codes[code] might not exist
  const row = fees.codes?.[code];
  if (!row) return null;
  const v = row[setting];
  return Number.isFinite(v) ? v : null;
}
function loadCmsRateIntoRate(){
  if (!isPro()){
    alert("Unlock Pro to load CMS baseline.");
    return;
  }
  const code = $("code").value;
  const setting = $("cmsSetting").value; // facility/nonfacility
  const baseline = getCmsBaseline(code, setting);
  if (!baseline || baseline <= 0){
    alert(`No baseline saved for ${code} (${fees.year} ${fees.locality}, ${setting}).\n\nImport your fee JSON or add values to fees.codes.`);
    return;
  }
  $("rate").value = baseline.toFixed(2);
  calc();
}

function exportFees(){
  if (!isPro()){
    alert("Unlock Pro to export fee table.");
    return;
  }
  const blob = new Blob([JSON.stringify(fees, null, 2)], { type:"application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `assuremed_fees_${fees.year}_${fees.locality}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFeesPrompt(){
  if (!isPro()){
    alert("Unlock Pro to import fee table.");
    return;
  }
  $("importFile").click();
}

function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      if (!parsed || !parsed.codes){
        alert("Invalid JSON. Expected { year, locality, codes: { CODE: { nonfacility, facility } } }");
        return;
      }
      fees = parsed;
      saveFees(fees);
      alert(`Imported fee table: ${fees.year} • ${fees.locality}`);
    }catch{
      alert("Could not read JSON file.");
    }
  };
  reader.readAsText(file);
}

// --- Calculations + Report ---
function calc(){
  syncCodeInfo();

  const code = $("code").value;
  const meta = getMeta(code);
  const unit = meta?.unit || "per service";

  const rate = num($("rate").value);
  const count = Math.max(0, Math.floor(num($("count").value)));
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  const ub = unitBehavior(code);
  const units = ub.show ? Math.max(0.25, num($("units").value) || 0) : 1;

  const warn = [];
  if (rate <= 0) warn.push("Enter a rate greater than $0.");
  if (count <= 0) warn.push("Enter a count (e.g., 1).");
  if (payerMultRaw && payerMult <= 0) warn.push("Multiplier must be > 0.");
  warn.push(...codingWarnings(code));

  showWarn(warn);

  const revPerUnit = rate * payerMult;
  const weekly = revPerUnit * count * units;
  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  // Summary cards
  $("revPerUnit").textContent = money(revPerUnit);
  $("revWeekly").textContent = money(weekly);
  $("revMonthly").textContent = money(monthly);
  $("revYearly").textContent = money(yearly);

  if (rate > 0 && count > 0){
    showGood(`Estimate ready: <strong>${money(weekly)}</strong> weekly (${count} × units ${units}).`);
  } else {
    showGood("");
  }

  // Report panel
  const patient = ($("patientName").value || "").trim() || "—";
  const dob = ($("patientDob").value || "").trim() || "—";
  const dos = ($("dosDateTime").value || "").trim() || "—";

  $("generatedAt").textContent = "Generated: " + new Date().toLocaleString();
  $("rPatient").textContent = patient;
  $("rDob").textContent = dob;
  $("rDos").textContent = dos;

  $("rCode").textContent = meta ? `${meta.code} — ${meta.label}` : code;
  $("rRate").textContent = money(rate);
  $("rCount").textContent = String(count);
  $("rUnits").textContent = ub.show ? String(units) : "1";
  $("rMult").textContent = payerMultRaw ? payerMult.toFixed(2) : "—";
  $("rNote").textContent = ($("note").value || "").trim() || "—";

  if (isPro()){
    renderMixTable();
    renderMixTotals();
  }

  saveState();
}

function calcCompare(){
  if (!isPro()){
    $("compareBox").innerHTML = "<div class='mini'>Unlock Pro to use the undercoding estimator.</div>";
    return;
  }
  const r34 = num($("rate90834").value);
  const r37 = num($("rate90837").value);
  const sessions = Math.max(0, Math.floor(num($("compareSessions").value)));

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  if (r34 <= 0 || r37 <= 0 || sessions <= 0){
    $("compareBox").innerHTML = "<div class='mini'>Enter both rates and sessions/week.</div>";
    return;
  }

  const diff = (r37 - r34) * payerMult;
  const weekly = diff * sessions;
  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  const label = diff >= 0 ? "Potential undercoding loss" : "Difference (90834 input higher)";
  $("compareBox").innerHTML = `
    <div><strong>${label} per session:</strong> ${money(diff)}</div>
    <div style="margin-top:8px;"><strong>Weekly difference:</strong> ${money(weekly)}</div>
    <div><strong>Monthly difference:</strong> ${money(monthly)}</div>
    <div><strong>Yearly difference:</strong> ${money(yearly)}</div>
    <div class="mini" style="margin-top:10px;">Reminder: bill based on documentation/time rules and payer policy.</div>
  `;
}

// --- Mix (Pro) ---
function addMixItem(){
  if (!isPro()) return;

  const code = $("mixCode").value;
  const rate = num($("mixRate").value);
  const count = Math.max(0, Math.floor(num($("mixCount").value)));
  const units = Math.max(0.25, num($("mixUnits").value) || 1);

  if (!code || rate <= 0 || count <= 0){
    alert("Enter code, rate, and count/week.");
    return;
  }

  mix.push({ code, rate, count, units });
  $("mixRate").value = "";
  $("mixCount").value = "";
  $("mixUnits").value = "1";
  renderMixTable();
  renderMixTotals();
  saveState();
}

function removeMix(idx){
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
  if (!isPro()) return;

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  mix.forEach((item, idx) => {
    const weekly = (item.rate * payerMult) * item.count * item.units;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>${money(item.rate)}</td>
      <td>${item.count}</td>
      <td>${item.units}</td>
      <td>${money(weekly)}</td>
      <td><button class="btn btnGhost" data-remove="${idx}" style="padding:8px 10px;font-size:12px;">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeMix(parseInt(btn.dataset.remove, 10)));
  });
}

function renderMixTotals(){
  const box = $("mixTotals");
  if (!isPro()){
    box.innerHTML = "<div class='mini'>Unlock Pro to use weekly mix totals.</div>";
    return;
  }
  if (!mix.length){
    box.innerHTML = "<div class='mini'>Add codes to see totals.</div>";
    return;
  }

  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;
  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  let weekly = 0;
  let items = 0;

  for (const item of mix){
    weekly += (item.rate * payerMult) * item.count * item.units;
    items += item.count;
  }

  box.innerHTML = `
    <div><strong>Weekly items (mix):</strong> ${items}</div>
    <div><strong>Weekly revenue (mix):</strong> ${money(weekly)}</div>
    <div><strong>Monthly revenue (mix):</strong> ${money(weekly * weeksPerMonth)}</div>
    <div><strong>Yearly revenue (mix):</strong> ${money(weekly * 52)}</div>
    <div class="mini" style="margin-top:8px;">Multiplier applied: ${payerMult.toFixed(2)}</div>
  `;
}

// --- CSV + Print ---
function downloadCSV(){
  const s = getState();
  const payerMult = s.payerMultiplier?.trim() ? num(s.payerMultiplier) : 1;
  const code = s.code;
  const meta = getMeta(code);
  const ub = unitBehavior(code);

  const rate = num(s.rate);
  const count = Math.max(0, Math.floor(num(s.count)));
  const units = ub.show ? Math.max(0.25, num(s.units) || 1) : 1;
  const weeksPerMonth = num(s.weeksPerMonth) || 4.33;

  const revPerUnit = rate * payerMult;
  const weekly = revPerUnit * count * units;
  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  const rows = [
    ["Assure Med Therapist Revenue Optimizer", ""],
    ["Generated", new Date().toISOString()],
    ["Patient", s.patientName || ""],
    ["DOB", s.patientDob || ""],
    ["DOS", s.dosDateTime || ""],
    ["Code", meta ? `${meta.code}` : code],
    ["Rate", rate],
    ["Count/week", count],
    ["Units", units],
    ["Multiplier", payerMult],
    ["Weekly", weekly.toFixed(2)],
    ["Monthly", monthly.toFixed(2)],
    ["Yearly", yearly.toFixed(2)],
    ["Note", (s.note || "").replace(/\n/g, " ")]
  ];

  const csv = rows.map(r => r.map(cell => {
    const v = String(cell ?? "");
    const needsQuotes = /[",\n]/.test(v);
    const escaped = v.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }).join(",")).join("\n");

  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_session_sheet.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printPDF(){ window.print(); }

// --- Demo / Reset ---
function loadDemo(){
  setState({
    patientName: "Jane Doe",
    patientDob: "1990-06-12",
    dosDateTime: new Date().toISOString().slice(0,16),
    note: "Payer: Medicare baseline comparison.\nSetting: Non-facility.\n(Do not enter PHI identifiers.)",

    code: "97153",
    rate: "22.50",
    count: "10",
    minutes: "60",
    units: "4",
    weeksPerMonth: "4.33",
    payerMultiplier: "1.05",
    cmsSetting: "nonfacility",

    rate90834: "115",
    rate90837: "150",
    compareSessions: "18",

    mix: [
      { code:"90834", rate:115, count:12, units:1 },
      { code:"97153", rate:22.5, count:10, units:4 }
    ]
  });

  calc();
}

function resetAll(){
  try{ localStorage.removeItem(STORAGE_KEY); }catch{}
  setState({
    patientName: "",
    patientDob: "",
    dosDateTime: "",
    note: "",
    code: "90834",
    rate: "",
    count: "",
    minutes: "",
    units: "",
    weeksPerMonth: "4.33",
    payerMultiplier: "",
    cmsSetting: "nonfacility",
    rate90834: "",
    rate90837: "",
    compareSessions: "",
    mix: []
  });
  calc();
}

// --- Pro buttons ---
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
    alert("Assure Med Pro unlocked!");
  } else {
    alert("Key didn’t match. Try again.");
  }
}
function lockPro(){
  setPro(false);
  alert("Pro locked.");
}

// --- Wire up ---
function wire(){
  populateDropdowns();

  const saved = loadState();
  if (saved) setState(saved);

  renderPlanUI();

  // Basic reactive updates
  [
    "patientName","patientDob","dosDateTime","note",
    "code","rate","count","minutes","units",
    "weeksPerMonth","payerMultiplier","cmsSetting",
    "mixCode","mixUnits"
  ].forEach(id => $(id).addEventListener("input", () => {
    if (id === "minutes") minutesToUnits();
    calc();
  }));

  $("loadCmsRateBtn").addEventListener("click", (e) => { e.preventDefault(); loadCmsRateIntoRate(); });

  $("exportFeesBtn").addEventListener("click", (e) => { e.preventDefault(); exportFees(); });
  $("importFeesBtn").addEventListener("click", (e) => { e.preventDefault(); importFeesPrompt(); });
  $("importFile").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) handleImportFile(f);
    e.target.value = "";
  });

  $("addMixBtn").addEventListener("click", (e) => { e.preventDefault(); addMixItem(); });
  $("clearMixBtn").addEventListener("click", (e) => { e.preventDefault(); clearMix(); });

  $("calcCompare").addEventListener("click", (e) => { e.preventDefault(); calcCompare(); });

  $("jumpToCalc").addEventListener("click", () => $("calculator").scrollIntoView({behavior:"smooth"}));
  $("demoBtn").addEventListener("click", loadDemo);
  $("resetBtn").addEventListener("click", resetAll);
  $("downloadBtn").addEventListener("click", downloadCSV);
  $("printBtn").addEventListener("click", printPDF);

  $("openPayBtn").addEventListener("click", openPay);
  $("unlockBtn").addEventListener("click", unlockPro);
  $("lockBtn").addEventListener("click", lockPro);

  $("yr").textContent = new Date().getFullYear();

  calc();
}

wire();
