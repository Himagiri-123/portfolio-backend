const express = require('express');
const Media = require('../models/Media');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Best-effort Cloudinary cleanup: derive the public_id from the stored URL
async function destroyCloudinaryAsset(media) {
    const match = media.url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) return;
    const resourceType = media.mediaType === 'video' ? 'video' : 'image';
    await cloudinary.uploader.destroy(match[1], { resource_type: resourceType }).catch(() => {});
}

// Saves metadata for a file the dashboard already uploaded to Cloudinary
router.post('/api/upload-media', async (req, res) => {
    try {
        const { title, url, category, gallery, mediaType, tag, description, techStack, liveLink, repoLink, featured } = req.body;

        // The About photo is a single item: a new upload replaces the old one
        if (category === 'About') {
            const oldItems = await Media.find({ category: 'About' });
            for (const old of oldItems) {
                await destroyCloudinaryAsset(old);
                await Media.findByIdAndDelete(old._id);
            }
        }

        const newMedia = new Media({ title, url, category, gallery, mediaType, tag, description, techStack, liveLink, repoLink, featured });
        await newMedia.save();
        res.status(201).json({ message: 'Saved Successfully!', data: newMedia });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all media, newest first
router.get('/api/get-media', async (req, res) => {
    try {
        const media = await Media.find().sort({ uploadedAt: -1 }).lean();
        res.set('Cache-Control', 'public, max-age=30');
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update text fields only; the uploaded file itself is untouched
router.put('/api/update-media/:id', async (req, res) => {
    try {
        const allowedFields = ['title', 'gallery', 'pinned', 'tag', 'description', 'techStack', 'liveLink', 'repoLink', 'featured'];
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

// Delete a media item
router.delete('/api/delete-media/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ message: 'Not found' });

        await destroyCloudinaryAsset(media);
        await Media.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
