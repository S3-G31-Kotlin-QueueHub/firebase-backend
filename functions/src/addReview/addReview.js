const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const {Timestamp} = admin.firestore;
const db = admin.firestore();
exports.addReview = onRequest(async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).send({error: "Método no permitido. Usa POST."});
  }

  try {
    const {placeId, review} = req.body;

    // Validar los datos de entrada
    if (!placeId || !review) {
      return res.status(400).send({error: "Faltan parámetros placeId o review."});
    }

    const {comment, idUser, score} = review;

    if (!comment || !idUser || typeof score !== "number") {
      return res.status(400).send({error: "Los datos de la reseña son inválidos."});
    }

    const reviewData = {
        comment,
        date: Timestamp.now(), 
        idUser,
        score,
      };
    

    const reviewsDocRef = db.collection("reviews").doc(placeId);

    // Actualizar el array de reseñas
    await db.runTransaction(async (transaction) => {
      const reviewsDoc = await transaction.get(reviewsDocRef);
      if (!reviewsDoc.exists) {

        transaction.set(reviewsDocRef, {
          reviews: [reviewData],
        });
      } else {

        const reviews = reviewsDoc.data().reviews || [];
        reviews.push(reviewData);
        transaction.update(reviewsDocRef, {reviews: reviews});
      }
    });

    return res.status(200).send({message: "Reseña añadida con éxito."});
  } catch (error) {
    console.error("Error al añadir la reseña:", error);
    return res.status(500).send({error: "Error interno del servidor."});
  }
});
