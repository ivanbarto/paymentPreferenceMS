const functions = require('firebase-functions');
const express = require('express')
const app = express()

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const admin = require('firebase-admin');
admin.initializeApp();

initializeApp();
const db = getFirestore();

const mercadopago = require('mercadopago');
mercadopago.configure({
    access_token: 'TEST-1629463471863995-080922-f03a5bedefc55807047b9211bebcc4bc-181705181'
});


exports.app = functions.https.onRequest(app)

app.post('/api/paymentReference', (req, res) => {

    let unitPrice = req.body.unitPrice;
    let name = req.body.name;
    let surname = req.body.surname;
    let email = req.body.email;
    let eventName = req.body.eventName;

    console.log(unitPrice + " - " + name + " - " + surname + " - " + email + " - " + eventName)

    let preference = {
        "items": [
            {
                "title": eventName,
                "currency_id": "ARS",
                "description": "Pago por realizado por la participación en el evento " + eventName,
                "category_id": "art",
                "quantity": 1,
                "unit_price": parseInt(unitPrice, 10)
            }
        ],
        "payer": {
            "name": name,
            "surname": surname,
            "email": email
        },
        "payment_methods": {
            "excluded_payment_types": [
                {
                    "id": "ticket"
                }
            ]
        },
    };

    mercadopago.preferences
        .create(preference)
        .then((response) => {
            // En esta instancia deberás asignar el valor dentro de response.body.id por el ID de preferencia solicitado en el siguiente paso
            return res.status(200).json(
                {
                    success: true,
                    message: 'preferencia de pago creada con éxito:',
                    preferenceId: response.body.id
                })
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json(
                {
                    success: false,
                    message: 'la creacion de la preferencia de pago falló',
                    preferenceId: ''
                })
        });


})


exports.notifyNewSubscriber = functions.firestore.document('subscriptions/{documentId}')
    .onCreate(async (snap, context) => {
        console.log("FUNCTION START ////////////////// \n\n")


        // Grab the current value of what was written to Firestore.
        const organizerId = snap.data().organizerId
        const userName = snap.data().userName
        const eventName = snap.data().eventName

        const fcmTokenDockRef = db.collection('fcmTokens').doc(organizerId);

        try {
            const doc = await fcmTokenDockRef.get();
            if (!doc.exists) {
                console.log('No such document!');

            } else {
                const fcmToken = doc.data().fcmToken

                const payload = {
                    token: fcmToken,
                    notification: {
                        title: '¡Nuevo candidato!',
                        body: userName + " se suscribió al evento " + eventName
                    },
                    data: {
                        body: "data",
                    }
                };

                admin.messaging().send(payload).then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return { success: true };
                }).catch((error) => {
                    return { error: error.code };
                });

            }

        } catch (error) {
            console.log("\n\n OCURRIÓ UN ERROR : " + error)

        }




        console.log("\n\nFUNCTION END ////////////////// \n\n")
    });




exports.notifyEventVacanciesEnd = functions.firestore.document('events/{documentId}')
    .onUpdate(async (snap, context) => {
        console.log("FUNCTION START ////////////////// \n\n")


        // Grab the current value of what was written to Firestore.
        const state = snap.after.data().state
        const name = snap.after.data().name
        const id = snap.after.data().id
        console.log(state + " - " + name + " - " + id)

        switch (state) {
            case 2: {
                const payload = {
                    notification: {
                        title: '¡Evento finalizado!',
                        body: "El evento " + name + " ha cerrado la convocatoria. Ya puedes ver los resultados en la sección de Suscripciones."
                    },
                    data: {
                        body: "data",
                    },
                    topic: "event_" + id
                };
                console.log("state 2 - sending to topi event_" + id)

                admin.messaging().send(payload).then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return { success: true };
                }).catch((error) => {
                    return { error: error.code };
                });

            }
                break;


            case 3: {
                const payload = {
                    notification: {
                        title: '¡Evento cancelado! :(',
                        body: "El evento " + name + " ha sido cancelado. ¡Ingresa a Artfinderzz y busca más eventos en los que participar!"
                    },
                    data: {
                        body: "data",
                    },
                    topic: "event_" + id
                };
                console.log("state 3 - sending to topi event_" + id)

                admin.messaging().send(payload).then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return { success: true };
                }).catch((error) => {
                    return { error: error.code };
                });
            }
                break;

            case 1: {
                const payload = {
                    notification: {
                        title: '¡Evento modificado!',
                        body: "El evento " + name + " ha modificado alguno de sus detalles. Recuerda revisarlos para asegurar que el evento cumple tus criterios."
                    },
                    data: {
                        body: "data",
                    },
                    topic: "event_" + id
                };
                console.log("state 1 - sending to topi event_" + id)

                admin.messaging().send(payload).then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return { success: true };
                }).catch((error) => {
                    return { error: error.code };
                });
            }
                break;

            default: console.log("DEFAULT")

                break;
        }

        console.log("\n\nFUNCTION END ////////////////// \n\n")
    });

