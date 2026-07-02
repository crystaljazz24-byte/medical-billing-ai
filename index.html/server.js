const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve all static files (index.html, script.js, styles.css)
app.use(express.static(__dirname));

// Temporary in-memory claims
let claims = [];

// Home page
app.get("/", (req, res) => {
    res.send("HELLO FROM ASSURE MED");
});

// Get all claims
app.get("/api/claims", (req, res) => {
    res.json(claims);
});

// Submit claim
app.post("/api/submit-claim", (req, res) => {

    const claim = req.body;

    if (!claim) {
        return res.status(400).json({
            error: "Missing claim payload"
        });
    }

    claims.push(claim);

    console.log("Claim received:", claim);

    res.json({
        success: true,
        claimId: "CLM-" + Date.now()
    });

});

app.listen(PORT, () => {
    console.log(`🚀 Assure Med running at http://localhost:${PORT}`);
});