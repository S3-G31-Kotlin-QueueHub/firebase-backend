const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

const onNewTurn = functions.firestore
    .onDocumentCreated('turns/{id}', async (event) => {
        
        try{
            updateCommonPlaces(event);

        } catch(error) {
            console.error('Error on new turn', error);
            throw error;
        }
})

const updateCommonPlaces = async (event)=>{

    const snapshot = event.data;
    const turnData = snapshot.data()
    const idUser = turnData.idUser;
    try{
        const oneMonthAgo = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        const oneMonthAgoTurns = await db.collection('turns')
            .where('idUser', '==', idUser)
            .where('createdAt', '>=', oneMonthAgo)
            .get();

        const placeFrequency = new Map();
        
        
        oneMonthAgoTurns.docs.forEach(doc =>{
            const turn = doc.data();
            const placeInfo = placeFrequency.get(turn.idPlace) || {count:0, lastVisit: turn.createdAt}
            
            placeFrequency.set(turn.idPlace, {
                count: placeInfo.count+1, 
                lastVisit: turn.createdAt.toDate() > placeInfo.lastVisit.toDate()
                    ? turn.createdAt
                    : placeInfo.lastVisit
            });
        });

        const commonPlaces = [];

        for(const [idPlace, data] of placeFrequency.entries()){
            const placeDoc = await db.collection('places').doc(idPlace).get();

            if(placeDoc.exists){
                const place = placeDoc.data()
                commonPlaces.push({
                    idUser: idUser,
                    idPlace,
                    visitCount: data.count,
                    lastVisit: data.lastVisit,
                    ...place
                })
            }
        }

        commonPlaces.sort((a, b) => b.visitCount - a.visitCount);

        await db.collection('commonPlaces').doc(idUser).set({commonPlaces: commonPlaces})


        
    }catch(error){
        console.error('Error updating common places:', error);
        throw error;
    }
}



module.exports = { onNewTurn };