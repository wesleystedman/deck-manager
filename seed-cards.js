require('dotenv').config();
require('./config/database');
const fs = require('fs');
const request = require('request-promise-native');
const Card = require('./models/card');
let mtgaCardData;
const SCRYFALL_REQUEST_URI = 'https://api.scryfall.com/cards/search?format=json&include_extras=false&include_multilingual=false&order=name&unique=prints&q=is%3Aarenaid';
let pageCount = 0;

function parseScryfall(uri) {
    request(uri)
        .then(results => {
            const dataPage = JSON.parse(results);
            dataPage.data.forEach(card => {
                // rename id to scryfall_id and delete id, so that the virtual getter is not interfered with
                card.scryfall_id = card.id;
                delete card.id;

                // TODO: Apply set and cn fixes
                // skip ogw and pdom, they shouldn't be in here
                if (card.set.match(/^(ogw|pdom)$/)) {
                    console.log(card.set);
                    return;
                }

                // s/ajmp/jmp/ - cn is fine
                card.set = card.set.replace(/^ajmp$/, 'jmp');
                // s/dom/dar/ - cn is fine
                card.set = card.set.replace(/^dom$/, 'dar');

                // /ha\d|pana/
                if (card.set.match(/^(ha\d|pana)$/)) {
                    const mtgaCard = mtgaCardData.find(mtgaCard => mtgaCard.grpid === card.arena_id);
                    card.set = mtgaCard.set.toLowerCase();
                    card.collector_number = mtgaCard.collectorNumber;
                    console.log(card.set, card.collector_number);
                }

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

fs.readFile('./mtga_card_data.json', 'UTF-8', (err, data) => {
    if (err) return console.log(err);
    mtgaCardData = JSON.parse(data);
    parseScryfall(SCRYFALL_REQUEST_URI);
});
