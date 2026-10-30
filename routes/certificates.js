const express = require('express');
const Certificate = require('../models/Certificate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const FIELDS = ['group', 'title', 'description', 'icon', 'url', 'order'];

function pick(body) {
    const data = {};
    for (const field of FIELDS) if (body[field] !== undefined) data[field] = body[field];
    return data;
}

router.get('/api/certificates', async (req, res) => {
    try {
        const certificates = await Certificate.find().sort({ order: 1, _id: 1 }).lean();
        res.set('Cache-Control', 'public, max-age=30');
        res.json(certificates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/certificates', requireAuth, async (req, res) => {
    try {
        const data = pick(req.body);
        if (data.order === undefined) {
            const last = await Certificate.findOne({ group: data.group }).sort({ order: -1 });
            data.order = last ? last.order + 1 : 0;
        }
        res.status(201).json(await Certificate.create(data));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Used by the dashboard's "Import" button; keeps the given order per group
router.post('/api/certificates/bulk', requireAuth, async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Expected a non-empty array' });
        const counters = {};
        const items = req.body.map((item) => {
            const data = pick(item);
            counters[data.group] = (counters[data.group] || 0) + 1;
            return { ...data, order: counters[data.group] - 1 };
        });
        res.status(201).json(await Certificate.insertMany(items));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/api/certificates/:id', requireAuth, async (req, res) => {
    try {
        const updated = await Certificate.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/api/certificates/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await Certificate.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
