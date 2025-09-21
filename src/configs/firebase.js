import admin from 'firebase-admin';

import {firebaseConfig} from './serviceAccountKey.js';

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const db = admin.firestore();

export { admin, db };
