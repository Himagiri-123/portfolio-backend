const express = require('express');
const AboutBlock = require('../models/AboutBlock');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const FIELDS = ['kind', 'label', 'text', 'order'];

function pick(body) {
    const data = {};
    for (const field of FIELDS) if (body[field] !== undefined) data[field] = body[field];
    return data;
}

router.get('/api/about-blocks', async (req, res) => {
    try {
        const blocks = await AboutBlock.find().sort({ order: 1, _id: 1 }).lean();
        res.set('Cache-Control', 'public, max-age=30');
        res.json(blocks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/about-blocks', requireAuth, async (req, res) => {
    try {
        const data = pick(req.body);
        if (data.order === undefined) {
            const last = await AboutBlock.findOne().sort({ order: -1 });
            data.order = last ? last.order + 1 : 0;
        }
        res.status(201).json(await AboutBlock.create(data));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Used by the dashboard's "Import current content" button
router.post('/api/about-blocks/bulk', requireAuth, async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Expected a non-empty array' });
        const blocks = req.body.map((block, index) => ({ ...pick(block), order: index }));
        res.status(201).json(await AboutBlock.insertMany(blocks));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/api/about-blocks/:id', requireAuth, async (req, res) => {
    try {
        const updated = await AboutBlock.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/api/about-blocks/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await AboutBlock.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
