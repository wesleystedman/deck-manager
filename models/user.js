const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    googleId: String,
    // decks: [{type: Schema.Types.ObjectId, ref: 'Deck'}]
}, {
    timestamps:true
});

module.exports = mongoose.model('User', userSchema);
