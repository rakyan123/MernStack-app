const express = require('express');
const {check} = require('express-validator')
const router = express.Router();
const HttpError = require('../models/http-error');
const usersController = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

router.get('/', usersController.getUsers);

router.post('/signup',
   fileUpload.single('image'), //instructs multer to extract file from the image key from the incoming request
[
   check('name').not().isEmpty(),
   check('email')
   .normalizeEmail() // Test@test.com => test@test.com
   .isEmail(),
   check('password').isLength({min:6})
],
usersController.signup);

router.post('/login', usersController.login);

module.exports = router;