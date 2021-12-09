const express      = require("express"),
      router       = express.Router({mergeParams: true}),
      Post         = require("../models/post"),
      Review       = require("../models/review"),
      User         = require("../models/user"),
      Store        = require("../models/store"),
      middleware   = require("../middleware"),
      NodeGeocoder = require('node-geocoder'),
      fs           = require('fs');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  language: "el",
  region: "GR",
  formatter: null
};

const geocoder = NodeGeocoder(options);

// INDEX
router.get("/",function(req,res){
  var perPage = 20;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  Store.find().sort({brand: 1, location: 1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err,stores){
    Store.countDocuments().exec(function(err,count){
      if(err){
        console.log(err);
        req.flash("error","Κάτι πήγε στραβά.");
        res.redirect("back");
      } else {
        res.render("stores/index",{
          stores: stores,
          current: pageNumber,
          pages: Math.ceil(count / perPage)
        });
      }
    });
  });
});

// NEW
router.get("/new",middleware.isAdmin, function(req,res){
  res.render("stores/new");
});

// CREATE
router.post("/", middleware.isAdmin, function(req,res){
  var brand = req.body.brand.slice(1,-1);
  var name = req.body.name;
  var phone = req.body.phone;
  var email = req.body.email;
  var password = email.slice(0,email.indexOf("@"));

  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash("error", "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newStore = new Store({brand: brand, name: name, location: location, lat: lat, lng: lng, phone: phone, username: email, email: email});
    Store.register(newStore, password, function(err,newlyCreatedStore){
      if(err) {
        console.log(err);
        req.flash("error", err.message);
        res.redirect("/stores");
      } else {
        res.redirect("/stores");
      }
    });
  });
});

// SHOW
router.get("/:id", function(req,res){
  Store.findById(req.params.id, function(err, store){
    if(err){
      console.log(err);
      req.flash("error","Το πρατήριο δεν βρέθηκε.");
      res.redirect("/stores");
    } else {
      var perPage = 8;
      var pageQuery = parseInt(req.query.page);
      var pageNumber = pageQuery ? pageQuery : 1;
      Post.find({location: store._id}).populate("location").sort({createdAt: -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err,posts){
        Post.countDocuments({location: store._id}).exec(function (err,count){
          if (err) {
            console.log(err);
          } else {
            res.render("stores/show",{
              store: store,
              posts: posts,
              current: pageNumber,
              pages: Math.ceil(count / perPage)
            });
          }
        })
      });
    }
  });
});

// EDIT
router.get("/:id/edit",middleware.isAdmin, function(req,res){
  Store.findById(req.params.id, function(err, store){
    if(err){
      console.log(err);
      req.flash("error","Το πρατήριο δεν βρέθηκε.");
      res.redirect("/stores");
    } else {
      res.render("stores/edit",{store: store});
    }
  });
});

// UPDATE
router.put("/:id/", middleware.isAdmin, function(req,res){
  if(req.body.brand.startsWith("'")) {
    req.body.brand = req.body.brand.slice(1,-1);
  }

  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;

    Store.findByIdAndUpdate(req.params.id, {brand: req.body.brand, name: req.body.name, location: location, lat: lat, lng: lng, phone: req.body.phone, email: req.body.email}, function(err, foundStor){
      if(err) {
        req.flash("error","Κάτι πήγε στραβά.");
        res.redirect("/stores");
      } else {
        res.redirect("/stores/" + req.params.id);
      }
    });
  });
});

// DESTROY
router.delete("/:id", middleware.isAdmin, function(req,res){
  Store.findById(req.params.id, function(err, store){
    Post.find().where({location:req.params.id}).exec(function(err,posts){
      for(var i = 0 ; i < posts.length; i++){
        Review.deleteMany({"_id": {$in: posts[i].reviews}},function(err){
          if(err) {
            console.log(err);
            req.flash("error","Κάτι πήγε στραβά.");
            return res.redirect("/stores");
          }
        });
        Post.deleteOne(posts[i],function(err){
          if(err){
            console.log(err);
          }
        });
      }
    });
      Store.deleteOne(store,function(err){
        if(err) {
          console.log(err);
          req.flash("error",err.message);
          res.redirect("/stores");
        } else {
          res.redirect("/stores");
        }
      });
    });
  });

module.exports = router;
