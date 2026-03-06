function $(id){ return document.getElementById(id); }

const STORAGE_KEY = "assuremed_app_state_v1";
const PRO_FLAG_KEY = "assuremed_isPro";
const PRO_KEY = "ASSUREMED-PRO";
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/cNi4gzgMDavS0EJ68u8IU01";

const CODES = [
  { code:"90791", label:"Psych diagnostic eval (no med)", category:"Diagnostic", unit:"per service", isAddon:false },
  { code:"90792", label:"Psych diagnostic eval (with med)", category:"Diagnostic", unit:"per service", isAddon:false },
  { code:"90832", label:"Psychotherapy (30 min)", category:"Psychotherapy", unit:"per session", isAddon:false },
  { code:"90834", label:"Psychotherapy (45 min)", category:"Psychotherapy", unit:"per session", isAddon:false },
  { code:"90837", label:"Psychotherapy (60 min)", category:"Psychotherapy", unit:"per session", isAddon:false },
  { code:"90839", label:"Crisis psychotherapy (base)", category:"Crisis", unit:"per service", isAddon:false },
  { code:"90840", label:"Crisis add-on (each addl 30 min)", category:"Crisis (Add-on)", unit:"add-on", isAddon:true },
  { code:"90846", label:"Family therapy (no patient)", category:"Family Therapy", unit:"per session", isAddon:false },
  { code:"90847", label:"Family therapy (with patient)", category:"Family Therapy", unit:"per session", isAddon:false },
  { code:"90853", label:"Group psychotherapy", category:"Group Therapy", unit:"per session", isAddon:false },
  { code:"96116", label:"Neurobehavioral status exam", category:"Neurobehavioral", unit:"per hour", isAddon:false },
  { code:"96130", label:"Psych testing eval", category:"Testing Eval", unit:"per hour", isAddon:false },
  { code:"96132", label:"Neuropsych testing eval", category:"Testing Eval", unit:"per hour", isAddon:false },
  { code:"96136", label:"Test admin/scoring (first 30)", category:"Testing Admin", unit:"per 30 min", isAddon:false },
  { code:"96138", label:"Test admin/scoring tech (first 30)", category:"Testing Admin", unit:"per 30 min", isAddon:false },
  { code:"96156", label:"Health behavior assessment", category:"Health Behavior", unit:"per service", isAddon:false },
  { code:"96158", label:"Health behavior intervention (ind)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96164", label:"Health behavior intervention (group)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"96167", label:"Health behavior intervention (family)", category:"Health Behavior", unit:"per 30 min", isAddon:false },
  { code:"97151", label:"Behavior identification assessment", category:"Behavior Services", unit:"per hour", isAddon:false },
  { code:"97152", label:"Behavior identification supporting assessment", category:"Behavior Services", unit:"per hour", isAddon:false },
  { code:"97153", label:"Adaptive behavior treatment (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97154", label:"Adaptive behavior treatment group (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97155", label:"Adaptive behavior treatment w/modification (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"97156", label:"Adaptive behavior treatment guidance", category:"Behavior Services", unit:"per service", isAddon:false },
  { code:"97157", label:"Adaptive behavior treatment guidance (group)", category:"Behavior Services", unit:"per service", isAddon:false },
  { code:"97158", label:"Adaptive behavior group w/modification (per 15)", category:"Behavior Services", unit:"per 15 min", isAddon:false },
  { code:"99483", label:"Cognitive assessment & care planning", category:"Care Planning", unit:"per service", isAddon:false }
];

const DEFAULT_FEES = {
  year: "2026",
  locality: "GA_ATLANTA",
  codes: {}
};

let fees = loadFees();
let mix = [];

function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n){
  if (!Number.isFinite(n)) return "$0.00";
  return "$" + n.toFixed(2);
}

function roundTo(val, step){
  const s = step || 0.25;
  return Math.round(val / s) * s;
}

function getMeta(code){
  return CODES.find(x => x.code === code);
}

function unitBehavior(code){
  const unit = getMeta(code)?.unit || "per service";
  if (unit === "per 15 min") return { show:true, denom:15, minutesHint:"Units = minutes ÷ 15.", unitsHint:"Example: 60 minutes = 4 units.", step:0.25 };
  if (unit === "per 30 min") return { show:true, denom:30, minutesHint:"Units = minutes ÷ 30.", unitsHint:"Example: 60 minutes = 2 units.", step:0.25 };
  if (unit === "per hour") return { show:true, denom:60, minutesHint:"Units = minutes ÷ 60.", unitsHint:"Example: 90 minutes = 1.5 units.", step:0.25 };
  return { show:false, denom:null, minutesHint:"", unitsHint:"", step:1 };
}

function codingWarnings(code){
  const warn = [];
  const meta = getMeta(code);
  if (meta?.isAddon) warn.push(`${code} is typically an add-on code.`);
  if (code === "90840") warn.push("90840 is usually paired with 90839.");
  return warn;
}

function showWarn(lines){
  const box = $("warnBox");
  if (!box) return;
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
  if (!box) return;
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
  if ($("planLabel")) $("planLabel").textContent = pro ? "Pro" : "Free";
  if ($("proDot")) $("proDot").classList.toggle("pro", pro);
  if ($("lockBtn")) $("lockBtn").classList.toggle("hidden", !pro);
}

function loadFees(){
  try{
    const raw = localStorage.getItem("assuremed_fees_2026_ga_atlanta");
    if (!raw) return structuredClone(DEFAULT_FEES);
    const parsed = JSON.parse(raw);
    return parsed?.codes ? parsed : structuredClone(DEFAULT_FEES);
  }catch{
    return structuredClone(DEFAULT_FEES);
  }
}

function saveFees(){
  try{
    localStorage.setItem("assuremed_fees_2026_ga_atlanta", JSON.stringify(fees));
  }catch{}
}

function getState(){
  return {
    patientName: $("patientName")?.value ?? "",
    patientDob: $("patientDob")?.value ?? "",
    dosDateTime: $("dosDateTime")?.value ?? "",
    patientEmail: $("patientEmail")?.value ?? "",
    billDueDate: $("billDueDate")?.value ?? "",
    providerName: $("providerName")?.value ?? "",
    note: $("note")?.value ?? "",
    code: $("code")?.value ?? "",
    rate: $("rate")?.value ?? "",
    count: $("count")?.value ?? "",
    minutes: $("minutes")?.value ?? "",
    units: $("units")?.value ?? "",
    weeksPerMonth: $("weeksPerMonth")?.value ?? "4.33",
    payerMultiplier: $("payerMultiplier")?.value ?? "",
    cmsSetting: $("cmsSetting")?.value ?? "nonfacility",
    rate90834: $("rate90834")?.value ?? "",
    rate90837: $("rate90837")?.value ?? "",
    compareSessions: $("compareSessions")?.value ?? "",
    mix,
    c_patientName: $("c_patientName")?.value ?? "",
    c_patientDob: $("c_patientDob")?.value ?? "",
    c_patientEmail: $("c_patientEmail")?.value ?? "",
    c_patientSex: $("c_patientSex")?.value ?? "",
    c_dos: $("c_dos")?.value ?? "",
    c_pos: $("c_pos")?.value ?? "11",
    c_subscriberName: $("c_subscriberName")?.value ?? "",
    c_memberId: $("c_memberId")?.value ?? "",
    c_payerName: $("c_payerName")?.value ?? "",
    c_payerId: $("c_payerId")?.value ?? "",
    c_relationship: $("c_relationship")?.value ?? "self",
    c_claimType: $("c_claimType")?.value ?? "insurance",
    c_billProvName: $("c_billProvName")?.value ?? "",
    c_billNpi: $("c_billNpi")?.value ?? "",
    c_taxId: $("c_taxId")?.value ?? "",
    c_dx1: $("c_dx1")?.value ?? "",
    c_dx2: $("c_dx2")?.value ?? "",
    c_dx3: $("c_dx3")?.value ?? "",
    c_cpt: $("c_cpt")?.value ?? "",
    c_units: $("c_units")?.value ?? "1",
    c_charge: $("c_charge")?.value ?? "",
    c_mod1: $("c_mod1")?.value ?? "",
    c_mod2: $("c_mod2")?.value ?? "",
    c_patientDue: $("c_patientDue")?.value ?? ""
  };
}

function setState(s){
  if (!s) return;

  if ($("patientName")) $("patientName").value = s.patientName ?? "";
  if ($("patientDob")) $("patientDob").value = s.patientDob ?? "";
  if ($("dosDateTime")) $("dosDateTime").value = s.dosDateTime ?? "";
  if ($("patientEmail")) $("patientEmail").value = s.patientEmail ?? "";
  if ($("billDueDate")) $("billDueDate").value = s.billDueDate ?? "";
  if ($("providerName")) $("providerName").value = s.providerName ?? "";
  if ($("note")) $("note").value = s.note ?? "";
  if ($("code") && s.code) $("code").value = s.code;
  if ($("rate")) $("rate").value = s.rate ?? "";
  if ($("count")) $("count").value = s.count ?? "";
  if ($("minutes")) $("minutes").value = s.minutes ?? "";
  if ($("units")) $("units").value = s.units ?? "";
  if ($("weeksPerMonth")) $("weeksPerMonth").value = s.weeksPerMonth ?? "4.33";
  if ($("payerMultiplier")) $("payerMultiplier").value = s.payerMultiplier ?? "";
  if ($("cmsSetting")) $("cmsSetting").value = s.cmsSetting ?? "nonfacility";
  if ($("rate90834")) $("rate90834").value = s.rate90834 ?? "";
  if ($("rate90837")) $("rate90837").value = s.rate90837 ?? "";
  if ($("compareSessions")) $("compareSessions").value = s.compareSessions ?? "";

  if ($("c_patientName")) $("c_patientName").value = s.c_patientName ?? "";
  if ($("c_patientDob")) $("c_patientDob").value = s.c_patientDob ?? "";
  if ($("c_patientEmail")) $("c_patientEmail").value = s.c_patientEmail ?? "";
  if ($("c_patientSex")) $("c_patientSex").value = s.c_patientSex ?? "";
  if ($("c_dos")) $("c_dos").value = s.c_dos ?? "";
  if ($("c_pos")) $("c_pos").value = s.c_pos ?? "11";
  if ($("c_subscriberName")) $("c_subscriberName").value = s.c_subscriberName ?? "";
  if ($("c_memberId")) $("c_memberId").value = s.c_memberId ?? "";
  if ($("c_payerName")) $("c_payerName").value = s.c_payerName ?? "";
  if ($("c_payerId")) $("c_payerId").value = s.c_payerId ?? "";
  if ($("c_relationship")) $("c_relationship").value = s.c_relationship ?? "self";
  if ($("c_claimType")) $("c_claimType").value = s.c_claimType ?? "insurance";
  if ($("c_billProvName")) $("c_billProvName").value = s.c_billProvName ?? "";
  if ($("c_billNpi")) $("c_billNpi").value = s.c_billNpi ?? "";
  if ($("c_taxId")) $("c_taxId").value = s.c_taxId ?? "";
  if ($("c_dx1")) $("c_dx1").value = s.c_dx1 ?? "";
  if ($("c_dx2")) $("c_dx2").value = s.c_dx2 ?? "";
  if ($("c_dx3")) $("c_dx3").value = s.c_dx3 ?? "";
  if ($("c_cpt")) $("c_cpt").value = s.c_cpt ?? "";
  if ($("c_units")) $("c_units").value = s.c_units ?? "1";
  if ($("c_charge")) $("c_charge").value = s.c_charge ?? "";
  if ($("c_mod1")) $("c_mod1").value = s.c_mod1 ?? "";
  if ($("c_mod2")) $("c_mod2").value = s.c_mod2 ?? "";
  if ($("c_patientDue")) $("c_patientDue").value = s.c_patientDue ?? "";

  if (Array.isArray(s.mix)) mix = s.mix;
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(getState())); }catch{}
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function populateDropdowns(){
  const sel = $("code");
  const mixSel = $("mixCode");
  if (!sel || !mixSel) return;

  sel.innerHTML = "";
  mixSel.innerHTML = "";

  const sorted = [...CODES].sort((a,b) =>
    (a.category || "").localeCompare(b.category || "") ||
    (a.code || "").localeCompare(b.code || "")
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

  if (!sel.value) sel.value = "90834";
  if (!mixSel.value) mixSel.value = "90834";
}

function syncCodeInfo(){
  const code = $("code")?.value || "";
  const meta = getMeta(code);

  if ($("codeTitle")) $("codeTitle").textContent = meta ? `${meta.code} — ${meta.label}` : "—";
  if ($("codeMeta")) $("codeMeta").textContent = meta
    ? `Category: ${meta.category} • ${meta.isAddon ? "Add-on" : "Primary"} • Unit: ${meta.unit}`
    : "—";

  const ub = unitBehavior(code);
  setVisible("minutesWrap", ub.show);
  setVisible("unitsWrap", ub.show);

  if (ub.show){
    if ($("minutesHint")) $("minutesHint").textContent = ub.minutesHint;
    if ($("unitsHint")) $("unitsHint").textContent = ub.unitsHint;
    if ($("units")) $("units").step = String(ub.step);

    const m = num($("minutes")?.value);
    const uNow = ($("units")?.value || "").trim();
    if (m > 0 && !uNow && $("units")){
      $("units").value = String(roundTo(m / ub.denom, ub.step));
    }
  } else {
    if ($("minutes")) $("minutes").value = "";
    if ($("units")) $("units").value = "";
  }

  const mixCode = $("mixCode")?.value || "";
  const mb = unitBehavior(mixCode);
  if ($("mixUnitsHint")){
    $("mixUnitsHint").textContent = mb.show
      ? `Tip: for ${mixCode}, enter units based on minutes.`
      : "Use Units = 1 for per-session / per-service codes.";
  }
}

function minutesToUnits(){
  const code = $("code")?.value || "";
  const ub = unitBehavior(code);
  if (!ub.show) return;

  const m = num($("minutes")?.value);
  if (m <= 0) return;
  if ($("units")) $("units").value = String(roundTo(m / ub.denom, ub.step));
}

function calc(){
  syncCodeInfo();

  const code = $("code")?.value || "";
  const rate = num($("rate")?.value);
  const count = Math.max(0, Math.floor(num($("count")?.value)));
  const weeksPerMonth = num($("weeksPerMonth")?.value) || 4.33;

  const payerMultRaw = ($("payerMultiplier")?.value || "").trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  const ub = unitBehavior(code);
  const units = ub.show ? Math.max(0.25, num($("units")?.value) || 0) : 1;

  const warns = [];
  if (rate <= 0) warns.push("Enter a rate greater than $0.");
  if (count <= 0) warns.push("Enter a count (e.g., 1).");
  if (payerMultRaw && payerMult <= 0) warns.push("Multiplier must be greater than 0.");
  warns.push(...codingWarnings(code));
  showWarn(warns);

  const revPerUnit = rate * payerMult;
  const weekly = revPerUnit * count * units;
  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  if ($("revPerUnit")) $("revPerUnit").textContent = money(revPerUnit);
  if ($("revWeekly")) $("revWeekly").textContent = money(weekly);
  if ($("revMonthly")) $("revMonthly").textContent = money(monthly);
  if ($("revYearly")) $("revYearly").textContent = money(yearly);

  if (rate > 0 && count > 0){
    showGood(`Estimate ready: <strong>${money(weekly)}</strong> weekly (${count} × units ${units}).`);
  } else {
    showGood("");
  }

  const meta = getMeta(code);
  if ($("generatedAt")) $("generatedAt").textContent = "Generated: " + new Date().toLocaleString();
  if ($("rPatient")) $("rPatient").textContent = ($("patientName")?.value || "").trim() || "—";
  if ($("rDob")) $("rDob").textContent = ($("patientDob")?.value || "").trim() || "—";
  if ($("rDos")) $("rDos").textContent = ($("dosDateTime")?.value || "").trim() || "—";
  if ($("rCode")) $("rCode").textContent = meta ? `${meta.code} — ${meta.label}` : "—";
  if ($("rRate")) $("rRate").textContent = money(rate);
  if ($("rCount")) $("rCount").textContent = String(count);
  if ($("rUnits")) $("rUnits").textContent = String(units);
  if ($("rMult")) $("rMult").textContent = payerMultRaw ? payerMult.toFixed(2) : "—";
  if ($("rNote")) $("rNote").textContent = ($("note")?.value || "").trim() || "—";

  renderMixTable();
  renderMixTotals();
  saveState();
}

function addMixItem(){
  const code = $("mixCode")?.value || "";
  const rate = num($("mixRate")?.value);
  const count = Math.max(0, Math.floor(num($("mixCount")?.value)));
  const units = Math.max(0.25, num($("mixUnits")?.value) || 1);

  if (!code || rate <= 0 || count <= 0){
    alert("Enter code, rate, and count/week.");
    return;
  }

  mix.push({ code, rate, count, units });
  if ($("mixRate")) $("mixRate").value = "";
  if ($("mixCount")) $("mixCount").value = "";
  if ($("mixUnits")) $("mixUnits").value = "1";
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
  if (!tbody) return;
  tbody.innerHTML = "";

  const payerMultRaw = ($("payerMultiplier")?.value || "").trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  mix.forEach((item, idx) => {
    const weekly = item.rate * payerMult * item.count * item.units;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>${money(item.rate)}</td>
      <td>${item.count}</td>
      <td>${item.units}</td>
      <td>${money(weekly)}</td>
      <td><button class="btn btnGhost" data-remove="${idx}" type="button">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeMix(parseInt(btn.dataset.remove, 10)));
  });
}

