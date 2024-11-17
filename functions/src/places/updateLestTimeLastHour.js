const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();


const updateLestTimeLastHour = functions.https.onRequest(async (req, res) => {


    const turnsRef = db.collection('turns')
    const recommendedLastHourRef = db.collection('recommendedPlaces').doc('lestTimeLastHour')

    try {

        const turns = await turnsRef.get()


        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const mapPlaces = {}
        turns.forEach((doc) => {
            const data = doc.data()
            const { status } = data;
            if (status != 'waiting') {
                const { activatedAt, createdAt, idPlace } = data;

                if (activatedAt) {
                    const activated = activatedAt._seconds * 1000;
                    const created = createdAt._seconds * 1000;

                    if ((created - oneHourAgo) >= 0) {
                        const timeQueue = activated - created;
                        if (!mapPlaces[idPlace]) {
                            mapPlaces[idPlace] = [];
                        }
                        mapPlaces[idPlace].push(timeQueue);
                    }
                }


            }
        });
        const averages = {};
        const placesWithTime = Object.keys(mapPlaces)

        for (const idPlace of placesWithTime) {
            const times = mapPlaces[idPlace];
            let sum = 0;
            for (time of times){
                sum += time
            }
            const average = sum / times.length; // Calcular el promedio
            averages[idPlace] = average; // Guardar el promedio en un nuevo objeto
        }


        if (placesWithTime.length <= 10){
            recommendedLastHourRef.update(averages)
            return res.json({ success: true, message: 'Updated succesfuly' })
        }else{
            

            // Convertir el objeto en un arreglo de pares [clave, valor]
            const entries = Object.entries(averages);

            // Ordenar los pares por valor (ascendente)
            entries.sort(([, valueA], [, valueB]) => valueA - valueB);

            // Quedarse con los primeros 5
            const top5 = entries.slice(0, 10);

            // Convertir de nuevo a objeto si es necesario
            const result = Object.fromEntries(top5);
            recommendedLastHourRef.update(result)
            return res.json({ success: true, message: 'Updated succesfuly' })
        }





    } catch (error) {
        console.log(error)
        return res.status(404).json({
            error: 'unknown',
            message: 'error'
        });
    }


});

module.exports = { updateLestTimeLastHour };
