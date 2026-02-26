function $(id){ return document.getElementById(id); }

function calculate(){

  const rate = parseFloat($("rate").value) || 0;
  const count = parseInt($("count").value) || 0;
  const units = parseFloat($("units").value) || 1;
  const mult = parseFloat($("payerMultiplier").value) || 1;

  const total = rate * count * units * mult;

  $("summary").innerHTML = `
    Weekly Estimate: $${total.toFixed(2)}
  `;
}

function formatDate(val){
  if(!val) return "";
  return new Date(val).toLocaleString();
}

function emailBill(){

  const email = $("patientEmail").value.trim();
  if(!email){
    alert("Enter patient email first.");
    return;
  }

  const patient = $("patientName").value || "Patient";
  const dob = $("patientDob").value;
  const dos = formatDate($("dosDateTime").value);
  const due = $("billDueDate").value;
  const provider = $("providerName").value || "Provider";

  const code = $("code").value;
  const rate = parseFloat($("rate").value) || 0;
  const count = parseInt($("count").value) || 0;
  const units = parseFloat($("units").value) || 1;
  const mult = parseFloat($("payerMultiplier").value) || 1;

  const total = rate * count * units * mult;

  const subject = `Statement from ${provider} for ${patient}`;

  const body = `
Hello ${patient},

Date/Time of Service: ${dos}
DOB: ${dob}

Service Code: ${code}
Rate: $${rate.toFixed(2)}
Count: ${count}
Units: ${units}

Amount Due: $${total.toFixed(2)}
Due Date: ${due}

Thank you,
${provider}
`;

  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
}

$("calculateBtn").addEventListener("click", calculate);
$("emailBillBtn").addEventListener("click", emailBill);
}

wire();
