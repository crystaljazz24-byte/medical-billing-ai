const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/submit-claim", (req, res) => {
  const claim = req.body;

  if (!claim) {
    return res.status(400).json({ error: "Missing claim payload" });
  }

  console.log("Received claim:");
  console.log(JSON.stringify(claim, null, 2));

  const fakeClaimId = "CLM-" + Date.now();

  return res.json({
    success: true,
    claimId: fakeClaimId,
    message: "Claim received successfully"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
