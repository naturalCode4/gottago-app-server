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

const convertToStringOrNull = (value) => value ? `'${value}'` : null;

const seed = () => {
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
}

const getBathrooms = (req, res) => {
    sequelize.query(`SELECT * FROM Bathrooms`)
    .then(dbRes => res.status(200).send(dbRes))
    .catch(err => console.log(err))
}

const postNewBathroomData = (req, res) => {
    console.log('newBathroom', req.body)
    const {latitude, longitude, bathroomNameText, bathroomAddressText, overallRating, cleanlinessRating, crowdednessRating, type} = req.body
    sequelize.query(`
    INSERT INTO Bathrooms (latitude, longitude, bathroom_name, bathroom_address, ave_overall, ave_cleanliness, ave_crowdedness, top_category)
    VALUES (${latitude}, ${longitude}, ${convertToStringOrNull(bathroomNameText)}, ${convertToStringOrNull(bathroomAddressText)}, ${overallRating}, ${cleanlinessRating}, ${crowdednessRating}, ${convertToStringOrNull(type)})
    RETURNING id
    `)
    .then((data) => {
        console.log('mydata', data)
        // @ts-ignore
        const id = data[0][0].id
        // note: this^ is from getting id from 'RETURNING id' in sequelize INSERT query
        console.log('postReview console.log HERE')
        postReview({...req.body, bathroom_id: id})
        returnUpdatedBathroom(id)
        .then(bathrooms => res.status(200).send(bathrooms[0][0]))
    })
    .catch(err => console.log(err))
}

const postReview = (review) => {
    console.log('POSTREVIEW', review)
    return sequelize.query(`
        INSERT INTO Reviews (overall, cleanliness, crowdedness, category, text_review, bathroom_id)
        VALUES (${review.overallRating}, ${review.cleanlinessRating}, ${review.crowdednessRating}, ${convertToStringOrNull(review.type)}, ${convertToStringOrNull(review.textReview)}, ${review.bathroom_id})
    `)
}

const updateBathroom = (bathroom_id) => {
    console.log('ENTERED UPDATEBATHROOM FUNCTION')
    return sequelize.query(`
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
                WHERE bathroom_id = ${bathroom_id}),
            top_category = 
                (SELECT category
                FROM Reviews
                WHERE category IS NOT NULL
                AND bathroom_id = ${bathroom_id}
                GROUP BY category
                ORDER BY COUNT(*) DESC
                LIMIT 1)
        WHERE id = ${bathroom_id}
    `)
}

const returnUpdatedBathroom = (bathroom_id) => {
    return sequelize.query(`
        SELECT * 
        FROM Bathrooms
        WHERE id = ${bathroom_id}
    `)
}

const postReviewAndUpdateBathroom = async (req, res) => {
    console.log('PRE-POSTREVIEW', req.body)
    const reviewInfo = {
        overallRating: req.body.overallRating, 
        cleanlinessRating: req.body.cleanlinessRating, 
        crowdednessRating: req.body.crowdednessRating, 
        type: req.body.type,
        textReview: req.body.textReview, 
        bathroom_id: req.body.bathroom_id}
    postReview(req.body)
    // postReview(reviewInfo)
    .then(() => updateBathroom(reviewInfo.bathroom_id))
    .then(() => returnUpdatedBathroom(reviewInfo.bathroom_id))
    .then(dbRes => {
        console.log('dbRes, ', dbRes)
        res.status(200).send(dbRes)
    })
    .catch(err => console.log(err))
}

const getAllReviewsForOneBathroom = (req, res) => {
    console.log('getAllReviews', req.params.id)
    sequelize.query(`
        SELECT overall, text_review
        FROM Reviews
        WHERE bathroom_id=${req.params.id}
    `)
    .then(dbRes => res.status(200).send(dbRes))
}

