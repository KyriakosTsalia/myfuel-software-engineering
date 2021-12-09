const Joi = require('joi');
const passport = require("passport");
const _ = require('lodash');
const User = require('../models/user.js');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  let user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send('Invalid username or password.'); //not 404, we dont want to let the client know 
  passport.authenticate("userLocal")(req, res, function(){
    const token = user.generateAuthToken(); //if password is valid generate and send a token
    res.send(token);
  });
});

function validate(req) {
  const schema = {
    username: Joi.string().required(),
    password: Joi.string().required()
  };

  return Joi.validate(req, schema);
}

module.exports = router; 
