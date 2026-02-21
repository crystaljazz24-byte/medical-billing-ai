document.querySelector("button").addEventListener("click", searchICD);

async function searchICD() {
  const codeInput = document.querySelector("input[placeholder*='code']").value.trim();
  const specialtyInput = document.querySelector("input[placeholder*='specialty']").value.trim();
  const ageInput = parseInt(document.querySelector("input[placeholder*='age']").value);

  try {
    const response = await fetch("data/icd10.json");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    const result = data.find(item =>
      item.code === codeInput &&
      item.specialty.toLowerCase() === specialtyInput.toLowerCase() &&
      ageInput >= item.minAge &&
      ageInput <= item.maxAge
    );

    if (result) {
      alert(`Found: ${result.description}`);
    } else {
      alert("No matching ICD-10 record found.");
    }

  } catch (error) {
    console.error(error);
    alert("Error loading ICD-10 data.");
  }
}
