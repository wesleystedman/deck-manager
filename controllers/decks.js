const Deck = require('../models/deck');
const Card = require('../models/card');
const card = require('../models/card');
// Matches an extension of MTGA import/export format - quantity is always optional, and set code may be used w/o collector number.
// $2 = quantity, $3 = card name, $5 = set code, $7 = collector number
const DECK_LINE_REGEX = /^\s*((\d+)\s+)?([A-Za-z '’,/-]+?)(\s+\(([A-Za-z0-9]+)\)(\s+([\dA-Za-z]+))?)?\s*$/;
// Matches the type_line parameter of a Scryfall card object.  This will match every black-bordered type as of M21.
// $1 = first half full type line, $2 = supertype and type, $3 = subtype, 
// $6 = second half full type line, $7 = supertype and type, $8 = subtype
const TYPE_LINE_REGEX = /^(([A-Za-z -]+)( — ([A-Za-z '-]+))?)( \/\/ (([A-Za-z -]+)( — ([A-Za-z '-]+))?))?$/;

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
    Deck.find(queryFilter).sort({ updatedAt: 'desc' }).populate('owner').populate('deckTile').exec()
        .then(decks => {
            // console.log(decks);
            res.render('decks/index', { decks });
        })
        .catch(err => {
            console.log(err);
            res.render('decks/index', { decks: null });
        });
}

function show(req, res) {
    Deck.findById(req.params.id).populate('owner').populate('deckTile').populate('companion')
        .then(deck => {
            for (const prop of ['commandZone', 'mainDeck', 'sideboard', 'maybeboard']) {
                if (deck[prop]) deck.populate(`${prop}.card`);
            }
            deck.execPopulate()
                .then(deck => {
                    // console.log(deck);
                    const companionData = {};
                    if (deck.companion) {
                        companionData.name = deck.companion.name;
                        companionData.set = deck.companion.set;
                        companionData.mana_cost = deck.companion.mana_cost;
                    }

                    const commanderData = [];
                    deck.commandZone.forEach(cQPair => {
                        // assuming only one copy, since that's currently 100% of practical cases
                        commanderData.push({
                            name: cQPair.card.name,
                            set: cQPair.card.set,
                            mana_cost: cQPair.card.mana_cost
                        });
                    });

                    const deckData = {
                        mainDeck: {},
                        sideboard: {},
                        maybeboard: {}
                    };
                    for (const prop of ['mainDeck', 'sideboard', 'maybeboard']) {
                        deck[prop].forEach(cQPair => {
                            const types = cQPair.card.type_line.match(TYPE_LINE_REGEX);
                            const regularTypes = types[2].replace(/(Basic|Legendary|Snow|World|Tribal) /g, '');
                            // group multi-type cards based on their primary type
                            const primaryType = regularTypes.includes('Creature')
                                ? 'Creature'
                                : regularTypes.includes('Land')
                                    ? 'Land'
                                    : regularTypes.includes('Enchantment')
                                        ? 'Enchantment'
                                        : regularTypes.split(' ')[0];
                            const cardData = {
                                quantity: cQPair.quantity,
                                name: cQPair.card.name,
                                // set: cQPair.card.set,
                                mana_cost: cQPair.card.mana_cost,
                                cmc: cQPair.card.cmc
                            };
                            if (!deckData[prop][primaryType]) deckData[prop][primaryType] = [];
                            deckData[prop][primaryType].push(cardData);
                        });
                        for (const type of Object.keys(deckData[prop])) {
                            deckData[prop][type]
                                .sort((a, b) => a.name.localeCompare(b.name, 'en-US'))
                                .sort((a, b) => a.cmc - b.cmc);
                        }
                    }

                    res.render('decks/show', {
                        deck,
                        companionData: Object.keys(companionData).length ? companionData : null, // card detail object
                        commanderData: commanderData.length ? commanderData : null, // array of card detail objects
                        deckData // object of dict of card type -> array of sorted card detail objects
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/');
                })
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        })
}

function newDeck(req, res) {
    res.render('decks/new');
}

// TODO: add 'clipboard entry' form handling
// TODO: add deck cloning handling
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
    Deck.findById(req.params.id)
    .then(deck => {
        if (!deck.owner.equals(req.user._id)) return res.redirect(`/decks/${req.params.id}`);
        Deck.findByIdAndDelete(req.params.id)
        .then(() => {
            res.redirect(`/decks/?userid=${req.user.id}`);
        })
        .catch(err => {
            res.redirect(`/decks/${req.params.id}`)
        })

    })
    .catch(err => {
        console.log(err);
        res.redirect(`/decks/${req.params.id}`);
    })
}

// accepts a MTGA import/export format string
// returns a cardQuantitySchema-compatible object if the specified card exists
// returns null if format is wrong or card does not exist
function validateCardLine(line) {
    const matches = line.match(DECK_LINE_REGEX);
    if (!matches) return new Promise((resolve, reject) => { reject(`Wrong line format: ${line}`) });
    // console.log('matches', matches);
    const filterQuery = {};
    // Aftermath cards export with ///, but can import with //
    // Slashes must, of course, be escaped
    // Scryfall stores adventure and transform card names with //, but arena only exports the first part, and can import with both parts
    filterQuery.name = new RegExp(`^${matches[3].replace('///', '//').replace('/', '\\/')}($| // )`, 'i');
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
