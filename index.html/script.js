// ------------------ ICD SEARCH ------------------
document.getElementById("searchBtn").addEventListener("click", searchICD);

async function searchICD() {
  const codeInput = document.getElementById("code").value.trim();
  const specialtyInput = document.getElementById("specialty").value.trim();
  const ageInput = parseInt(document.getElementById("age").value);

  const resultDiv = document.getElementById("result");

  try {
    const response = await fetch("data/icd10.json");
    const data = await response.json();

    const result = data.find(item =>
      item.code === codeInput &&
      item.specialty.toLowerCase() === specialtyInput.toLowerCase() &&
      ageInput >= item.minAge &&
      ageInput <= item.maxAge
    );

    if (result) {
      resultDiv.innerHTML = `
        <h3>Match Found</h3>
        <p><strong>Description:</strong> ${result.description}</p>
      `;
    } else {
      resultDiv.innerHTML = "<p>No matching ICD-10 record found.</p>";
    }

  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = "<p>Error loading ICD-10 data.</p>";
  }
}


// ------------------ BILLING CALCULATOR ------------------
document.getElementById("calcBtn").addEventListener("click", calculateTotal);

function calculateTotal() {
  const cost = parseFloat(document.getElementById("costInput").value);
  const resultDiv = document.getElementById("totalResult");

  if (isNaN(cost) || cost <= 0) {
    resultDiv.innerText = "Please enter a valid cost.";
    return;
  }

  const markupRate = 0.20; // 20% markup
  const total = cost + (cost * markupRate);

  resultDiv.innerText = "Total with 20% markup: $" + total.toFixed(2);
}
    }
}
