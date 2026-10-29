const mongoose = require('mongoose');

// A card in the homepage "Technical Core" or "Creative Vision" slider
const SkillCardSchema = new mongoose.Schema({
    section: { type: String, enum: ['technical', 'creative'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-star' }, // Font Awesome classes
    linkText: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
});

module.exports = mongoose.model('SkillCard', SkillCardSchema);
