// ------------------ DEMO ICD-10 DATA ------------------
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

// ------------------ SELECT CODE ------------------
function selectCode(code) {
  document.getElementById("selectedCode").value = code;
}

// ------------------ LIVE SEARCH (DEMO DATA) ------------------
const symptomInput = document.getElementById("symptom");
const codeInput = document.getElementById("code");
const resultDiv = document.getElementById("result");

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Filter function for demo data
function filterDemoData(query) {
  const q = query.toLowerCase();
  return demoICDData.filter(item =>
    item.Code.toLowerCase().includes(q) || item.Name.toLowerCase().includes(q)
  );
}

// Symptom live search (demo)
symptomInput.addEventListener("input", debounce(function() {
  const query = symptomInput.value.trim();
  if (query.length < 1) { resultDiv.innerHTML = ""; return; }

  const matches = filterDemoData(query);
  if (matches.length === 0) {
    resultDiv.innerHTML = "<p>No matching ICD-10 codes found.</p>";
    return;
  }

  let tableHTML = "<table><tr><th>ICD Code</th><th>Description</th></tr>";
  matches.forEach(item => {
    tableHTML += `<tr onclick="selectCode('${item.Code}')"><td>${item.Code}</td><td>${item.Name}</td></tr>`;
  });
  tableHTML += "</table>";
  resultDiv.innerHTML = tableHTML;
}, 300));

// Code exact search (demo)
codeInput.addEventListener("change", function() {
  const query = codeInput.value.trim();
  if (!query) { resultDiv.innerHTML = ""; return; }

  const match = demoICDData.find(item => item.Code.toLowerCase() === query.toLowerCase());
  if (match) {
    resultDiv.innerHTML = `
      <table>
        <tr onclick="selectCode('${match.Code}')"><th>ICD Code</th><td>${match.Code}</td></tr>
        <tr><th>Description</th><td>${match.Name}</td></tr>
      </table>`;
  } else {
    resultDiv.innerHTML = "<p>No matching ICD-10 code found.</p>";
  }
});

// ------------------ BILLING CALCULATOR ------------------
document.getElementById("calcBtn").addEventListener("click", function() {
  const cost = parseFloat(document.getElementById("costInput").value);
  const resultDiv = document.getElementById("totalResult");

  if (isNaN(cost) || cost <= 0) {
    resultDiv.innerText = "Please enter a valid cost.";
    return;
  }

  const markupRate = 0.20;
  const total = cost + (cost * markupRate);
  const selectedCode = document.getElementById("selectedCode").value || "N/A";

  resultDiv.innerHTML = `
    <p>Total with 20% markup: $${total.toFixed(2)}</p>
    <p>Selected ICD-10 code: ${selectedCode}</p>`;
});
