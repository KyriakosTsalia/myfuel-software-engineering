const config = require('config');
const jwt = require('jsonwebtoken');
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  avatar: {
    type: String,
    default: "http://s3.amazonaws.com/37assets/svn/765-default-avatar.png"
  },
  avatarId: String,
  description: String,
  firstName: String,
  lastName: String,
  address: String,
  addressLat: Number,
  addressLng: Number,
  locations: [
    {
      name: String,
      location: String,
      locationLat: Number,
      locationLng: Number,
    }
  ],
    email: {
    type: String,
    unique: true,
    required: true
  },
  resetPasswordToken: String, // for resetting
  resetPasswordExpires: Date, // the password
  redeemPointsToken: String, // for redeeming
  redeemPointsExpires: Date,// points
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  ratedPosts: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});

userSchema.methods.generateAuthToken = function() {  // adding a method to the user "class"
  const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey')); //sign defines which properties are going to be included on jwt payload
  return token;
}

userSchema.virtual("type").get(function(){
  return "user"
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
