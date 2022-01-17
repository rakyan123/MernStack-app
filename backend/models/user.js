const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Place = require('./place')

const Schema = mongoose.Schema;

//unique assigns a new index to the email to make it easier and faster to query our emails but it 
//doesnt check the internal validation if the email already exists or not

//For that we will use 3rd party module i.e mongoose-unique-validator
const userSchema = new Schema({
    name : {type : String, required: true},
    email : {type:String, required:true, unique:true},
    password : {type:String , required:true, minlength : 6},
    image : {type:String , required:true},
    places : [{type:mongoose.Types.ObjectId, required:true, ref:'Place' }]
})

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);