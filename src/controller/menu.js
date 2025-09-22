import { db } from "../configs/firebase.js";

export const saveMenu = async (req, res, next) => {
  try {
    const data = req.body;
    const docRef = await db.collection('order').add({
      ...data,
      createdAt: new Date(),
    });
 
    res.status(201).json({
      message:'Order successfully!',
      id: docRef.id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
    next();
  }
};

// GET /menus/:id
export const getMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('order').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next();
  }
};

// PUT /menus/:id
export const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.collection('order').doc(id).update({
      ...req.body,
      updatedAt: new Date(),
    });
    res.json({ message: 'Menu updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next();
  }
};

// DELETE /menus/:id
export const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.collection('order').doc(id).delete();
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next();
  }
};

