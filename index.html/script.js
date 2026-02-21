// ======================
// ICD-10 DEMO DATA (works offline / GitHub Pages)
// ======================
const demoICDData = [
  { Code: "J10.1", Name: "Influenza with other respiratory manifestations" },
  { Code: "I10", Name: "Essential (primary) hypertension" },
  { Code: "E11.9", Name: "Type 2 diabetes mellitus without complications" },
  { Code: "R07.9", Name: "Chest pain, unspecified" },
  { Code: "M54.5", Name: "Low back pain" },
  { Code: "N39.0", Name: "Urinary tract infection, site not specified" },
  { Code: "F41.9", Name: "Anxiety disorder, unspecified" },
  { Code: "K21.9", Name: "Gastro-esophageal reflux disease without esophagitis" },
  { Code: "H52.4", Name: "Presbyopia" },
  { Code: "L03.90", Name: "Cellulitis, unspecified" }
];

// ======================
// CPT/HCPCS FEE LOOKUP (CMS PFS)
// ======================
// IMPORTANT: Replace this with a REAL dataset endpoint from CMS PFS (Socrata resource endpoint)
// Example format:
//   https://pfs.data.cms.gov/resource/abcd-1234.json
const CMS_PFS_ENDPOINT = "https://pfs.data.cms.gov/resource/XXXX-XXXX.json";

function $(id) {
  return document.getElementById(id);
}

function debounce(func, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => func(...args), delay);
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// ======================
// ICD-10 UI
// ======================
const icdCodeInput = $("icdCode");
const icdQueryInput = $("icdQuery");
const icdResult = $("icdResult");
const selectedIcd = $("selectedIcd");

function renderIcdTable(matches) {
  if (!matches.length) {
    icdResult.innerHTML = "<p>No matching ICD-10 codes found.</p>";
    return;
  }

  let html = "<table><tr><th>ICD-10 Code</th><th>Description</th></tr>";
  for (const item of matches) {
    html += `<tr data-code="${escapeHtml(item.Code)}">
              <td>${escapeHtml(item.Code)}</td>
              <td>${escapeHtml(item.Name)}</td>
            </tr>`;
  }
  html += "</table><p class='hint'>Click a row to select the ICD-10 code.</p>";
  icdResult.innerHTML = html;

  // Click handler (event delegation)
  const table = icdResult.querySelector("table");
  table.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-code]");
    if (!tr) return;
    selectedIcd.value = tr.dataset.code;
  });
}

function filterIcd() {
  const codeQ = icdCodeInput.value.trim().toLowerCase();
  const textQ = icdQueryInput.value.trim().toLowerCase();

  // if both empty, show all demo codes
  if (!codeQ && !textQ) {
    renderIcdTable(demoICDData);
    return;
  }

  const matches = demoICDData.filter(item => {
    const c = item.Code.toLowerCase();
    const n = item.Name.toLowerCase();
    return (codeQ ? c.includes(codeQ) : true) && (textQ ? n.includes(textQ) || c.includes(textQ) : true);
  });

  renderIcdTable(matches);
}

// initial render
renderIcdTable(demoICDData);

// live search
icdCodeInput.addEventListener("input", debounce(filterIcd, 200));
icdQueryInput.addEventListener("input", debounce(filterIcd, 200));

// ======================
// Billing Calculator
// ======================
$("calcBtn").addEventListener("click", () => {
  const cost = parseFloat($("costInput").value);
  const totalDiv = $("totalResult");

  if (!Number.isFinite(cost) || cost <= 0) {
    totalDiv.innerHTML = "<p>Please enter a valid cost.</p>";
    return;
  }

  const markupRate = 0.20;
  const total = cost + cost * markupRate;
  const icd = selectedIcd.value || "N/A";

  totalDiv.innerHTML = `
    <p><strong>Total with 20% markup:</strong> $${total.toFixed(2)}</p>
    <p><strong>Selected ICD-10 code:</strong> ${escapeHtml(icd)}</p>
  `;
});

// ======================
// CPT/HCPCS Fee Lookup (requires CMS_PFS_ENDPOINT)
// ======================
$("feeBtn").addEventListener("click", lookupFee);

async function lookupFee() {
  const code = $("procCode").value.trim().toUpperCase();
  const units = Math.max(1, parseInt($("units").value || "1", 10));
  const setting = $("placeSetting").value; // facility | nonfacility
  const payerMultRaw = $("payerMultiplier").value.trim();
  const payerMult = payerMultRaw ? parseFloat(payerMultRaw) : null;

  const out = $("feeResult");

  if (!code) {
    out.innerHTML = "<p>Please enter a CPT/HCPCS code.</p>";
    return;
  }

  if (CMS_PFS_ENDPOINT.includes("XXXX-XXXX")) {
    out.innerHTML = `
      <p><strong>Setup needed:</strong> Open <code>script.js</code> and replace
      <code>CMS_PFS_ENDPOINT</code> with a real CMS PFS dataset endpoint.</p>
      <p>It should look like: <code>https://pfs.data.cms.gov/resource/abcd-1234.json</code></p>
    `;
    return;
  }

  out.innerHTML = "<p>Looking up fee...</p>";

  try {
    // Many CMS datasets use a field called hcpcs_code. If your dataset uses a different field,
    // change "hcpcs_code" below to the correct column name.
    const params = new URLSearchParams({
      "$limit": "50",
      "hcpcs_code": code
    });

    const url = `${CMS_PFS_ENDPOINT}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      out.innerHTML = "<p>No fee found for that code in this dataset.</p>";
      return;
    }

    // Pick first row. Some datasets return multiple rows per year/locality/modifier.
    const row = rows[0];

    // Fee field names vary by dataset. These are common guesses.
    const facilityFee = toNumber(row.facility_fee ?? row.facility_price ?? row.fac_price ?? row.payment_amount);
    const nonFacilityFee = toNumber(row.nonfacility_fee ?? row.nonfacility_price ?? row.nonfac_price ?? row.payment_amount);

    const base = setting === "facility" ? facilityFee : nonFacilityFee;

    if (!Number.isFinite(base)) {
      out.innerHTML = `
        <p>Fee data returned, but the fee column names don’t match yet.</p>
        <p><strong>Fix:</strong> open this URL in your browser and tell me what the fee fields are:</p>
        <p><code>${escapeHtml(url)}</code></p>
      `;
      return;
    }

    const medicareTotal = base * units;
    const payerTotal = payerMult ? medicareTotal * payerMult : null;

    out.innerHTML = `
      <p><strong>Code:</strong> ${escapeHtml(code)}</p>
      <p><strong>Base fee (${setting === "facility" ? "Facility" : "Non-Facility"}):</strong> $${base.toFixed(2)}</p>
      <p><strong>Units:</strong> ${units}</p>
      <p><strong>Medicare estimate:</strong> $${medicareTotal.toFixed(2)}</p>
      ${payerTotal !== null ? `<p><strong>Payer estimate (x${payerMult.toFixed(2)}):</strong> $${payerTotal.toFixed(2)}</p>` : ""}
      <p class="hint">If you want, we can add locality, year, and modifier filters once the dataset is chosen.</p>
    `;
  } catch (e) {
    console.error(e);
    out.innerHTML = "<p>Error looking up fee. Check the browser console for details.</p>";
  }
}

function toNumber(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : NaN;
}
