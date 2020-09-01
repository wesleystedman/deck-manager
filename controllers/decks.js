const Deck = require('../models/deck');
const Card = require('../models/card');

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
    // TODO: implement
    res.redirect('/');
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
