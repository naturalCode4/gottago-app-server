require('dotenv').config()
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

module.exports = {
    seed: () => {
        sequelize.query(`
            CREATE TABLE Users(
            id SERIAL PRIMARY KEY,
            username VARCHAR(25),
            user_password VARCHAR(25),
            karma FLOAT
            );
            
            create table Bathrooms (
            id serial primary key,
            latitude float,
            longitude int,
            bathroom_name int,
            ave_overall float,
            ave_cleanliness float,
            ave_crowdedness float,
            top_category varchar(20),
            text_review varchar(255),
            poster_id INT,
            FOREIGN KEY poster_id REFERENCES Users(id)
            );

            create table Reviews (
            id serial primary key,
            overall int,
            cleanliness int,
            crowdedness int,
            category varchar(20),
            text_review varchar(255),
            reviewer_id INT,
            bathroom_id INT,
            FOREIGN KEY reviewer_id REFERENCES Users(id),
            FOREIGN KEY bathroom_id REFERENCES Bathrooms(id)
            )
        `)
    },

    getBathrooms: (req, res) => {
        sequelize.query(`SELECT * FROM Bathrooms`)
        .then(dbRes => res.status(200).send(dbRes))
            .catch(err => console.log(err))
    },

    // updateNewlyReviewedBathroom: (req, res) => {
    //     const {bathroom_id} = req.body
    //     console.log('updateNewlyReviewedBathroom... bathroom_id => ', bathroom_id)
    //     sequelize.query(`
    //         SELECT * 
    //         FROM Bathrooms
    //         WHERE id = ${bathroom_id}
    //     `)
    //         //^undefined bathroom_id
    //     .then(dbRes => {
    //         console.log('updateAndGetSelectedBathroom')
    //         res.status(200).send(dbRes)
    //     })
    //     .catch(err => console.log(err))
    // },


    //may break apart queries into callback functions. do this if you end up wanting to use the same queries for other database calls
    postReviewAndUpdateBathroom: (req, res) => {
        console.log('PRE-POSTREVIEW', req.body)
        const {overallRating, cleanlinessRating, crowdednessRating, type, textReview, bathroom_id} = req.body
        sequelize.query(`
            INSERT INTO Reviews (overall, cleanliness, crowdedness, category, text_review, bathroom_id)
            VALUES (${overallRating}, ${cleanlinessRating}, ${crowdednessRating}, '${type}', '${textReview}', ${bathroom_id})
        `)
        .then(() => {
            console.log('into .then before updating bathroom')
            sequelize.query(`
                UPDATE Bathrooms
                SET 
                    ave_overall = 
                    (SELECT AVG(overall)
                    FROM REVIEWS
                    WHERE bathroom_id = ${bathroom_id}),
                    ave_cleanliness =
                    (SELECT AVG(cleanliness)
                    FROM REVIEWS
                    WHERE bathroom_id = ${bathroom_id}),
                    ave_crowdedness =
                    (SELECT AVG(crowdedness)
                    FROM REVIEWS
                    WHERE bathroom_id = ${bathroom_id})
                WHERE id = ${bathroom_id};
            `)
            //add something is this query for top_cateogyr
        })
        .then(() => {
            return new Promise ((resolve) => {
                resolve (sequelize.query(`
                    SELECT * 
                    FROM Bathrooms
                    WHERE id = ${bathroom_id}
                `))})
        })
        .then(dbRes => {
            console.log('POST FUNCTION STUFF')
            console.log('dbRes, ', dbRes)
            res.status(200).send(dbRes)
        })
        .catch(err => console.log(err))
    },

    // const getSelectedBathroomReviews = (req, res) => {
    // sequelize.query(`SELECT * FROM reviews WHERE id = ${}`)
    //     .then(dbRes => res.status(200).send(dbRes[0]))
    //     .catch(err)
    // }
  
}