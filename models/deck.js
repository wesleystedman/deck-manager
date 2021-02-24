const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardQuantitySchema = new Schema({
    quantity: Number,
    card: {type: Schema.Types.ObjectId, ref: 'Card'}
});

const deckSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    name: String,
    mtgaId: String,
    format: String,
    colors: [String],
    deckTile: {type: Schema.Types.ObjectId, ref: 'Card'},
    companion: {type: Schema.Types.ObjectId, ref: 'Card'},
    commandZone: [cardQuantitySchema],
    mainDeck: [cardQuantitySchema],
    sideboard: [cardQuantitySchema],
    maybeboard: [cardQuantitySchema],
    lastUpdated: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Deck', deckSchema);
