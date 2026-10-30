require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const connectDB = require('./config/db');
const mediaRoutes = require('./routes/media');
const authRoutes = require('./routes/auth');
const aboutRoutes = require('./routes/about');
const skillRoutes = require('./routes/skills');
const settingsRoutes = require('./routes/settings');
const certificateRoutes = require('./routes/certificates');

const app = express();

// Render sits behind a proxy; needed so req.ip is the visitor's address
app.set('trust proxy', 1);

app.use(compression());
app.use(cors());
app.use(express.json());

connectDB();

// Lightweight endpoint used to wake the free Render instance up
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.use(authRoutes);
app.use(mediaRoutes);
app.use(aboutRoutes);
app.use(skillRoutes);
app.use(settingsRoutes);
app.use(certificateRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
