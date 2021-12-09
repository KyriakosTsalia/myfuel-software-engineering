var mongoose = require("mongoose");
//SCHEMA SETUP
var postSchema = new mongoose.Schema({
  price: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store"
  },
  lat: Number,
  lng: Number,
  locationName: String,
  fuelType: {
    type: String,
    required: true
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  rating: {
    type: Number,
    default: 0
  }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});

module.exports = mongoose.model("Post",postSchema);
