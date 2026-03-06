function $(id){ return document.getElementById(id); }

/* =========================
   BASIC HELPERS
========================= */

function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n){
  if (!Number.isFinite(n)) return "$0.00";
  return "$" + n.toFixed(2);
}

/* =========================
   CLAIM BUILDER
========================= */

function buildClaimPacket(){

  const patient = $("c_patientName")?.value || "";
  const dob = $("c_patientDob")?.value || "";
  const dos = $("c_dos")?.value || "";

  const cpt = $("c_cpt")?.value || $("code")?.value || "";

  const units = num($("c_units")?.value) || 1;

  const charge =
    num($("c_charge")?.value) ||
    (num($("rate")?.value) *
     (num($("units")?.value) || 1) *
     (num($("payerMultiplier")?.value) || 1));

  return {

    type: "837P",

    patient:{
      name: patient,
      dob: dob,
      email: $("c_patientEmail")?.value || ""
    },

    payer:{
      name: $("c_payerName")?.value || "",
      payerId: $("c_payerId")?.value || ""
    },

    provider:{
      billingName: $("c_billProvName")?.value || "",
      billingNpi: $("c_billNpi")?.value || ""
    },

    claimInfo:{
      dos: dos,
      pos: $("c_pos")?.value || "11"
    },

    serviceLines:[
      {
        cpt: cpt,
        units: units,
        charge: Number(charge.toFixed(2))
      }
    ]
  };
}

/* =========================
   CLAIM PREVIEW
========================= */

function renderClaimPreview(){

  const pre = $("claimPreview");
  if(!pre) return;

  const claim = buildClaimPacket();

  pre.textContent =
    JSON.stringify(claim,null,2);
}

/* =========================
   EXPORT CLAIM JSON
========================= */

function exportClaimJson(){

  const claim = buildClaimPacket();

  const blob =
    new Blob(
      [JSON.stringify(claim,null,2)],
      {type:"application/json"}
    );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "assuremed_claim.json";

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   GENERATE 837P
========================= */

function generate837EDI(){

  const claim = buildClaimPacket();

  const patient =
    claim.patient.name || "PATIENT";

  const cpt =
    claim.serviceLines[0].cpt || "";

  const units =
    claim.serviceLines[0].units || 1;

  const charge =
    claim.serviceLines[0].charge || 0;

  const providerNPI =
    claim.provider.billingNpi || "1234567890";

  const payer =
    claim.payer.name || "PAYER";

  const edi =

`ISA*00*          *00*          *ZZ*ASSUREMED      *ZZ*CLEARINGHOUSE  *240305*1253*^*00501*000000001*0*T*:~
GS*HC*ASSUREMED*CLEARINGHOUSE*20240305*1253*1*X*005010X222A1~
ST*837*0001~
BHT*0019*00*0123*20240305*1253*CH~
NM1*41*2*ASSURE MED*****46*123456~
NM1*40*2*${payer}*****46*999999~
HL*1**20*1~
NM1*85*2*ASSURE MED*****XX*${providerNPI}~
HL*2*1*22*0~
NM1*IL*1*${patient}****MI*123456789~
CLM*12345*${charge}***11:B:1*Y*A*Y*I~
LX*1~
SV1*HC:${cpt}*${charge}*UN*${units}***1~
SE*10*0001~
GE*1*1~
IEA*1*000000001~`;

  const blob =
    new Blob([edi],{type:"text/plain"});

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = "assuremed_837P.txt";

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   FILL CLAIM FROM SESSION
========================= */

function fillClaimFromSession(){

  if($("c_patientName"))
    $("c_patientName").value =
      $("patientName")?.value || "";

  if($("c_patientDob"))
    $("c_patientDob").value =
      $("patientDob")?.value || "";

  if($("c_dos"))
    $("c_dos").value =
      $("dosDateTime")?.value || "";

  if($("c_cpt"))
    $("c_cpt").value =
      $("code")?.value || "";

  const units =
    num($("units")?.value) || 1;

  if($("c_units"))
    $("c_units").value = units;

  const rate =
    num($("rate")?.value);

  const mult =
    num($("payerMultiplier")?.value) || 1;

  const charge =
    rate * units * mult;

  if($("c_charge"))
    $("c_charge").value =
      charge.toFixed(2);

  renderClaimPreview();
}

/* =========================
   EMAIL BILL
========================= */

function emailBillAmountOnly(){

  const email =
    $("patientEmail")?.value.trim();

  if(!email){
    alert("Enter patient email first.");
    return;
  }

  const patient =
    $("patientName")?.value || "Patient";

  const provider =
    $("providerName")?.value || "Assure Med";

  const dos =
    $("dosDateTime")?.value || "";

  const rate =
    num($("rate")?.value);

  const units =
    num($("units")?.value) || 1;

  const mult =
    num($("payerMultiplier")?.value) || 1;

  const total =
    rate * units * mult;

  const subject =
    `Statement from ${provider}`;

  const body =
`Hello ${patient},

Date of Service: ${dos}

Amount Due: $${total.toFixed(2)}

Thank you,
${provider}`;

  window.location.href =
`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* =========================
   WIRE BUTTONS
========================= */

function wire(){

  $("exportClaimJsonBtn")
    ?.addEventListener("click",
      exportClaimJson);

  $("generate837Btn")
    ?.addEventListener("click",
      generate837EDI);

  $("fillClaimFromSessionBtn")
    ?.addEventListener("click",
      fillClaimFromSession);

  $("emailBillBtn")
    ?.addEventListener("click",
      emailBillAmountOnly);

  document.querySelectorAll("input,select")
    .forEach(el=>{
      el.addEventListener("input",
        renderClaimPreview);
    });

  renderClaimPreview();
}

/* =========================
   START APP
========================= */

document.addEventListener(
  "DOMContentLoaded",
  wire
);
