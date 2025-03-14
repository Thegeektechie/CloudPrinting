const express = require("express");
const multer = require("multer");
const axios = require("axios");
const bonjour = require("bonjour")();
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Configure Multer for file uploads (store in `/tmp/` since Vercel doesn’t allow local storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/tmp/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// **1️⃣ Upload File to Cloudinary**
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    // Upload file to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await axios.post(cloudinaryUrl, form, {
            headers: { ...form.getHeaders() },
        });
        res.json({ message: "File uploaded successfully!", fileUrl: response.data.secure_url });
    } catch (error) {
        res.status(500).json({ error: "Cloudinary upload failed." });
    }
});

// **2️⃣ Discover WiFi Printers (Bonjour/Zeroconf)**
app.get("/printers", (req, res) => {
    let printers = [];
    bonjour.find({ type: "ipp" }, (service) => {
        printers.push(`${service.name} (${service.host}:${service.port})`);
    });

    setTimeout(() => {
        res.json({ printers });
    }, 3000);
});

// **3️⃣ Print File Using PrintNode API**
app.post("/print", async (req, res) => {
    const { fileUrl, printerId } = req.body;

    if (!fileUrl || !printerId) {
        return res.status(400).json({ error: "Missing file URL or printer ID." });
    }

    try {
        const response = await axios.post("https://api.printnode.com/printjobs", {
            printerId,
            title: "Cloud Print Job",
            contentType: "pdf_uri",
            content: fileUrl,
        }, {
            auth: { username: process.env.PRINTNODE_API_KEY, password: "" },
        });

        res.json({ message: "Print job sent successfully!", printJob: response.data });
    } catch (error) {
        res.status(500).json({ error: "Print job failed." });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
