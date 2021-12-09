const Joi = require('joi');
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var storeSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  brand: {
    type: String,
    required: true
  },
  location: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    unique: true,
    required: true
  },
  lat: Number,
  lng: Number,
  phone: {
    type: String,
    unique: true,
    required: true
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ]
}, {
  timestamps: true
});

storeSchema.virtual("type").get(function(){
  return "store"
});
storeSchema.plugin(passportLocalMongoose);

function validateShop(shop) {
  const schema = {
    name: Joi.string().required(),
    brand: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    username: Joi.string().required(),
    address: Joi.string(),
    lng: Joi.number(),
    lat: Joi.number(),
    tags: Joi.array(),
    withdrawn: Joi.boolean()
  };
  return Joi.validate(shop, schema);
}

exports.validate = validateShop;

module.exports = mongoose.model("Store",storeSchema);
