const express = require('express');
const Media = require('../models/Media');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Save media metadata after the file has already been uploaded to Cloudinary
// (the admin dashboard uploads the file directly to Cloudinary, then calls this)
router.post('/api/upload-media', async (req, res) => {
    try {
        const { title, url, category, mediaType, description, techStack, liveLink, repoLink, featured } = req.body;
        const newMedia = new Media({ title, url, category, mediaType, description, techStack, liveLink, repoLink, featured });
        await newMedia.save();
        res.status(201).json({ message: 'Saved Successfully!', data: newMedia });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all media, newest first
router.get('/api/get-media', async (req, res) => {
    try {
        const media = await Media.find().sort({ uploadedAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an existing media/project item's details (title, description, etc.)
// - does not touch the file itself, only the metadata stored in Mongo.
router.put('/api/update-media/:id', async (req, res) => {
    try {
        const allowedFields = ['title', 'description', 'techStack', 'liveLink', 'repoLink', 'featured'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        const updated = await Media.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updated) return res.status(404).json({ message: 'Not found' });

        res.json({ message: 'Updated Successfully!', data: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a media item (this route was missing before, even though the
// admin dashboard already calls it)
router.delete('/api/delete-media/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ message: 'Not found' });

        // Best-effort Cloudinary cleanup: derive the public_id from the URL
        const match = media.url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
        if (match) {
            const resourceType = media.mediaType === 'video' ? 'video' : 'image';
            await cloudinary.uploader.destroy(match[1], { resource_type: resourceType }).catch(() => {});
        }

        await Media.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
