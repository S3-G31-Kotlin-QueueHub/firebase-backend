const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();


const manageQueue = functions.https.onRequest(async (req, res) => {

    const queuId = req.body.queueId;

    
    if (!queuId) {
        return res.status(400).json({
            error: 'invalid-argument',
            message: 'Se requiere el ID de la queue'
        });
    }

    try {

        const queueRef = db.collection('queues').doc(queuId);
        const queueSnapshot = await queueRef.get();

        if (!queueSnapshot.exists) {
            return res.status(404).json({
                error: 'not-found',
                message: 'La queue especificada no existe'
            });
        }

        const queueData = queueSnapshot.data();
        const turns = queueData?.turns || [];
        const currentTurnId = queueData?.currentTurnId;
        const currentTurnNumber = queueData?.currentTurnNumber || 0;

        if (currentTurnId) {
            await db.collection('turns').doc(currentTurnId).update({
                status: 'ended',
                endedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }


        if (turns.length === 0) {
            await queueRef.update({
                currentTurnId: null,
                currentTurnNumber: 0,
                lastTurnNumber: 0,
                lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.json({ success: true, message: 'Cola vacía' });
        }

        let nextTurn = turns[0];
        let nextTurnNumber = currentTurnNumber + 1;

        const turnDoc = await db.collection('turns').doc(nextTurn).get();
        const turnData = turnDoc.data();
        const userId = turnData.idUser;
        const turnStatus = turnData.status;
        

        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userToken = userData.token;
        
        if(turnStatus == "cancelled"){
            
            await db.collection('turns').doc(nextTurn).update({
                status: 'ended',
                endedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            await queueRef.update({
                currentTurnId: nextTurn,
                currentTurnNumber: nextTurnNumber,
                turns: admin.firestore.FieldValue.arrayRemove(nextTurn),
                lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

           
            if (turns.length === 1) {
                await queueRef.update({
                    currentTurnId: null,
                    currentTurnNumber: 0,
                    lastTurnNumber: 0,
                    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return res.json({ success: true, message: 'Cola vacía' });
            }

            nextTurnNumber = nextTurnNumber + 1;
            nextTurn = turns[1];
        }

        await db.collection('turns').doc(nextTurn).update({
            status: 'active',
            turnNumber: nextTurnNumber,
            activatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await queueRef.update({
            currentTurnId: nextTurn,
            currentTurnNumber: nextTurnNumber,
            turns: admin.firestore.FieldValue.arrayRemove(nextTurn),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (userToken) {
            console.log("notification")
            const message = {
                notification: {
                    title: '¡Es tu turno!',
                    body: `Tu turno número ${nextTurnNumber} está activo`
                },
                data: {
                    turnId: nextTurn,
                    queueId: queuId,
                    turnNumber: nextTurnNumber.toString()
                },
                token: userToken
            };

            try {
                await admin.messaging().send(message);
                console.log('Notificación enviada exitosamente al usuario:', userId);
            } catch (error) {
                console.error('Error al enviar la notificación:', error);
            }
        }

        return res.json({
            success: true,
            message: 'Queue y turnos actualizados exitosamente',
            currentTurn: nextTurn,
            currentTurnNumber: nextTurnNumber
        });

    } catch(error) {
        console.error('Error al actualizar la queue y turnos:', error);
        return res.status(500).json({
            error: 'internal',
            message: 'Error al actualizar la queue y turnos',
            details: error.message
        });
    }

});   

module.exports = { manageQueue };