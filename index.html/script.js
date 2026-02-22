function $(id){ return document.getElementById(id); }

function money(n){
  if (!Number.isFinite(n)) return "$0.00";
  return "$" + n.toFixed(2);
}

function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function showWarn(msg){
  const box = $("warnBox");
  if (!msg){
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  box.style.display = "block";
  box.innerHTML = msg;
}

function calc(){
  const cpt = $("cpt").value;
  const rate = num($("rate").value);
  const sessionsPerWeek = Math.max(0, Math.floor(num($("sessionsPerWeek").value)));
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? num(payerMultRaw) : 1;

  // Crisis add-on settings
  const addonOn = $("addon90840").checked;
  const addonRate = num($("crisisRate").value);
  const crisisSessions = Math.max(0, Math.floor(num($("crisisSessionsPerWeek").value)));

  // Basic validation warnings
  let warn = "";
  if (payerMultRaw && payerMult <= 0) warn += "• Payer multiplier must be greater than 0.<br>";
  if (weeksPerMonth <= 0) warn += "• Weeks per month must be greater than 0.<br>";
  if (rate <= 0) warn += "• Enter a session rate greater than $0.<br>";
  if (sessionsPerWeek <= 0) warn += "• Enter sessions per week (0 or more).<br>";

  if (addonOn && cpt !== "90839") {
    warn += "• 90840 add-on is usually used with crisis services (90839). You can still model it, but double-check payer rules.<br>";
  }
  if (addonOn && addonRate <= 0) {
    warn += "• Add-on is enabled but add-on rate is $0. Enter an add-on rate to include it.<br>";
  }
  if (addonOn && crisisSessions <= 0) {
    warn += "• Add-on is enabled but crisis sessions/week is 0. Enter crisis sessions/week to include it.<br>";
  }
  showWarn(warn);

  // Revenue per session (apply payer multiplier)
  const revPerSession = rate * payerMult;

  // Base weekly revenue
  let weekly = revPerSession * sessionsPerWeek;

  // Add-on weekly revenue (only adds when enabled AND crisisSessions>0)
  if (addonOn && addonRate > 0 && crisisSessions > 0) {
    weekly += (addonRate * payerMult) * crisisSessions;
  }

  const monthly = weekly * weeksPerMonth;
  const yearly = weekly * 52;

  $("revPerSession").textContent = money(revPerSession);
  $("revWeekly").textContent = money(weekly);
  $("revMonthly").textContent = money(monthly);
  $("revYearly").textContent = money(yearly);
}

// Undercoding loss calculator
function calcLoss(){
  const r34 = num($("rate90834").value);
  const r37 = num($("rate90837").value);
  const sessions = Math.max(0, Math.floor(num($("sessionsForCompare").value)));
  const weeksPerMonth = num($("weeksPerMonth").value) || 4.33;

  if (r34 <= 0 || r37 <= 0 || sessions <= 0){
    $("compareBox").innerHTML = "<div class='mini'>Please enter both rates and sessions/week.</div>";
    return;
  }

  const diffPerSession = r37 - r34;
  const weeklyLoss = diffPerSession * sessions;
  const monthlyLoss = weeklyLoss * weeksPerMonth;
  const yearlyLoss = weeklyLoss * 52;

  const direction = diffPerSession >= 0 ? "potential lost revenue" : "difference (90834 is higher than 90837 in your inputs)";

  $("compareBox").innerHTML = `
    <div><strong>Difference per session:</strong> ${money(diffPerSession)} (${direction})</div>
    <div style="margin-top:8px;"><strong>Weekly difference:</strong> ${money(weeklyLoss)}</div>
    <div><strong>Monthly difference:</strong> ${money(monthlyLoss)}</div>
    <div><strong>Yearly difference:</strong> ${money(yearlyLoss)}</div>
    <div class="mini" style="margin-top:10px;">
      Reminder: bill based on documentation/time rules and payer policy.
    </div>
  `;
}

// Wire up events
["cpt","rate","sessionsPerWeek","weeksPerMonth","payerMultiplier","addon90840","crisisRate","crisisSessionsPerWeek"]
  .forEach(id => $(id).addEventListener("input", calc));

$("calcCompare").addEventListener("click", (e) => {
  e.preventDefault();
  calcLoss();
});

$("jumpToCalc").addEventListener("click", () => {
  document.getElementById("calculator").scrollIntoView({behavior:"smooth"});
});

$("resetBtn").addEventListener("click", () => {
  $("cpt").value = "90834";
  $("rate").value = "";
  $("sessionsPerWeek").value = "";
  $("weeksPerMonth").value = "4.33";
  $("payerMultiplier").value = "";
  $("addon90840").checked = false;
  $("crisisRate").value = "";
  $("crisisSessionsPerWeek").value = "";

  $("rate90834").value = "";
  $("rate90837").value = "";
  $("sessionsForCompare").value = "";

  $("compareBox").innerHTML = "<div class='mini'>Enter both rates and sessions/week, then click “Calculate Loss”.</div>";
  calc();
});

$("yr").textContent = new Date().getFullYear();

// Start
calc();
