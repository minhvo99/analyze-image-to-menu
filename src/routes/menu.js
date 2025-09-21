import express from 'express';
import {
  saveMenu,
  getMenu,
  updateMenu,
  deleteMenu
} from '../controller/menu.js';

const menuRoute = express.Router();



menuRoute.post('/order', saveMenu);
menuRoute.get('/order/:id', getMenu);
menuRoute.put('/order/:id', updateMenu);
menuRoute.delete('/order/:id', deleteMenu);

export default menuRoute;
