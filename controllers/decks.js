const Deck = require('../models/deck');
const Card = require('../models/card');
const DECK_LINE_REGEX = /^\s*((\d+)\s+)?([A-Za-z '’,/-]+?)(\s+\(([A-Za-z0-9]+)\)(\s+(\d+))?)?\s*$/;

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
    const queryFilter = {};
    // search query handling goes here
    if (req.query.userid) {
        queryFilter.owner = req.query.userid;
    }
    // Deck.find(queryFilter)
    res.render('decks/index', { decks: null });
}

function show(req, res) {
    // TODO: implement
    res.render('decks/show');
}

function newDeck(req, res) {
    res.render('decks/new');
}

// TODO: add 'clipboard entry' form handling
function create(req, res) {
    for (let key in req.body) {
        if (req.body[key] === '') delete req.body[key];
    }
    console.log(req.body);
    // process input - convert card names to cards, etc.
    const deck = {};
    const promises = [];
    deck.name = req.body.name;
    if (req.body.format) deck.format = req.body.format.toLowerCase();
    if (req.body.deckTile) {
        const p = validateCardLine(req.body.deckTile);
        promises.push(p);
        p.then(cQPair => { deck.deckTile = cQPair.card })
            .catch(err => { console.log(err, 'deckTile') });
    }
    if (req.body.companion) {
        const p = validateCardLine(req.body.companion);
        promises.push(p);
        p.then(cQPair => { deck.companion = cQPair.card })
            .catch(err => { console.log(err, 'companion') });
    }
    for (const prop of ['commandZone', 'mainDeck', 'sideboard', 'maybeboard']) {
        if (req.body[prop]) {
            deck[prop] = [];
            const lines = req.body[prop].split('\r\n');
            lines.forEach(line => {
                if (line !== '') {
                    const p = validateCardLine(line);
                    promises.push(p);
                    p.then(cQPair => { deck[prop].push(cQPair) })
                        .catch(err => { console.log(err, prop) });
                }
            });
        }
    }
    // TODO: ignore /^Card not found:/ rejections?
    Promise.all(promises)
        .then(() => {
            console.log('Validation successful!', deck);
            // add new deck to DB
            deck.owner = req.user._id;
            const newDeck = new Deck(deck);
            newDeck.save()
                // .then(() => {
                //     req.user.decks.push(newDeck._id);
                //     return req.user.save();
                // })
                .then(() => {
                    res.redirect(`/decks?userid=${req.user.id}`);
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/decks/new');
                });
        })
        .catch(err => {
            console.log('Validation failed!', err);
            // send user back to the form
            //  - with values intact
            //  - with messaging regarding errors
            res.redirect('/decks/new');
        });
}

function edit(req, res) {
    // TODO: implement
    res.render('decks/edit');
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
    // console.log('matches', matches);
    const filterQuery = {};
    filterQuery.name = new RegExp(matches[3], 'i');
    // console.log(filterQuery.name);
    if (matches[5]) filterQuery.set = new RegExp(matches[5], 'i');
    if (matches[7]) filterQuery.collector_number = matches[7];
    // console.log('filterQuery', filterQuery);
    return new Promise((resolve, reject) => {
        Card.findOne(filterQuery, (err, card) => {
            if (err) reject(err);
            if (!card) {
                reject(`Card not found: ${filterQuery.name}${filterQuery.set ? ` ${filterQuery.set}` : ''}${filterQuery.collector_number ? ` ${filterQuery.collector_number}` : ''}`);
            } else {
                resolve({
                    quantity: matches[2] ? parseInt(matches[2], 10) : 1,
                    card: card._id
                });
            }
        });
    });
}
