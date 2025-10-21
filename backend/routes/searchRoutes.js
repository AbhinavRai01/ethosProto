import { searchEntitiesByName, searchEntityByFaceId, searchEntityByCardId, searchEntityByHashId } from '../controllers/searchController.js';
import express from 'express';
export const router = express.Router();

// Route to search entities by name
router.get('/name/:query/:page', searchEntitiesByName);
router.get('/face/:faceId/:page', searchEntityByFaceId);
router.get('/card/:cardId/:page', searchEntityByCardId);
router.get('/hash/:hashId/:page', searchEntityByHashId);