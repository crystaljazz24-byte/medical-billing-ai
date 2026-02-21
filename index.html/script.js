// ------------------ SELECT CODE ------------------
function selectCode(code) {
  document.getElementById("selectedCode").value = code;
}

// ------------------ ICD SEARCH (CODE + SYMPTOM LIVE) ------------------
const symptomInput = document.getElementById("symptom");
const resultDiv = document.getElementById("result");

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

symptomInput.addEventListener("input", debounce(async function() {
  const query = symptomInput.value.trim();
  if (query.length < 2) {
    resultDiv.innerHTML = "";
    return;
  }

  resultDiv.innerHTML = "Searching...";

  try {
    const url = `http://www.icd10api.com/?s=${encodeURIComponent(query)}&r=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      let tableHTML = "<table><tr><th>ICD Code</th><th>Description</th></tr>";
      data.forEach(item => {
        tableHTML += `<tr onclick="selectCode('${item.Code}')"><td>${item.Code}</td><td>${item.Name}</td></tr>`;
      });
      tableHTML += "</table>";
      resultDiv.innerHTML = tableHTML;
    } else {
      resultDiv.innerHTML = "<p>No matching ICD-10 codes found.</p>";
    }
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = "<p>Error searching ICD-10 codes.</p>";
  }
}, 400));

// Search by exact code
document.getElementById("code").addEventListener("change", async function() {
  const codeInput = this.value.trim();
  if (!codeInput) return;

  resultDiv.innerHTML = "Searching...";

  try {
    const url = `http://www.icd10api.com/?code=${encodeURIComponent(codeInput)}&r=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === true) {
      resultDiv.innerHTML = `
        <table>
          <tr onclick="selectCode('${data.Name}')"><th>ICD Code</th><td>${data.Name || "-"}</td></tr>
          <tr><th>Description</th><td>${data.Description || "-"}</td></tr>
          <tr><th>Valid?</th><td>${data.Valid ? "Yes" : "No"}</td></tr>
        </table>`;
    } else {
      resultDiv.innerHTML = "<p>No matching ICD-10 code found.</p>";
    }
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = "<p>Error looking up ICD-10 code.</p>";
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
