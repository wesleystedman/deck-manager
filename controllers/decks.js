const Deck = require('../models/deck');
const Card = require('../models/card');
const DECK_LINE_REGEX = /^\s*((\d+)\s*)?([A-Za-z '’,/-]+)(\s*\(([A-Za-z0-9]+)\)(\s*(\d+))?)?\s*$/;

module.exports = {
    index,
    show,
    new: newDeck,
    create,
    edit,
    update,
    delete: deleteDeck
}

function index(req, res) {
    // TODO: implement
    res.redirect('/');
}

function show(req, res) {
    // TODO: implement
    res.redirect('/');
}

function newDeck(req, res) {
    res.render('decks/new');
}

function create(req, res) {
    for (let key in req.body) {
        if (req.body[key] === '') delete req.body[key];
    }
    console.log(req.body);
    // process input - convert card names to cards, etc.
    const deck = {};
    const promises = [];
    deck.name = req.body.name;
    deck.format = req.body.format.toLowerCase();
    if (req.body.deckTile) {
        const p = validateCardLine(req.body.deckTile);
        promises.push(p);
        p.then(cQPair => { deck.deckTile = cQPair })
            .catch(err => { console.log(err, 'deckTile') });
    }
    if (req.body.companion) {
        const p = validateCardLine(req.body.companion);
        promises.push(p);
        p.then(cQPair => { deck.companion = cQPair })
            .catch(err => { console.log(err, 'companion') });
    }
    for (const prop of ['commandZone', 'mainDeck', 'sideboard', 'maybeboard']) {
        if (req.body[prop]) {
            deck[prop] = [];
            const lines = req.body[prop].split('\r\n');
            lines.forEach(line => {
                const p = validateCardLine(line);
                promises.push(p);
                p.then(cQPair => { deck[prop].push(cQPair) })
                    .catch(err => { console.log(err, prop) });
            });
        }
    }
    // add new deck to DB
    Promise.all(promises)
        .then(() => {
            console.log('reached end of validation', deck);

        })
        .catch(err => {
            // send user back to the form 
            //  - with values intact
            //  - with messaging regarding errors
        })
}

function edit(req, res) {
    // TODO: implement
    res.redirect('/');
}

function update(req, res) {
    // TODO: implement
    res.redirect('/');
}

function deleteDeck(req, res) {
    // TODO: implement
    res.redirect('/');
}

// accepts a MTGA import/export format string
// returns a cardQuantitySchema-compatible object if the specified card exists
// returns null if format is wrong or card does not exist
function validateCardLine(line) {
    const matches = line.match(DECK_LINE_REGEX);
    if (!matches) return new Promise((resolve, reject) => { reject(`Wrong line format: ${line}`) });

    const filterQuery = {};
    filterQuery.name = matches[3];
    if (matches[5]) filterQuery.set = matches[5];
    if (matches[7]) filterQuery.collector_number = matches[7];

    return new Promise((resolve, reject) => {
        Card.findOne(filterQuery, (err, card) => {
            if (err) reject(err);
            resolve({
                quantity: matches[2] ? parseInt(matches[2], 10) : 1,
                card: card._id
            });
        });

    });
}