function renderMixTotals(){
  const box = $("mixTotals");
  if (!box) return;

  if (!mix.length){
    box.innerHTML = "<div class='mini'>Add codes to see totals.</div>";
    return;
  }

  const weeksPerMonth = num($("weeksPerMonth")?.value) || 4.33;
  const payerMultRaw = ($("payerMultiplier")?.value || "").trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  let weekly = 0;
  let items = 0;

  for (const item of mix){
    weekly += item.rate * payerMult * item.count * item.units;
    items += item.count;
  }

  box.innerHTML = `
    <div><strong>Weekly items:</strong> ${items}</div>
    <div><strong>Weekly revenue:</strong> ${money(weekly)}</div>
    <div><strong>Monthly revenue:</strong> ${money(weekly * weeksPerMonth)}</div>
    <div><strong>Yearly revenue:</strong> ${money(weekly * 52)}</div>
  `;
}

function calcCompare(){
  const r34 = num($("rate90834")?.value);
  const r37 = num($("rate90837")?.value);
  const sessions = Math.max(0, Math.floor(num($("compareSessions")?.value)));

  const payerMultRaw = ($("payerMultiplier")?.value || "").trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;
  const weeksPerMonth = num($("weeksPerMonth")?.value) || 4.33;

  if (r34 <= 0 || r37 <= 0 || sessions <= 0){
    if ($("compareBox")) $("compareBox").innerHTML = "<div class='mini'>Enter both rates and sessions/week.</div>";
    return;
  }

  const diff = (r37 - r34) * payerMult;
  const weekly = diff * sessions;
  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  if ($("compareBox")){
    $("compareBox").innerHTML = `
      <div><strong>Difference per session:</strong> ${money(diff)}</div>
      <div><strong>Weekly difference:</strong> ${money(weekly)}</div>
      <div><strong>Monthly difference:</strong> ${money(monthly)}</div>
      <div><strong>Yearly difference:</strong> ${money(yearly)}</div>
    `;
  }
}

