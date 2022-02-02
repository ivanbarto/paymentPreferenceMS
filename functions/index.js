const functions = require('firebase-functions');
const express = require('express')
const app = express()

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

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
