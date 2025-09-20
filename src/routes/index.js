import express from 'express';
import analyzeImageRoute from './analyze-image.js';

const appRoute = express.Router();

appRoute.use('/open-ai/ocr', analyzeImageRoute);

export default appRoute;
