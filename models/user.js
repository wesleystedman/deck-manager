const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    googleId: String,
    // decks: [{type: Schema.Types.ObjectId, ref: 'Deck'}]
});

module.exports = mongoose.model('User', userSchema);
