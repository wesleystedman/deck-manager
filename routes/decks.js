const express = require('express');
const router = express.Router();
const decksCtrl = require('../controllers/decks');

router.get('/', decksCtrl.index);
router.get('/new', decksCtrl.new);
router.get('/:id', decksCtrl.show);
router.get('/:id/edit', decksCtrl.edit);
router.post('/', decksCtrl.create);
router.put('/:id', decksCtrl.update);
router.delete('/:id', decksCtrl.delete);

module.exports = router;
