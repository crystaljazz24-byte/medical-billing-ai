async function searchICD() {

    const code = document.getElementById("icdInput").value.trim();
    const specialty = document.getElementById("specialtyInput").value.trim();
    const age = parseInt(document.getElementById("ageInput").value);

    if (!code || !specialty || isNaN(age)) {
        document.getElementById("result").innerText = 
            "Please fill out all fields.";
        return;
    }

    try {
        const response = await fetch("./data/icd10.json");

        if (!response.ok) {
            throw new Error("File not found");
        }

        const data = await response.json();

        const match = data.find(item =>
            item.code.toLowerCase() === code.toLowerCase() &&
            item.specialty.toLowerCase() === specialty.toLowerCase() &&
            age >= item.minAge &&
            age <= item.maxAge
        );

        if (match) {
            document.getElementById("result").innerText =
                "Description: " + match.description;
        } else {
            document.getElementById("result").innerText =
                "No matching ICD-10 found.";
        }

    } catch (error) {
        document.getElementById("result").innerText =
            "Error loading ICD-10 data.";
    }
}
