import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory storage for certificates (for demo purposes)
const certificates = {};

// Generate Blockcerts JSON + hash
app.post("/generate", (req, res) => {
  const { name, course, date } = req.body;

  // Create Blockcerts JSON
  const certificate = {
    recipient: { name },
    issuer: {
      name: "Blockchain Academy",
      url: "https://academy.example.com",
      publicKey: "ISSUER_PUBLIC_KEY"
    },
    badge: {
      name: course,
      description: `Completed ${course} course`
    },
    issuedOn: date,
    id: "CERT" + Date.now()
  };

  // Hash the JSON
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(certificate))
    .digest("hex");

  // Store certificate in memory
  certificates[certificate.id] = certificate;

  res.json({ hash, certificate });
});

// Endpoint to fetch certificate JSON by ID
app.get("/certificates/:id", (req, res) => {
  const cert = certificates[req.params.id];
  if (!cert) return res.status(404).send("Certificate not found");
  res.json(cert);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on port ${PORT}`)
);