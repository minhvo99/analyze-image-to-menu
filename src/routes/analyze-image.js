import express from 'express';
import {
  visionORC,
  uploadSingle,
  analyzeImage,
} from '../controller/vision-orc.js';

const analyzeImageRoute = express.Router();

analyzeImageRoute.post('/', uploadSingle('image'), visionORC);
analyzeImageRoute.post('/analyze-image', uploadSingle('image'), analyzeImage);

export default analyzeImageRoute;
