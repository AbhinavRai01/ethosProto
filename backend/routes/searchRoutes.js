const { searchEntitiesByName, searchEntityByFaceId, searchEntityByCardId } = require('../controllers/searchController');

const express = require('express');
const router = express.Router();

// Route to search entities by name
router.get('/name/:query/:page', searchEntitiesByName);
router.get('/face/:faceId/:page', searchEntityByFaceId);
router.get('/card/:cardId/:page', searchEntityByCardId);

module.exports = router;