module.exports = {getBathrooms, getAllReviewsForOneBathroom, postReviewAndUpdateBathroom, postNewBathroomData, postReview}

    // getBathrooms: (req, res) => {
    //     sequelize.query(`SELECT * FROM Bathrooms`)
    //     .then(dbRes => res.status(200).send(dbRes))
    //         .catch(err => console.log(err))
    // },


    // postNewBathroom: (req, res) => {
    //     console.log('newBathroom', req.body)
    //     const {latitude, longitude, ave_overall, ave_cleanliness, ave_crowdedness, top_category} = req.body
    //     sequelize.query(`
    //     INSERT INTO Bathrooms (latitude, longitude, ave_overall, ave_cleanliness, ave_crowdedness, top_category)
    //     VALUES (${latitude}, ${longitude}, ${ave_overall}, '${ave_cleanliness}', '${ave_crowdedness}', ${top_category})
    //     `)
    //     .then(dbRes => {
    //         res.status(200).send(dbRes)
    //     })
    //     .catch(err => console.log(err))
    // },

    // postReviewAndUpdateBathroom: async (req, res) => {
    //     console.log('PRE-POSTREVIEW', req.body)
    //     const reviewInfo = {
    //         overallRating: req.body.overallRating, 
    //         cleanlinessRating: req.body.cleanlinessRating, 
    //         crowdednessRating: req.body.crowdednessRating, 
    //         type: req.body.type, 
    //         textReview: req.body.textReview, 
    //         bathroom_id: req.body.bathroom_id}
    //     this.postReview(reviewInfo)
    //     .then(() => this.updateBathroom(reviewInfo))
    //     .then(() => this.returnUpdatedBathrooms(reviewInfo))
    //     .then(dbRes => {
    //         console.log('dbRes, ', dbRes)
    //         res.status(200).send(dbRes)
    //     })
    //     .catch(err => console.log(err))
    // },

    // postReview: (data) => {
    //     return sequelize.query(`
    //         INSERT INTO Reviews (overall, cleanliness, crowdedness, category, text_review, bathroom_id)
    //         VALUES (${data.overallRating}, ${data.cleanlinessRating}, ${data.crowdednessRating}, '${data.type}', '${data.textReview}', ${data.bathroom_id})
    //     `)
    // },

    // updateBathroom: (data) => {
    //     return sequelize.query(`
    //         UPDATE Bathrooms
    //         SET 
    //             ave_overall = 
    //             (SELECT AVG(overall)
    //             FROM REVIEWS
    //             WHERE bathroom_id = ${data.bathroom_id}),
    //             ave_cleanliness =
    //             (SELECT AVG(cleanliness)
    //             FROM REVIEWS
    //             WHERE bathroom_id = ${data.bathroom_id}),
    //             ave_crowdedness =
    //             (SELECT AVG(crowdedness)
    //             FROM REVIEWS
    //             WHERE bathroom_id = ${data.bathroom_id})
    //         WHERE id = ${data.bathroom_id};
    //     `)
    // },

    // returnUpdatedBathrooms: (data) => {
    //     return sequelize.query(`
    //         SELECT * 
    //         FROM Bathrooms
    //         WHERE id = ${data.bathroom_id}
    //     `)
    // },

    //may break apart queries into callback functions. do this if you end up wanting to use the same queries for other database calls
    // postReviewAndUpdateBathroom: (req, res) => {
    //     console.log('PRE-POSTREVIEW', req.body)
    //     const {overallRating, cleanlinessRating, crowdednessRating, type, textReview, bathroom_id} = req.body
    //     sequelize.query(`
    //         INSERT INTO Reviews (overall, cleanliness, crowdedness, category, text_review, bathroom_id)
    //         VALUES (${overallRating}, ${cleanlinessRating}, ${crowdednessRating}, '${type}', '${textReview}', ${bathroom_id})
    //     `)
    //     .then(() => {
    //         console.log('into .then before updating bathroom')
    //         sequelize.query(`
    //             UPDATE Bathrooms
    //             SET 
    //                 ave_overall = 
    //                 (SELECT AVG(overall)
    //                 FROM REVIEWS
    //                 WHERE bathroom_id = ${bathroom_id}),
    //                 ave_cleanliness =
    //                 (SELECT AVG(cleanliness)
    //                 FROM REVIEWS
    //                 WHERE bathroom_id = ${bathroom_id}),
    //                 ave_crowdedness =
    //                 (SELECT AVG(crowdedness)
    //                 FROM REVIEWS
    //                 WHERE bathroom_id = ${bathroom_id})
    //             WHERE id = ${bathroom_id};
    //         `)
    //         //add something is this query for top_cateogyr
    //     })
    //     .then(() => {
    //         return new Promise ((resolve) => {
    //             resolve (sequelize.query(`
    //                 SELECT * 
    //                 FROM Bathrooms
    //                 WHERE id = ${bathroom_id}
    //             `))})
    //     })
    //     .then(dbRes => {
    //         console.log('POST FUNCTION STUFF')
    //         console.log('dbRes, ', dbRes)
    //         res.status(200).send(dbRes)
    //     })
    //     .catch(err => console.log(err))
    // }