import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory storage (for demo only)
const certificates = {};

/* ======================================================
   ROOT ROUTE (Optional but recommended)
====================================================== */
app.get("/", (req, res) => {
  res.send("Blockcerts Backend Running 🚀");
});

/* ======================================================
   GENERATE BLOCKCERTS-COMPLIANT CERTIFICATE
====================================================== */
app.post("/generate", (req, res) => {
  const { name, course, date } = req.body;

  const certificateId = crypto.randomUUID();

  const certificate = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/blockcerts/v2"
    ],
    id: `urn:uuid:${certificateId}`,
    type: ["VerifiableCredential", "BlockcertsCredential"],

    issuer: {
      id: "https://your-domain.com/issuer.json", // change after deployment
      type: "Profile",
      name: "Blockchain Academy"
    },

    issuanceDate: new Date(date).toISOString(),

    credentialSubject: {
      id: `did:example:${certificateId}`,
      type: "Person",
      name: name
    },

    badge: {
      type: "BadgeClass",
      name: course,
      description: `Completed ${course} course`
    }
  };

  // Create SHA256 hash of full certificate
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(certificate))
    .digest("hex");

  // Store using UUID (without urn:)
  certificates[certificateId] = certificate;

  res.json({
    message: "Certificate generated",
    certificateId,
    hash,
    certificate
  });
});

/* ======================================================
   ADD BLOCKCHAIN PROOF AFTER ETH TRANSACTION
====================================================== */
app.post("/add-proof", (req, res) => {
  const { certificateId, txHash } = req.body;

  const cert = certificates[certificateId];
  if (!cert) return res.status(404).send("Certificate not found");

  cert.proof = {
    type: "EthereumHashProof",
    created: new Date().toISOString(),
    proofPurpose: "assertionMethod",
    anchorType: "ETHData",
    chain: "sepolia",
    transactionId: txHash
  };

  res.json({ message: "Proof added successfully" });
});

/* ======================================================
   FETCH CERTIFICATE JSON
====================================================== */
app.get("/certificates/:id", (req, res) => {
  const cert = certificates[req.params.id];
  if (!cert) return res.status(404).send("Certificate not found");
  res.json(cert);
});

/* ======================================================
   ISSUER PROFILE (Required by Blockcerts Standard)
====================================================== */
app.get("/issuer.json", (req, res) => {
  res.json({
    "@context": "https://w3id.org/blockcerts/v2",
    id: "https://your-domain.com/issuer.json", // change after deployment
    type: "Profile",
    name: "Blockchain Academy",
    url: "https://your-domain.com",
    email: "admin@academy.com",
    publicKey: [{
      id: "ecdsa-koblitz-pubkey:YOUR_PUBLIC_KEY",
      created: "2024-01-01T00:00:00Z",
      revoked: null
    }]
  });
});

/* ======================================================
   START SERVER (Render Compatible)
====================================================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on port ${PORT}`)
);