function downloadCSV(){
  const s = getState();
  const csvRows = [
    ["Patient", s.patientName],
    ["DOB", s.patientDob],
    ["DOS", s.dosDateTime],
    ["Code", s.code],
    ["Rate", s.rate],
    ["Count", s.count],
    ["Units", s.units],
    ["Weeks/Month", s.weeksPerMonth],
    ["Multiplier", s.payerMultiplier],
    ["Note", s.note]
  ];

  const csv = csvRows.map(r => r.map(cell => {
    const v = String(cell ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
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

function printPDF(){
  window.print();
}

function loadDemo(){
  setState({
    patientName: "Jane Doe",
    patientDob: "1990-06-12",
    dosDateTime: new Date().toISOString().slice(0,16),
    patientEmail: "patient@email.com",
    billDueDate: "",
    providerName: "Assure Med",
    note: "Payer: Medicare baseline comparison.\nSetting: Non-facility.",
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
    c_patientName: "Jane Doe",
    c_patientDob: "1990-06-12",
    c_patientEmail: "patient@email.com",
    c_patientSex: "F",
    c_dos: new Date().toISOString().slice(0,16),
    c_pos: "11",
    c_subscriberName: "Jane Doe",
    c_memberId: "ABC123",
    c_payerName: "Example Payer",
    c_payerId: "99999",
    c_relationship: "self",
    c_claimType: "insurance",
    c_billProvName: "Assure Med",
    c_billNpi: "1234567890",
    c_dx1: "F41.1",
    c_cpt: "97153",
    c_units: "4",
    c_charge: "94.50",
    c_patientDue: "0",
    mix: [
      { code:"90834", rate:115, count:12, units:1 },
      { code:"97153", rate:22.5, count:10, units:4 }
    ]
  });

  calc();
  renderClaimPreview();
}

function resetAll(){
  try{ localStorage.removeItem(STORAGE_KEY); }catch{}
  mix = [];
  if ($("patientName")) $("patientName").value = "";
  if ($("patientDob")) $("patientDob").value = "";
  if ($("dosDateTime")) $("dosDateTime").value = "";
  if ($("patientEmail")) $("patientEmail").value = "";
  if ($("billDueDate")) $("billDueDate").value = "";
  if ($("providerName")) $("providerName").value = "Assure Med";
  if ($("note")) $("note").value = "";
  if ($("rate")) $("rate").value = "";
  if ($("count")) $("count").value = "";
  if ($("minutes")) $("minutes").value = "";
  if ($("units")) $("units").value = "";
  if ($("weeksPerMonth")) $("weeksPerMonth").value = "4.33";
  if ($("payerMultiplier")) $("payerMultiplier").value = "";
  if ($("cmsSetting")) $("cmsSetting").value = "nonfacility";
  if ($("rate90834")) $("rate90834").value = "";
  if ($("rate90837")) $("rate90837").value = "";
  if ($("compareSessions")) $("compareSessions").value = "";
  [
    "c_patientName","c_patientDob","c_patientEmail","c_patientSex","c_dos","c_pos",
    "c_subscriberName","c_memberId","c_payerName","c_payerId","c_relationship","c_claimType",
    "c_billProvName","c_billNpi","c_taxId","c_dx1","c_dx2","c_dx3","c_cpt","c_units","c_charge","c_mod1","c_mod2","c_patientDue"
  ].forEach(id => { if ($(id)) $(id).value = ""; });

  if ($("c_pos")) $("c_pos").value = "11";
  if ($("c_relationship")) $("c_relationship").value = "self";
  if ($("c_claimType")) $("c_claimType").value = "insurance";
  if ($("c_units")) $("c_units").value = "1";

  calc();
  renderClaimPreview();
}

function openPay(){
  if (STRIPE_PAYMENT_LINK.startsWith("http")){
    window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
  } else {
    alert("Add your Stripe payment link in script.js.");
  }
}

function unlockPro(){
  const key = prompt("Enter your Pro key:");
  if (!key) return;
  if (key.trim() === PRO_KEY){
    setPro(true);
    alert("Assure Med Pro unlocked!");
  } else {
    alert("Key didn’t match.");
  }
}

function lockPro(){
  setPro(false);
  alert("Pro locked.");
}

function buildClaimPacket(){
  const get = (id) => $(id)?.value ?? "";

  const patientName = (get("c_patientName") || $("patientName")?.value || "").trim();
  const patientDob  = (get("c_patientDob") || $("patientDob")?.value || "").trim();
  const dos         = (get("c_dos") || $("dosDateTime")?.value || "").trim();
  const cptDefault  = (get("c_cpt") || $("code")?.value || "").trim();

  const rate = parseFloat($("rate")?.value || "0") || 0;
  const unitsFromSession = parseFloat($("units")?.value || "1") || 1;
  const mult = parseFloat($("payerMultiplier")?.value || "1") || 1;
  const suggestedCharge = rate * unitsFromSession * mult;

  return {
    type: "837P",
    createdAt: new Date().toISOString(),
    patient: {
      name: patientName,
      dob: patientDob,
      sex: get("c_patientSex"),
      email: get("c_patientEmail").trim()
    },
    subscriber: {
      relationship: get("c_relationship") || "self",
      name: (get("c_subscriberName") || patientName).trim(),
      memberId: get("c_memberId").trim()
    },
    payer: {
      name: get("c_payerName").trim(),
      payerId: get("c_payerId").trim()
    },
    provider: {
      billingName: get("c_billProvName").trim(),
      billingNpi: get("c_billNpi").trim(),
      taxId: get("c_taxId").trim()
    },
    claimInfo: {
      dos,
      pos: get("c_pos") || "11",
      claimType: get("c_claimType") || "insurance",
      diagnosis: [get("c_dx1").trim(), get("c_dx2").trim(), get("c_dx3").trim()].filter(Boolean)
    },
    serviceLines: [
      {
        cpt: cptDefault,
        units: parseFloat(get("c_units") || "1") || 1,
        charge: (parseFloat(get("c_charge")) || 0) > 0
          ? (parseFloat(get("c_charge")) || 0)
          : (suggestedCharge > 0 ? Number(suggestedCharge.toFixed(2)) : 0),
        modifiers: [get("c_mod1").trim(), get("c_mod2").trim()].filter(Boolean),
        patientDue: parseFloat(get("c_patientDue") || "0") || 0
      }
    ]
  };
}

function renderClaimPreview(){
  const pre = $("claimPreview");
  if (!pre) return;
  try{
    pre.textContent = JSON.stringify(buildClaimPacket(), null, 2);
  }catch(e){
    pre.textContent = "Could not build claim packet.";
  }
}

function exportClaimJson(){
  const claim = buildClaimPacket();
  const blob = new Blob([JSON.stringify(claim, null, 2)], { type:"application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_claim.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function generate837EDI(){
  const claim = buildClaimPacket();

  const patient = claim.patient.name || "PATIENT";
  const cpt = claim.serviceLines?.[0]?.cpt || "";
  const units = claim.serviceLines?.[0]?.units || 1;
  const charge = claim.serviceLines?.[0]?.charge || 0;
  const providerNPI = claim.provider.billingNpi || "1234567890";
  const payer = claim.payer.name || "PAYER";

  const edi = `ISA*00*          *00*          *ZZ*ASSUREMED      *ZZ*CLEARINGHOUSE  *240305*1253*^*00501*000000001*0*T*:~
GS*HC*ASSUREMED*CLEARINGHOUSE*20240305*1253*1*X*005010X222A1~
ST*837*0001~
BHT*0019*00*0123*20240305*1253*CH~
NM1*41*2*ASSURE MED*****46*123456~
NM1*40*2*${payer}*****46*999999~
HL*1**20*1~
NM1*85*2*ASSURE MED*****XX*${providerNPI}~
HL*2*1*22*0~
NM1*IL*1*${patient}****MI*123456789~
CLM*12345*${charge}***11:B:1*Y*A*Y*I~
LX*1~
SV1*HC:${cpt}*${charge}*UN*${units}***1~
SE*10*0001~
GE*1*1~
IEA*1*000000001~`;

  const blob = new Blob([edi], { type:"text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_837P.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fillClaimFromSession(){
  if ($("c_patientName")) $("c_patientName").value = $("patientName")?.value || "";
  if ($("c_patientDob")) $("c_patientDob").value = $("patientDob")?.value || "";
  if ($("c_patientEmail")) $("c_patientEmail").value = $("patientEmail")?.value || "";
  if ($("c_dos")) $("c_dos").value = $("dosDateTime")?.value || "";
  if ($("c_cpt")) $("c_cpt").value = $("code")?.value || "";

  const units = parseFloat($("units")?.value || "1") || 1;
  if ($("c_units")) $("c_units").value = String(units);

  const rate = parseFloat($("rate")?.value || "0") || 0;
  const mult = parseFloat($("payerMultiplier")?.value || "1") || 1;
  const visitCharge = rate * units * mult;
  if ($("c_charge")) $("c_charge").value = visitCharge > 0 ? visitCharge.toFixed(2) : "";

  renderClaimPreview();
  saveState();
}

function emailBillAmountOnly(){
  const email = ($("patientEmail")?.value || "").trim();
  if (!email){
    alert("Enter patient email first.");
    return;
  }

  const patient = $("patientName")?.value || "Patient";
  const provider = $("providerName")?.value || "Assure Med";
  const dos = $("dosDateTime")?.value || "";
  const rate = parseFloat($("rate")?.value || "0") || 0;
  const units = parseFloat($("units")?.value || "1") || 1;
  const multiplier = parseFloat($("payerMultiplier")?.value || "1") || 1;
  const total = rate * units * multiplier;

  if (total <= 0){
    alert("Please enter a valid Rate first.");
    return;
  }

  const subject = `Statement from ${provider}`;
  const body = `Hello ${patient},

Date of Service: ${dos}

Amount Due: $${total.toFixed(2)}

Thank you,
${provider}`;

  window.location.href =
    `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function loadCmsRateIntoRate(){
  alert("Baseline fee loading placeholder is active. Add your fee data here when ready.");
}

function exportFees(){
  const blob = new Blob([JSON.stringify(fees, null, 2)], { type:"application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_fees.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFeesPrompt(){
  $("importFile")?.click();
}

function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      if (!parsed || !parsed.codes){
        alert("Invalid JSON file.");
        return;
      }
      fees = parsed;
      saveFees();
      alert("Fee table imported.");
    }catch{
      alert("Could not read JSON file.");
    }
  };
  reader.readAsText(file);
}

function wire(){
  populateDropdowns();

  const saved = loadState();
  if (saved) setState(saved);

  renderPlanUI();

  [
    "patientName","patientDob","dosDateTime","patientEmail","providerName","note",
    "code","rate","count","minutes","units","weeksPerMonth","payerMultiplier","cmsSetting",
    "mixCode","mixUnits"
  ].forEach(id => $(id)?.addEventListener("input", () => {
    if (id === "minutes") minutesToUnits();
    calc();
  }));

  [
    "c_patientName","c_patientDob","c_patientSex","c_patientEmail","c_dos","c_pos",
    "c_subscriberName","c_memberId","c_payerName","c_payerId","c_relationship","c_claimType",
    "c_billProvName","c_billNpi","c_taxId",
    "c_dx1","c_dx2","c_dx3","c_cpt","c_units","c_charge","c_mod1","c_mod2","c_patientDue"
  ].forEach(id => $(id)?.addEventListener("input", () => {
    renderClaimPreview();
    saveState();
  }));

  $("loadCmsRateBtn")?.addEventListener("click", (e) => { e.preventDefault(); loadCmsRateIntoRate(); });
  $("exportFeesBtn")?.addEventListener("click", (e) => { e.preventDefault(); exportFees(); });
  $("importFeesBtn")?.addEventListener("click", (e) => { e.preventDefault(); importFeesPrompt(); });
  $("importFile")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) handleImportFile(f);
    e.target.value = "";
  });

  $("addMixBtn")?.addEventListener("click", (e) => { e.preventDefault(); addMixItem(); });
  $("clearMixBtn")?.addEventListener("click", (e) => { e.preventDefault(); clearMix(); });
  $("calcCompare")?.addEventListener("click", (e) => { e.preventDefault(); calcCompare(); });

  $("jumpToCalc")?.addEventListener("click", () => $("calculator")?.scrollIntoView({behavior:"smooth"}));
  $("jumpToClaims")?.addEventListener("click", () => $("claims")?.scrollIntoView({behavior:"smooth"}));

  $("demoBtn")?.addEventListener("click", loadDemo);
  $("resetBtn")?.addEventListener("click", resetAll);
  $("downloadBtn")?.addEventListener("click", downloadCSV);
  $("printBtn")?.addEventListener("click", printPDF);
  $("emailBillBtn")?.addEventListener("click", (e) => { e.preventDefault(); emailBillAmountOnly(); });

  $("openPayBtn")?.addEventListener("click", openPay);
  $("unlockBtn")?.addEventListener("click", unlockPro);
  $("lockBtn")?.addEventListener("click", lockPro);

  $("exportClaimJsonBtn")?.addEventListener("click", (e) => { e.preventDefault(); exportClaimJson(); });
  $("fillClaimFromSessionBtn")?.addEventListener("click", (e) => { e.preventDefault(); fillClaimFromSession(); });
  $("generate837Btn")?.addEventListener("click", (e) => { e.preventDefault(); generate837EDI(); });

  if ($("yr")) $("yr").textContent = new Date().getFullYear();

  calc();
  renderClaimPreview();
}

document.addEventListener("DOMContentLoaded", wire);
