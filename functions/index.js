// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const {logger} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

// Importar funciones desde el archivo separado
const { getCollectionData } = require("./src/users/getUsers");
const { onNewTurn } = require("./src/triggers/onNewTurn")
const { manageQueue } = require("./src/queues/manageQueue")
const { updateLestTimeLastHour } = require("./src/places/updateLestTimeLastHour")
const { onNewReview } = require("./src/triggers/onNewReview")
const { addReview } = require("./src/addReview/addReview")
// Exportar las funciones
exports.getCollectionData = getCollectionData;
exports.onNewTurn = onNewTurn;
exports.manageQueue = manageQueue;
exports.updateLestTimeLastHour = updateLestTimeLastHour;
exports.onNewReview = onNewReview;
exports.addReview = addReview;