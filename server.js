require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const connectDB = require('./config/db');
const mediaRoutes = require('./routes/media');
const authRoutes = require('./routes/auth');

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

connectDB();

// Lightweight endpoint used to wake the free Render instance up
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.use(authRoutes);
app.use(mediaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
