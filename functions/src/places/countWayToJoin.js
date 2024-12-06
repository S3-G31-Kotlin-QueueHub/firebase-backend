const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();


const countWayToJoin = functions.https.onRequest(async (req, res) => {


    const turnsRef = db.collection('turns')
    const infoRef = db.collection('info').doc('wayToJoin')

    try {

        const turns = await turnsRef.get()

        const dict = {
            "app": 0,
            "qr" : 0,
            "ticket" : 0
        }


        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        turns.forEach((doc) => {
            const data = doc.data()
            const { way, createdAt } = data;
            const created = createdAt._seconds * 1000;

            if ((created - oneDayAgo) >= 0) {
                dict[way] += 1
            }

        });

        infoRef.update(dict)
        return res.json(dict)
    } catch (error) {

        console.log(error)
        return res.status(404).json({
            error: 'unknown',
            message: 'error'
        });
    }
});

module.exports = { countWayToJoin };
