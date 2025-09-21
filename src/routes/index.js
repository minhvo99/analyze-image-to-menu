import express from 'express';
import analyzeImageRoute from './analyze-image.js';
import menuRoute from './menu.js';

const appRoute = express.Router();

appRoute.use('/order-now/ocr', analyzeImageRoute);
appRoute.use('/order-now/menu', menuRoute);

export default appRoute;
