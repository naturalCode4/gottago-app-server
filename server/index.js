const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json()); // When we want to be able to accept JSON.
require('dotenv').config()

const postgresScript = require('./postgresController')

const {CONNECTION_STRING, SERVER_PORT} = process.env

const { Sequelize } = require('sequelize');
const { Console } = require("console");
const sequelize = new Sequelize(CONNECTION_STRING, {
    dialect: 'postgres', 
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
})



// app.post('/seed', postgresScript.seed)
app.get(`/getbathrooms`, postgresScript.getBathrooms)
app.get(`/getallreviewsforonebathroom/:id`, postgresScript.getAllReviewsForOneBathroom)
app.post('/postreviewandupdatebathroom', postgresScript.postReviewAndUpdateBathroom)
app.post('/postnewbathroomdata', postgresScript.postNewBathroomData)
app.post('/postreviewdatafornewbathroom', postgresScript.postReview)

app.listen(SERVER_PORT, () => console.log(`Server running on ${SERVER_PORT}`));