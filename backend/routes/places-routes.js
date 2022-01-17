const express = require('express');
const {check} = require('express-validator');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const HttpError = require('../models/http-error');
const placesControllers = require('../controllers/places-controller');
const fileUpload = require('../middleware/file-upload');
//fileUpload is actually a object of middlewares on which we use the methods to get the exact middleware

//req.json()automatically sends back a response after converting the data into json



router.get('/:pid', placesControllers.getPlaceById)

router.get('/user/:uid', placesControllers.getPlacesByUserId)

/* So in every middleware we need not include only 2 arguments, we can include any number of arguments
with this check method, it produces a middleware to check the validation. And in case of more than 
one argument other than the path, it works from left to right.*/ 

router.use(checkAuth);

router.post('/',
    fileUpload.single('image'),
[
    check('title').not().isEmpty(),
    check('description').isLength({min:5}),
    check('address').not().isEmpty()
],
placesControllers.createPlace)

router.patch('/:pid',
[
    check('title').not().isEmpty(),
    check('description').isLength({min:5}),
],
placesControllers.updatePlace)

router.delete('/:pid', placesControllers.deletePlace)

module.exports = router;

//With throw you don't have to use a return cause it cancels the function
//With next you do have to use it.