import express from 'express';
import { getPublicStats, getDetailedStats } from '../controller/statsController.js';
import verifyJWT from '../middleware/auth.js';

const statsRouter = express.Router();


statsRouter.get('/public', getPublicStats);


statsRouter.get('/admin', verifyJWT, getDetailedStats);

export default statsRouter;
