// ------------------ ICD SEARCH ------------------
document.getElementById("searchBtn").addEventListener("click", async function() {
  const codeInput = document.getElementById("code").value.trim();
  const symptomInput = document.getElementById("symptom").value.trim();
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "Searching...";

  try {
    let url = "";
    if (codeInput !== "") {
      url = `http://www.icd10api.com/?code=${encodeURIComponent(codeInput)}&r=json`;
    } else if (symptomInput !== "") {
      url = `http://www.icd10api.com/?s=${encodeURIComponent(symptomInput)}&r=json`;
    } else {
      resultDiv.innerHTML = "<p>Please enter a code or symptom.</p>";
      return;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      let tableHTML = "<table><tr><th>ICD Code</th><th>Description</th></tr>";
      data.forEach(item => {
        tableHTML += `<tr onclick="selectCode('${item.Code}')"><td>${item.Code}</td><td>${item.Name}</td></tr>`;
      });
      tableHTML += "</table>";
      resultDiv.innerHTML = tableHTML;
    } else if (data.Response === true) {
      resultDiv.innerHTML = `
        <table>
          <tr onclick="selectCode('${data.Name}')"><th>ICD Code</th><td>${data.Name || "-"}</td></tr>
          <tr><th>Description</th><td>${data.Description || "-"}</td></tr>
          <tr><th>Valid?</th><td>${data.Valid ? "Yes" : "No"}</td></tr>
        </table>`;
    } else {
      resultDiv.innerHTML = "<p>No matching ICD-10 codes found.</p>";
    }
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = "<p>Error looking up ICD-10 codes.</p>";
  }
});

// ------------------ SELECT CODE ------------------
function selectCode(code) {
  document.getElementById("selectedCode").value = code;
}

// ------------------ BILLING CALCULATOR ------------------
document.getElementById("calcBtn").addEventListener("click", function() {
  const cost = parseFloat(document.getElementById("costInput").value);
  const resultDiv = document.getElementById("totalResult");

  if (isNaN(cost) || cost <= 0) {
    resultDiv.innerText = "Please enter a valid cost.";
    return;
  }

  const markupRate = 0.20; // 20% markup
  const total = cost + (cost * markupRate);
  const selectedCode = document.getElementById("selectedCode").value || "N/A";

  resultDiv.innerHTML = `
    <p>Total with 20% markup: $${total.toFixed(2)}</p>
    <p>Selected ICD-10 code: ${selectedCode}</p>`;
});
