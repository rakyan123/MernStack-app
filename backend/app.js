const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');
const placesRoutes = require('./routes/places-routes');
//placeRoutes is a middleware and we can use it directly inside app.use()
const usersRoutes = require('./routes/users-routes');
const app = express();

app.use(bodyParser.json())

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization') // 3rd and 5th are not default
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
})

app.use('/api/places',placesRoutes); //Now it only works with url starting with /api/places...
app.use('/api/users', usersRoutes)
//This following middleware only runs when we specify a different route
app.use((req,res,next) => {
    const error = new HttpError("Could not find this route", 404);
    throw error;
})

/* If we use 4 parameters in middleware function then express will consider it a special function which
runs when there is an error in any middleware above this.*/

app.use((error,req,res,next) => {
    if(req.file){
        fs.unlink(req.file.path, err => {
            console.log(err);
        })
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message : error.message || 'An unknown error occured!'})
})
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6zure.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
{useNewUrlParser:true, useUnifiedTopology:true})
.then(() => {
    app.listen(5000, ()=>console.log("Connected"));
})
.catch(err => {
    console.log(err);
})
