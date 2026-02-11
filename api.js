const express = require('express');
const Media = require('../models/Media');
const router = express.Router();

router.post('/api/upload-media', async (req, res) => {
    try {
        const { title, url, category, mediaType } = req.body;
        const newMedia = new Media({ title, url, category, mediaType });
        await newMedia.save();
        res.status(201).json({ message: "Saved Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/get-media', async (req, res) => {
    try {
        const photos = await Media.find().sort({ uploadedAt: -1 });
        res.json(photos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;