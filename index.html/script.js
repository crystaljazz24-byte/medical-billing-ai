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

// ------------------ ELEMENTS ------------------
const symptomInput = document.getElementById("symptom");
const codeInput = document.getElementById("code");
const resultDiv = document.getElementById("result");

// ------------------ DEBOUNCE ------------------
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ------------------ RENDER TABLE ------------------
function renderTable(matches) {
  if (!matches.length) {
    resultDiv.innerHTML = "<p>No matching ICD-10 codes found.</p>";
    return;
  }

  let html = "<table><tr><th>ICD Code</th><th>Description</th></tr>";
  matches.forEach(item => {
    html += `<tr onclick="selectCode('${item.Code}')"><td>${item.Code}</td><td>${item.Name}</td></tr>`;
  });
  html += "</table>";
  resultDiv.innerHTML = html;
}

// ------------------ LIVE SYMPTOM SEARCH (DEMO) ------------------
symptomInput.addEventListener(
  "input",
  debounce(() => {
    const query = symptomInput.value.trim().toLowerCase();
    if (query.length < 1) {
      resultDiv.innerHTML = "";
      return;
    }

    const matches = demoICDData.filter(item =>
      item.Code.toLowerCase().includes(query) ||
      item.Name.toLowerCase().includes(query)
    );

    renderTable(matches);
  }, 300)
);

// ------------------ EXACT CODE SEARCH (DEMO) ------------------
codeInput.addEventListener("input", () => {
  const query = codeInput.value.trim().toLowerCase();
  if (!query) {
    resultDiv.innerHTML = "";
    return;
  }

  const matches = demoICDData.filter(item => item.Code.toLowerCase().includes(query));
  renderTable(matches);
});

// ------------------ BILLING CALCULATOR ------------------
document.getElementById("calcBtn").addEventListener("click", () => {
  const cost = parseFloat(document.getElementById("costInput").value);
  const totalDiv = document.getElementById("totalResult");

  if (isNaN(cost) || cost <= 0) {
    totalDiv.innerText = "Please enter a valid cost.";
    return;
  }

  const markupRate = 0.20;
  const total = cost + cost * markupRate;
  const selectedCode = document.getElementById("selectedCode").value || "N/A";

  totalDiv.innerHTML = `
    <p>Total with 20% markup: $${total.toFixed(2)}</p>
    <p>Selected ICD-10 code: ${selectedCode}</p>
  `;
});
