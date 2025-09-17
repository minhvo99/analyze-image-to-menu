import express from 'express';
import { visionORC, uploadSingle } from '../controller/vision-orc.js';

const analyzeImageRoute = express.Router();

analyzeImageRoute.post('/', uploadSingle('image'), visionORC);

export default analyzeImageRoute;
