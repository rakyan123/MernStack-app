const HttpError = require('../models/http-error');
const fs = require('fs');
const mongoose = require('mongoose');
const router = require('../routes/places-routes');
const {validationResult} = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { get } = require('../routes/places-routes');
const getCoordsForAddress = require('../util/location')
const Place = require('../models/place')
const User = require('../models/user');

/* We use session and transaction to perform isolated tasks and if any task is wrong none of the
    other tasks is performed. Also the push function is not the same we use with array, its a special
    mongoose function that stores the placeId in user database. For a transaction to work we have 
    to make sure a collection is created already.*/


/*let DUMMY_PLACES = [
    {
    id:'p1',
    title:'Empire State Building',
    description:'One of the most famous sky scrapers in the world',
    location:{
        lat:40.7484474,
        lng:-73.9871516
    },
    address:'20 W 34th St, New York, NY 10001',
    creator:'u1'
}
]*/


const getPlaceById = async (req,res,next) => {
    const placeId = req.params.pid;
    let place;
    //findById function doesnt return a promise still we can use async await with it.
    //Its a mongoose specific feature
    try{
        place = await Place.findById(placeId);
    } catch (err) {
        //This error is when get request has a problem
        const error = new HttpError(
            'Something went wrong, could not find the place', 500)
        return next(error);
    }
    //This error if the place with given id is not found
    if(!place){
        const error = new HttpError('Could not find a place for the provided id',404); //calls the error handling middleware
        return next(error);
    }
    /*No statement is run after return and so res.json({place}) won't run, we could alternatively also 
    use else block to do the same*/
    res.json({place : place.toObject({getters : true})}); //{place} => {place:place}
    //Adds a new id property without an underscore
}



const getPlacesByUserId = async (req,res,next) => {
    const userId = req.params.uid;
    let places;
    try{
        places = await Place.find({creator : userId})
        //find function returns an array unlike mongodb
    } catch(err){
        const error = new HttpError('Fetching places failed, please try again', 500);
        return next(error);
    }
    if(!places || places.length === 0){
        return next(new HttpError('Could not find places for the provided user id',404));
    }
    /*No statement is run after return and so res.json({place}) won't run, we could alternatively also 
    use else block to do the same*/
    
    res.json({places : places.map(place => place.toObject({getters:true}))}); 
}
//Function execution ends with throw and not with next so we have to use return


const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new HttpError('Invalid inputs passed, please check your data.', 422)
      );
    }
  
    const { title, description, address } = req.body;
  
    let coordinates;
    try {
      coordinates = await getCoordsForAddress(address);
    } catch (error) {
      return next(error);
    }
  
    const createdPlace = new Place({
      title,
      description,
      address,
      location: coordinates,
      image: req.file.path,
      creator : req.userData.userId
    });
  
    let user;
    try {
      user = await User.findById(req.userData.userId);
    } catch (err) {
      const error = new HttpError(
        'Creating place failed, please try again.',
        500
      );
      return next(error);
    }
  
    if (!user) {
      const error = new HttpError('Could not find user for provided id.', 404);
      return next(error);
    }
  
    console.log(user);
  
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdPlace.save({ session: sess }); 
      user.places.push(createdPlace); 
      await user.save({ session: sess }); 
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError(
        'Creating place failed, please try again.',
        500
      );
      return next(error);
    }
  
    res.status(201).json({ place: createdPlace });
  };



const updatePlace = async (req,res,next) => {
    const errors =  validationResult(req);
    if(!errors.isEmpty()){  
        return next(new HttpError('Invalid inputs passed, please check your data', 422))
    }
    let place;
   const {title,description} = req.body;
   const placeId = req.params.pid;
   try{
    place = await Place.findById(placeId);
} catch (err) {
    //This error is when get request has a problem
    const error = new HttpError(
        'Something went wrong, could not update the place', 500)
    return next(error);
}

   if(place.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      'You are not allowed to edit the place', 401)
    return next(error);
   }
   place.title = title;
   place.description = description;
   
   try{
       await place.save();
   }catch(err) {
       const error = new HttpError('Something went wrong, could not update the place', 500);
       return next(error);
   }

   res.status(201).json({place:place.toObject({getters:true})});
}



const deletePlace = async (req,res,next) => {
   const placeId = req.params.pid;
   let place;
   try{
    place = await Place.findById(placeId).populate('creator');
    //populate function gives the creator id from which we can access the user object
} catch (err) {
    //This error is when get request has a problem
    const error = new HttpError(
        'Something went wrong, could not delete the place', 500)
    return next(error);
}

   if(!place){
       const error = new HttpError('Could not find a place for the provided id', 404);
       return next(error);
   }

   if(place.creator.id !== req.userData.userId){
    const error = new HttpError(
      'You are not allowed to delete the place', 401)
    return next(error);
   }

   const imagePath = place.image;

   try{
       const sess = await mongoose.startSession();
       sess.startTransaction();
       await place.remove({session:sess});
       await place.creator.places.pull(place);
       place.creator.save({session:sess});
       await sess.commitTransaction();

   }catch(err) {
    const error = new HttpError('Something went wrong, could not delete the place', 500);
    return next(error);
}
   fs.unlink(imagePath, err => {
     console.log(err);
   })
   res.status(200).json({message : "Deleted place."})
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace=createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;


