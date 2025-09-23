import admin from 'firebase-admin';

import {firebaseConfig} from './serviceAccountKey.js';

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  storageBucket: firebaseConfig.project_id,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

export const uploadToFirebase = async (file) => {  
  const filename = `menus/${Date.now()}-${file.originalname}`;
  const fileRef = bucket.file(filename);

  await fileRef.save(file.buffer, {
    contentType: file.mimetype,
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}


export { admin, db, bucket };
