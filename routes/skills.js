const express = require('express');
const SkillCard = require('../models/SkillCard');

const router = express.Router();
const FIELDS = ['section', 'title', 'description', 'icon', 'linkText', 'linkUrl', 'order'];

function pick(body) {
    const data = {};
    for (const field of FIELDS) if (body[field] !== undefined) data[field] = body[field];
    return data;
}

router.get('/api/skill-cards', async (req, res) => {
    try {
        const cards = await SkillCard.find().sort({ order: 1, _id: 1 }).lean();
        res.set('Cache-Control', 'public, max-age=30');
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/skill-cards', async (req, res) => {
    try {
        const data = pick(req.body);
        if (data.order === undefined) {
            const last = await SkillCard.findOne({ section: data.section }).sort({ order: -1 });
            data.order = last ? last.order + 1 : 0;
        }
        res.status(201).json(await SkillCard.create(data));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Used by the dashboard's "Import" buttons; keeps the given order per section
router.post('/api/skill-cards/bulk', async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Expected a non-empty array' });
        const counters = {};
        const cards = req.body.map((card) => {
            const data = pick(card);
            counters[data.section] = (counters[data.section] || 0) + 1;
            return { ...data, order: counters[data.section] - 1 };
        });
        res.status(201).json(await SkillCard.insertMany(cards));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/api/skill-cards/:id', async (req, res) => {
    try {
        const updated = await SkillCard.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/api/skill-cards/:id', async (req, res) => {
    try {
        const deleted = await SkillCard.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
