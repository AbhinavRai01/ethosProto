import express from 'express';
import { login } from '../controllers/loginController.js';  

export const router = express.Router();

router.post('/login', login);
