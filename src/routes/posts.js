const express      = require("express"),
      router       = express.Router({mergeParams: true}),
      Post         = require("../models/post.js"),
      Review       = require("../models/review"),
      User         = require("../models/user.js"),
      Store        = require("../models/store"),
      middleware   = require("../middleware"), //if I require a directory, I automatically require the index.js
      NodeGeocoder = require('node-geocoder'),
      async        = require("async");

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  language: "el",
  region: "GR",
  formatter: null
};

const geocoder = NodeGeocoder(options);

// INDEX - show all posts - with pagination
router.get("/", function (req, res) {
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var toSearch = {} ; //search everything
    var toSort = {};

    var sortOptions = req.query.sortOptions;
    if(sortOptions) {
      if(sortOptions == "byDate"){
        toSort = {
          createdAt: -1
        };
      } else if(sortOptions == "byRating") {
        toSort = {
          rating: -1
        };
      } else {
        toSort = {
          price: 1
        };
      }
    } else {
      toSort = {
        createdAt: -1
      };
    }

    async function test(toSearch){
      if(req.query.location){
        let data = await geocoder.geocode(req.query.location);
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        if(req.query.distance) {
          var dist = req.query.distance;
          toSearch.lat = { $lt: lat+0.01*dist, $gt: lat-0.01*dist};
          toSearch.lng = { $lt: lng+0.012*dist, $gt: lng-0.012*dist};
        } else {
          var dist = 5;
          toSearch.lat = { $lt: lat+0.05, $gt: lat-0.05};
          toSearch.lng = { $lt: lng+0.06, $gt: lng-0.06};
        }
      }
      else {
        if(req.isAuthenticated() && req.user.type=="user") {
          lat = req.user.addressLat;
          lng = req.user.addressLng;
          req.query.location = req.user.address;
        } else {
          lat = 37.983810;
          lng = 23.727539;
          req.query.location = "Αθήνα"
        }
        if(req.query.distance) {
          var dist = req.query.distance;
          toSearch.lat = { $lt: lat+0.01*dist, $gt: lat-0.01*dist};
          toSearch.lng = { $lt: lng+0.012*dist, $gt: lng-0.012*dist};
        } else {
          var dist = 5;
          toSearch.lat = { $lt: lat+0.05, $gt: lat-0.05};
          toSearch.lng = { $lt: lng+0.06, $gt: lng-0.06};
        }
      }

      if(req.query.fuelType) {
        if(req.query.fuelType == "ALL" || req.query.fuelType == "'ALL'") {
          var forFuel = ""
        }
        else if(req.query.fuelType.startsWith("'")){
          var forFuel = "this.fuelType === "+req.query.fuelType+" && ";
          var fuelType = req.query.fuelType.slice(1,-1);
        } else {
          var forFuel = "this.fuelType === '"+req.query.fuelType+"' && ";
          var fuelType = req.query.fuelType;
        }
      } else {
        var forFuel=""
      }

      Post.$where(forFuel+ "Math.sqrt(Math.pow((this.lat-"+lat+")/0.01,2)+Math.pow((this.lng - "+lng+")/0.012,2)) <= "+dist).sort(toSort).skip((perPage * pageNumber) - perPage).limit(perPage).populate("location").exec(function (err, posts) {
          Post.$where(forFuel+ "Math.sqrt(Math.pow((this.lat-"+lat+")/0.01,2)+Math.pow((this.lng - "+lng+")/0.012,2)) <= "+dist).exec(function (err, count) {
              if (err) {
                  console.log(err);
              } else {
                  if(!posts) {
                    posts=[];
                  }
                  count = count.length;
                  return res.render("posts/index", {
                      posts: posts,
                      current: pageNumber,
                      pages: Math.ceil(count / perPage),
                      distance: req.query.distance,
                      fuelType: fuelType,
                      locationLat: lat,
                      locationLng: lng,
                      location: req.query.location,
                      sort: sortOptions
                  });
              }
          });
      });
    }
    test(toSearch,req.query);
});

// NEW - show form to create new post
router.get("/new", middleware.isUser, function(req,res){
  Store.find(function(err,stores){
    if(err){
      console.log(err);
      req.flash("error",err.message);
      res.redirect("/");
    } else {
      res.render("posts/new",{stores: stores});
    }
  });
});

