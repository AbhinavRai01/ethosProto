const { searchEntitiesByName, searchEntityByFaceId, searchEntityByCardId, searchEntityByHashId } = require('../controllers/searchController');

const express = require('express');
const router = express.Router();

// Route to search entities by name
router.get('/name/:query/:page', searchEntitiesByName);
router.get('/face/:faceId/:page', searchEntityByFaceId);
router.get('/card/:cardId/:page', searchEntityByCardId);
router.get('/hash/:hashId/:page', searchEntityByHashId);

module.exports = router;