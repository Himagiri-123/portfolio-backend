const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },       // Cloudinary URL
    mediaType: { type: String, required: true }, // 'image' | 'video' | 'project'
    gallery: { type: String, default: "" }, // optional named collection, e.g. "Drawing"
    pinned: { type: Boolean, default: false }, // pinned items are shown first in galleries
    category: { type: String },                  // 'Photography' | 'Videos' | 'Projects'

    // Optional fields used only when category === 'Projects'
    tag: { type: String },            // small label on the card, e.g. "Live Project"
    description: { type: String },
    techStack: { type: String },
    liveLink: { type: String },
    repoLink: { type: String },

    // Only relevant when category === 'Projects': whether this project shows
    // in the homepage "Selected Professional Projects" highlights (top 3).
    featured: { type: Boolean, default: false },

    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', MediaSchema);