//CREATE - add new post to DB
router.post("/", middleware.isUser, function(req,res){
  //get data from form and add to posts array
  var price = req.body.price
  var location = req.body.location
  var fuelType = req.body.fuelType.slice(1,-1);
  var author = req.user._id;

  Store.findOne({location: req.body.location},function(err,foundStore){
    var newPost = {fuelType: fuelType, price: price, author: author, location: foundStore._id, locationName: foundStore.location, lat: foundStore.lat, lng: foundStore.lng }
    // create a new post and save to DB
    Post.create(newPost,function(err, post){
      if(err) {
        req.flash("error",err.message);
        res.redirect("back");
        console.log(err);
      } else{
          foundStore.posts.push(post);
          foundStore.save(function(err){
            User.findById(req.user._id,function(err,foundUser){
              if(err) {
                req.flash("error",err.message);
                res.redirect("back");
                console.log(err);
              } else {
                foundUser.points = foundUser.points + 100;
                foundUser.save();
                req.flash("success","Η προσφορά σας προστέθηκε με επιτυχία!");
                //redirect back to posts page
                res.redirect("/users/"+req.user._id);
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
  Post.findById(req.params.id).populate("location").populate("author").populate({
        path: "reviews",
        populate: {path: "author"},
        options: {sort: {createdAt: -1}}
    }).exec(function(err, post){
    if(err){
      console.log(err);
      req.flash("error","Η προσφορά δεν βρέθηκε.");
      res.redirect("back");
    } else {
      //render show template with that post
      res.render("posts/show",{post: post});
    }
  });
});

// EDIT - show form to edit post
router.get("/:id/edit", middleware.checkPostOwnership,function(req,res){
  Post.findById(req.params.id).populate("location").exec( function(err, post){
    if(err) {
      req.flash("error","Η προσφορά δεν βρέθηκε.");
      res.redirect("back");
    } else {
      Store.find(function(err,stores){
        Store.findByIdAndUpdate(post.location, {$pull: {posts: req.params.id}}, {new: true}).exec(function(err,foundStore){
          if(err) {
            console.log(err);
            req.flash("error",err.message);
            res.redirect("back");
          } else {
            foundStore.save(function(){
              res.render("posts/edit",{post: post, stores: stores});
            });
          }
        });
      });
    }
  });
});

//UPDATE
router.put("/:id", middleware.checkPostOwnership,function(req,res){
  //to protect the post.rating field from manipulation,
  //since we are passing the req.body.post object to the Post.findByIdAndUpdate() method
  delete req.body.post.rating;
  //find and update the correct post
  if(req.body.post.fuelType.startsWith("'")) {
    req.body.post.fuelType = req.body.post.fuelType.slice(1,-1);
  }
  Store.findOne({location: req.body.location}, function(err, store){
    Post.findById(req.params.id, function(err, post){
      if(err) {
        req.flash("error","Η προσφορά δεν βρέθηκε.");
        res.redirect("back");
      } else {
        post.fuelType = req.body.post.fuelType;
        post.price = req.body.post.price;
        post.location = store._id;
        post.locationName = store.location
        post.lat = store.lat;
        post.lng = store.lng;
        post.save(function(err,newpost){
          store.posts.push(newpost);
          store.save();
          res.redirect("/posts/" + req.params.id);
        });
      }
    });
  });
});

//DESTROY - delete a post
router.delete("/:id", middleware.checkPostOwnership,function(req,res){
  Post.findById(req.params.id, function(err,foundpost){
    if(err) {
      req.flash("error","Η προσφορά δεν βρέθηκε.");
      res.redirect("back");
    } else {
      Store.findByIdAndUpdate(foundpost.location, {$pull: {posts: req.params.id}}, {new: true}).exec(function(err){
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        // deletes all reviews associated with the post
        Review.deleteMany({"_id": {$in: foundpost.reviews}}, function (err) {
          if (err) {
            console.log(err);
            req.flash("error","Κάτι πήγε στραβά κατά τη διαγραφή της προσφοράς σας.");
            return res.redirect("back");
          }
          //  delete the post
          User.findById(foundpost.author,function(err,foundUser){
            if(err) {
              console.log(err);
              req.flash("error","Κάτι πήγε στραβά κατά τη διαγραφή της προσφοράς σας.");
              return res.redirect("back");
            } else {
              foundUser.points = foundUser.points - 100;
              foundUser.save();
              Post.deleteOne(foundpost,function(err){
                if(err) {
                  req.flash("error","Κάτι πήγε στραβά κατά τη διαγραφή της προσφοράς σας.");
                  res.redirect("back");
                } else {
                    res.redirect("/users/"+req.user._id);
                  }
              });
            }
          });
        });
      });
    };
  });
});


module.exports = router;
