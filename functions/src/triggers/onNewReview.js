const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const logger = require("firebase-functions/logger");
const onNewReview = functions.firestore
    .onDocumentWritten("reviews/{placeId}", async (event) => {
        const placeId = event.params.placeId;
        const snapshot = event.data.after;
    
        
        if (!snapshot.exists) {
            logger.log(`El documento de reseñas para el lugar ${placeId} fue eliminado.`);
            return;
        }
    
        const reviewsData = snapshot.data().reviews;
        
       
        if (!reviewsData || reviewsData.length === 0) {
            logger.warn(`No hay reseñas en el documento ${placeId}`);
            return;
        }
    
        
        const totalScore = reviewsData.reduce((sum, review) => sum + review.score, 0);
        const averageScore = totalScore / reviewsData.length;
    
        
        try {
            await db.collection("places").doc(placeId).update({
                averageScoreReview: averageScore
            });
            logger.info(`Puntuación actualizada para el lugar ${placeId}: ${averageScore}`);
        } catch (error) {
            logger.error(`Error al actualizar la puntuación del lugar ${placeId}: ${error.message}`);
            throw new Error(`No se pudo actualizar el lugar: ${error.message}`);
        }
});

module.exports = { onNewReview };