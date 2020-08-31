const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Colors, URIs, and UUIDs are Strings w/ extra restrictions.
// Because I trust the incoming data, I won't make all the extra types (for now).

// const colorSchema = new Schema({
//     color: {
//         type: String,
//         enum: ['W','U','B','R','G']
//     }
// });

const cardFaceSchema = new Schema({
    artist: String,
    color_indicator: [String],
    colors: [String],
    flavor_text: String,
    illustration_id: String, // UUID
    image_uris: Object,
    loyalty: String,
    mana_cost: String,
    name: String,
    oracle_text: String,
    power: String,
    toughness: String,
    type_line: String,
    watermark: String
});

const cardSchema = new Schema({
    arena_id: Number,
    scryfall_id: String, // UUID
    lang: String,
    oracle_id: String, // UUID
    prints_search_uri: String, // URI
    rulings_uri: String, // URI
    scryfall_uri: String, // URI
    uri: String, // URI
    card_faces: [cardFaceSchema],
    cmc: Number,
    color_identity: [String],
    color_indicator: [String],
    colors: [String],
    keywords: [String],
    layout: String,
    legalities: Object,
    loyalty: String,
    mana_cost: String,
    name: String,
    oracle_text: String,
    power: String,
    toughness: String,
    type_line: String,
    artist: String,
    booster: Boolean,
    collector_number: String,
    digital: Boolean,
    flavor_name: String,
    flavor_text: String,
    frame_effects: [String],
    highres_image: Boolean,
    illustration_id: String, // UUID
    image_uris: Object,
    rarity: String,
    released_at: Date,
    reprint: Boolean,
    scryfall_set_uri: String, // URI
    set_name: String,
    set_search_uri: String, // URI
    set_type: String,
    set_uri: String, // URI
    set: String,
    story_spotlight: Boolean,
    watermark: String
});

module.exports = mongoose.model('Card', cardSchema);
