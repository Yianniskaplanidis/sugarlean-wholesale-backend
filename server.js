const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ mount the router here:
const applicationsRouter = require("./routes/applications");
app.use("/api/wholesale", applicationsRouter);
// This means the full routes are:
//   GET  /api/wholesale/ping
//   POST /api/wholesale/apply

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
