const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true }, // Image URL
    mediaType: { type: String, required: true }, // image, video, or project
    category: { type: String }, // Photography, Videos, Projects
    
    // Projects కోసం స్పెషల్ ఫీల్డ్స్ (Optional)
    description: { type: String },
    techStack: { type: String }, // React, Node, etc.
    liveLink: { type: String },
    repoLink: { type: String },

    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', MediaSchema);