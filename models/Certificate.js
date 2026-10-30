const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    group: { type: String, required: true }, // "frontend", "backend" or any new group name
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-certificate' }, // Font Awesome classes
    url: { type: String, default: '' },                    // PDF or page address
    order: { type: Number, default: 0 },
});

module.exports = mongoose.model('Certificate', CertificateSchema);
