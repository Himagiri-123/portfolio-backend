require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
// మీ MongoDB URL ని Vercel Environment Variables లో MONGODB_URI అనే పేరుతో సేవ్ చేయాలి.
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err));

// 2. Cloudinary Config
// మనం Vercel లో సేవ్ చేసిన Keys ఇక్కడ ఆటోమేటిక్ గా వస్తాయి.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 3. Storage Setup (Direct to Cloudinary)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'himagiri_portfolio', // Cloudinary లో ఈ పేరుతో ఫోల్డర్ క్రియేట్ అవుతుంది
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// 4. Schema (Database Model)
const ProjectSchema = new mongoose.Schema({
    title: String,
    category: String,
    imageUrl: String, // Cloudinary URL
    publicId: String, // To delete image from Cloudinary later
    createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', ProjectSchema);

// --- ROUTES ---

// Test Route
app.get('/', (req, res) => {
    res.send("Himagiri Portfolio Backend is Live & Storage is Unlimited! 🚀");
});

// Upload Route
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const newProject = new Project({
            title: req.body.title,
            category: req.body.category,
            imageUrl: req.file.path, // Cloudinary URL
            publicId: req.file.filename
        });

        await newProject.save();
        res.status(200).json({ message: "Upload Successful!", data: newProject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload Failed", error });
    }
});

// Get All Projects Route
app.get('/get-projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// Delete Route
app.delete('/delete/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Cloudinary నుండి ఇమేజ్ డిలీట్ చేయడం
        if (project.publicId) {
            await cloudinary.uploader.destroy(project.publicId);
        }

        // Database నుండి రికార్డ్ డిలీట్ చేయడం
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ error: "Delete Failed" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));