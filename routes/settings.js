const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const FIELDS = Object.keys(SiteSettings.schema.paths).filter((key) => !key.startsWith('_'));

router.get('/api/settings', async (req, res) => {
    try {
        const settings = await SiteSettings.findOne().lean();
        res.set('Cache-Control', 'public, max-age=30');
        res.json(settings || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Updates only the fields that are sent
router.put('/api/settings', requireAuth, async (req, res) => {
    try {
        const updates = {};
        for (const field of FIELDS) if (req.body[field] !== undefined) updates[field] = req.body[field];

        const settings = await SiteSettings.findOneAndUpdate({}, { $set: updates }, { new: true, upsert: true, runValidators: true });
        res.json(settings);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
