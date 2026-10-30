const mongoose = require('mongoose');

// One document holding the editable homepage texts (hero, contact, footer).
// An empty value means "use the text written in index.html".
const SiteSettingsSchema = new mongoose.Schema({
    heroGreeting: String,
    heroName: String,
    typingWords: [String],
    heroBullets: [String],
    contactIntro: String,
    email: String,
    location: String,
    linkedin: String,
    github: String,
    instagram: String,
    footerName: String,
    footerRole: String,
}, { minimize: false });

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
