const express = require('express');
const router = express.Router();
const decksCtrl = require('../controllers/decks');

router.get('/', decksCtrl.index);
router.get('/new', isLoggedIn, decksCtrl.new);
router.get('/:id', decksCtrl.show);
router.get('/:id/edit', isLoggedIn, decksCtrl.edit);
router.post('/', isLoggedIn, decksCtrl.create);
router.put('/:id', isLoggedIn, decksCtrl.update);
router.delete('/:id', isLoggedIn, decksCtrl.delete);

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/google');
}

module.exports = router;
