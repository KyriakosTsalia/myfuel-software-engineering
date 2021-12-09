const express      = require("express"),
      router       = express.Router({mergeParams: true}),
      Post         = require("../models/post.js"),
      User         = require("../models/user.js"),
      Store        = require("../models/store"),
      NodeGeocoder = require('node-geocoder'),
      auth = require('../middleware/auth');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

// INDEX - show all posts - with pagination
router.get("/", function (req, res) {
    var StartQuery = parseInt(req.query.start);
    var start = StartQuery ? StartQuery : 0;
    var perpageQuery = parseInt(req.query.count);
    var perPage = perpageQuery ? perpageQuery : 20;
    var toSearch = {} ; //search everything
    var toSort = {};

    var sortOptions = req.query.sortOptions;
    if(sortOptions) {
      if(sortOptions == "date"){
        toSort = {
          createdAt: -1
        };
      } else if(sortOptions == "geoDist") {
        toSort = {

        };
      } else {
        toSort = {
          price: 1
        };
      }
    } else {
      toSort = {
        price: 1
      };
    }

    async function test(toSearch){
      if(req.query.geoDist && req.query.geoLng && req.query.geoLat) {
	var lat = req.query.geoLat;
	var lng = req.query.geoLng;
        var dist = req.query.geoDist;
        toSearch.lat = { $lt: lat+0.01*dist, $gt: lat-0.01*dist};
        toSearch.lng = { $lt: lng+0.012*dist, $gt: lng-0.012*dist};
      } else {
	if(req.query.geoDist || req.query.geoLng || req.query.geoLat) {
	  res.status(400).json({"Error" : "400 - Bad request"});
	  return;
	} else {
          var lat = 37.983810;
          var lng = 23.727539;
	  var dist = 5;
          toSearch.lat = { $lt: lat+0.01*dist, $gt: lat-0.01*dist};
          toSearch.lng = { $lt: lng+0.012*dist, $gt: lng-0.012*dist};
	}
      }

      if(req.query.products) {
        if(req.query.products == "ALL" || req.query.products == "'ALL'") {
          var forFuel = ""
        }
        else if(req.query.products.startsWith("'")){
          var forFuel = "this.fuelType === "+req.query.products+" && ";
          var fuelType = req.query.products.slice(1,-1);
        } else {
          var forFuel = "this.fuelType === '"+req.query.products+"' && ";
          var fuelType = req.query.products;
        }
      } else {
        var forFuel=""
      }

      Post.$where(forFuel+ "Math.sqrt(Math.pow((this.lat-"+lat+")/0.01,2)+Math.pow((this.lng - "+lng+")/0.012,2)) <= "+dist).sort(toSort).skip(start).limit(perPage).exec(function (err, posts) {
          Post.$where(forFuel+ "Math.sqrt(Math.pow((this.lat-"+lat+")/0.01,2)+Math.pow((this.lng - "+lng+")/0.012,2)) <= "+dist).exec(function (err, count) {
              if (err) {
                  console.log(err);
              } else {
                  if(!posts) {
                    posts=[];
                  }
                  count = count.length;
                  return res.json({
                      "start" : start,
                      "count" : perPage,
                      "total" : count,
                      "posts" : posts
                  });
              }
          });
      });
    }
    test(toSearch,req.query);
});

//CREATE - add new post to DB
router.post("/", auth, function(req,res){
  //get data from form and add to posts array
  var price = req.body.price
  var location = req.body.location
  var fuelType = req.body.fuelType;
  var author = req.user._id;

  Store.findOne({location: req.body.location},function(err,foundStore){
    var newPost = {fuelType: fuelType, price: price, author: author, location: foundStore._id, locationName: foundStore.location, lat: foundStore.lat, lng: foundStore.lng }
    // create a new post and save to DB
    Post.create(newPost,function(err, post){
      if(err) {
        res.status(400).json({"message" : err.message});
        console.log(err);
      } else{
          foundStore.posts.push(post);
          foundStore.save(function(err){
            User.findById(req.user._id,function(err,foundUser){
              if(err) {
		res.status(400).json({"message" : err.message});
                console.log(err);
              } else {
                foundUser.points = foundUser.points + 100;
                foundUser.save();
                //redirect back to posts page
                res.json(newPost);
              }
            });
          });
        }
      });
    });
  });

//SHOW - shows more info about one post
router.get("/:id",function(req,res){
  //find the post with provided ID
  // reviews are populated 2 levels deep
  Post.findById(req.params.id).exec(function(err, post){
    if(err){
      console.log(err);
      res.status(400).json({"message" : "error"});
    } else {
      //render show template with that post
      res.json(post);
    }
  });
});

module.exports = router;
