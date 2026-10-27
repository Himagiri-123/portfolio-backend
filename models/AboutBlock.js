const mongoose = require('mongoose');

// One editable piece of the homepage About section
const AboutBlockSchema = new mongoose.Schema({
    kind: { type: String, enum: ['heading', 'paragraph', 'stat'], required: true },
    label: { type: String, default: '' },  // stat cards only, e.g. "Role:"
    text: { type: String, required: true }, // paragraph text, heading text, or stat value
    order: { type: Number, default: 0 },
});

module.exports = mongoose.model('AboutBlock', AboutBlockSchema);
