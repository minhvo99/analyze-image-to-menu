import express from 'express';
import {
  openAIORC,
  uploadSingle,
} from '../controller/vision-orc.js';

const analyzeImageRoute = express.Router();


analyzeImageRoute.post('/analyze-image', uploadSingle('image'), openAIORC);

export default analyzeImageRoute;
