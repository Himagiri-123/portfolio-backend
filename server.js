const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- STEP 1: Port Configuration for Deployment ---
// Render సర్వర్ ఆటోమేటిక్ గా ఒక Port ఇస్తుంది (process.env.PORT). 
// అది లేకపోతే 5000 వాడుకుంటుంది.
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- STEP 2: MongoDB Atlas Connection ---
mongoose.connect('mongodb+srv://himagiri:444624474@cluster0.abquzqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('✅ MongoDB Connected to Cloud!'))
.catch(err => console.error('❌ Connection Error:', err));

// --- STEP 3: Updated Schema (Projects వివరాలు కూడా సేవ్ అవ్వాలి) ---
const MediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    mediaType: { type: String, required: true },
    category: { type: String, default: 'General' },
    
    // Projects కోసం కొత్తగా యాడ్ చేసినవి (ఇవి లేకపోతే ప్రాజెక్ట్ వివరాలు సేవ్ కావు)
    description: { type: String },
    techStack: { type: String },
    liveLink: { type: String },
    repoLink: { type: String },

    uploadedAt: { type: Date, default: Date.now }
});

const Media = mongoose.model('Media', MediaSchema);

// --- STEP 4: Upload Route (Updated) ---
app.post('/api/upload-media', async (req, res) => {
    try {
        console.log("📥 Data Received:", req.body);

        // Frontend నుంచి వచ్చే అన్ని వివరాలను తీసుకుంటున్నాం
        const { title, url, mediaType, category, description, techStack, liveLink, repoLink } = req.body;

        if (!title || !url || !mediaType) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMedia = new Media({
            title,
            url,
            mediaType,
            category: category || "Photography",
            description, // Project Description
            techStack,   // Project Tech Stack
            liveLink,    // Project Live Link
            repoLink     // Project GitHub Link
        });

        const savedMedia = await newMedia.save();
        console.log("✅ Saved to Database:", savedMedia);

        res.status(201).json({ message: "Saved Successfully!", data: savedMedia });

    } catch (err) {
        console.error("❌ Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- STEP 5: Get Route ---
app.get('/api/get-media', async (req, res) => {
    try {
        const media = await Media.find().sort({ uploadedAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STEP 6: Delete Route ---
app.delete('/api/delete-media/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Media.findByIdAndDelete(id);
        res.json({ message: "Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STEP 7: Start Server (Updated for Render) ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});