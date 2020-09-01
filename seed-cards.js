require('dotenv').config();
require('./config/database');
const request = require('request-promise-native');
const Card = require('./models/card');
const SCRYFALL_REQUEST_URI = 'https://api.scryfall.com/cards/search?format=json&include_extras=false&include_multilingual=false&order=name&q=is%3Aarenaid&unique=prints'
let pageCount = 0;

function parseScryfall(uri) {
    request(uri)
        .then(results => {
            const dataPage = JSON.parse(results);
            dataPage.data.forEach(card => {
                // rename id to scryfall_id and delete id, so that the virtual getter is not interfered with
                card.scryfall_id = card.id;
                delete card.id;
                // findOneAndUpdate w/ upsert: true finds a card doc if it exists, and creates one if it doesn't, massively simplifying the logic here.
                Card.findOneAndUpdate({ scryfall_id: `${card.scryfall_id}` }, card, { upsert: true }, (err, doc) => {
                    if (err) console.log(err);
                });
            });
            console.log(`Processed page ${++pageCount} of ${Math.ceil(dataPage.total_cards / 175)}`);
            if (dataPage.has_more) {
                setTimeout(() => {
                    parseScryfall(dataPage.next_page);
                }, 100);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

parseScryfall(SCRYFALL_REQUEST_URI);
