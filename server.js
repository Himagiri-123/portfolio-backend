require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const mediaRoutes = require('./routes/media');
const authRoutes = require('./routes/auth');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database ---
connectDB();

// --- Static frontend (index.html, css, js, images, certificates) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API routes ---
app.use(authRoutes);
app.use(mediaRoutes);

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
