const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

// Función para obtener datos de una colección
const getCollectionData = functions.https.onRequest(async (req, res) => {
  try {
    const collectionRef = db.collection('users');
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      return res.status(404).send('No documents found');
    }

    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error getting documents: ", error);
    return res.status(500).send('Error retrieving collection');
  }
});

module.exports = { getCollectionData };
