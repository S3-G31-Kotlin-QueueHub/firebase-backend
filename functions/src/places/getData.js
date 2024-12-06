const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const db = admin.firestore();

const getData = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const infoRef = db.collection('info').doc('wayToJoin');
        const recommendedLastHourRef = db.collection('recommendedPlaces').doc('lestTimeLastHour');

        try {
            const wayToJoin = await infoRef.get();
            const recommendedLastHour = await recommendedLastHourRef.get();
            const waysToJoin = wayToJoin.data();
            const recommendedLastHourIds = recommendedLastHour.data();
            return res.json({ waysToJoin, recommendedLastHourIds });
        } catch (error) {
            console.log(error);
            return res.status(404).json({
                error: 'unknown',
                message: 'error'
            });
        }
    });
});

module.exports = { getData };
