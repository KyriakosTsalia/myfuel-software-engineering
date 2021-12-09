const express = require("express"),
      router  = express.Router({mergeParams: true}),
      Post = require("../models/post.js"),
      User = require("../models/user.js"),
      Review = require("../models/review"),
      Store = require("../models/store"),
      async = require("async"), //important
      nodemailer = require("nodemailer"), //for
      crypto = require("crypto"), //point redemption
      middleware = require("../middleware"), //if I require a directory, I automatically require the index.js
      fs = require('fs'),
      qrcode = require('qrcode'),
      NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  language: "el",
  region: "GR",
  formatter: null
};

const geocoder = NodeGeocoder(options);

const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(900, 900);
const ctx = canvas.getContext('2d');

const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX

router.get("/", middleware.isAdmin, function (req, res) {

  var perPage = 20;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  User.find({}).sort({isAdmin: -1, isBlocked: -1, username: 1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, users) {
    User.countDocuments().exec(function (err, count) {
      if (err) {
        console.log(err);
      } else {
        res.render("users/index", {
          users: users,
          current: pageNumber,
          pages: Math.ceil(count / perPage)
        });
      }
    });
  });
});

// NEW
router.get("/new", middleware.isNotLoggedIn, function(req,res){
  res.redirect("/register");
});

//SHOW - POSTS
router.get("/:id", function(req,res){
  User.findById(req.params.id).exec(function(err, user){
    if(err){
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      console.log(err);
    } else {
      Post.find().where('author').equals(user._id).populate("location").sort({createdAt: -1}).exec(function(err, posts){
        if(err) {
          req.flash("error", "Κάτι πήγε στραβά.");
          return res.redirect("/");
        }
        res.render("users/posts",{user: user, posts: posts});
      });
    }
  });
});

// SHOW - LOCATIONS
router.get("/:id/locations", middleware.checkUser, function(req,res){
  User.findById(req.params.id).exec(function(err, user){
    if(err){
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      console.log(err);
    } else {
        res.render("users/locations",{user: user});
    }
  });
});

// SHOW - ADD LOCATION
router.post("/:id/locations/new", middleware.checkUser, function(req,res){
  geocoder.geocode(req.body.newLocation, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash("error", "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    User.findById(req.params.id,function(err,user){
      var i = 0 ;
      var length = user.locations.length;
      while(i < length ) {
        if(user.locations[i].location===location && user.locations[i].name===req.body.newLocationName){
          req.flash("error","Έχετε προσθέσει ήδη αυτή την τοποθεσία.")
          return res.redirect("/users/"+user._id+"/locations");
        }
        i+=1;
      }

      user.locations.push({
        name: req.body.newLocationName,
        location: location,
        locationLat: lat,
        locationLng: lng
      });
      user.save(function(err){
        res.redirect("/users/"+user._id+"/locations");
      })
    });
  });
});

// SHOW - EDIT LOCATION
router.post("/:id/locations/edit", middleware.checkUser, function(req,res){
  geocoder.geocode(req.body.editLocation, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash("error", "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    User.findById(req.params.id,function(err,user){

      var i = 0 ;
      var length = user.locations.length;
      while(i < length ) {
        if(user.locations[i].location===req.body.editLocation && user.locations[i].name===req.body.editLocationName){
          req.flash("error","Η τοποθεσία υπάρχει ήδη.")
          return res.redirect("/users/"+user._id+"/locations");
        }
        i+=1;
      }

      i = 0 ;
      var length = user.locations.length;
      while(i < length ) {
        if(user.locations[i].location===req.query.editLocation && user.locations[i].name===req.query.editLocationName){
          user.locations.splice(i,1);
          break;
        }
        i+=1;
      }

      user.locations.splice(i,0,{
        name: req.body.editLocationName,
        location: location,
        locationLat: lat,
        locationLng: lng
      });
      user.save(function(err){
        res.redirect("/users/"+user._id+"/locations");
      })
    });
  });
});

// SHOW - DELETE LOCATION
router.delete("/:id/locations", middleware.checkUser, function(req,res){
  User.findById(req.params.id,function(err,user){
    var i = 0 ;
    var length = user.locations.length;
    while(i < length ) {
      if(user.locations[i].location===req.query.deleteLocation && user.locations[i].name===req.query.deleteLocationName){
        user.locations.splice(i,1);
        break;
      }
      i+=1;
    }
    user.save(function(err){
      res.redirect("/users/"+user._id+"/locations");
    });
  });
});

// EDIT
router.get("/:id/edit", middleware.checkUser,function(req,res){
  User.findById(req.params.id, function(err, user){
    if(err) {
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      res.redirect("back");
    } else {
      res.render("users/edit",{user: user});
    }
  });
});

// UPDATE
router.put("/:id", middleware.checkUser, upload.single("avatar"),function(req,res){
  geocoder.geocode(req.body.address, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var address = data[0].formattedAddress;
  User.findById(req.params.id, function(err, user){
    if(err) {
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      res.redirect("/");
    } else {
      user.locations.splice(0,1);
      user.username= req.body.username;
      user.firstName= req.body.firstName;
      user.lastName= req.body.lastName;
      user.email= req.body.email;
      user.address= address;
      user.addressLat= lat;
      user.addressLng= lng;
      user.locations.unshift({
        name: "Σπίτι",
        location: address,
        locationLat: lat,
        locationLng: lng
      });
      if(req.file){
        cloudinary.v2.uploader.destroy(user.avatarId,function(err){
          cloudinary.v2.uploader.upload(req.file.path,function(err,result){
            user.avatar = result.secure_url;
            user.avatarId = result.public_id;
            user.save(function(err,user){
              res.redirect("/users/" + req.params.id);
            });
          });
        });
      } else {
        user.save(function(err,user){
          res.redirect("/users/" + req.params.id);
        });
      }
    }
  });
});
});

// BLOCK
router.put("/:id/block", middleware.isAdmin, function(req,res){
  User.findById(req.params.id,function(err,user){
    if(err) {
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      res.redirect("/users/"+req.params.id);
    } else {
      user.isBlocked = true;
      user.points = 0;
      user.save(function(err){
        setTimeout(function(){
          user.isBlocked = false;
          user.save();
        }, 604800000);
        res.redirect("/users/" + req.params.id);
      });
    }
  });
});

// UNBLOCK
router.put("/:id/unblock", middleware.isAdmin, function(req,res){
  User.findById(req.params.id,function(err,user){
    if(err) {
      req.flash("error","Ο χρήστης δεν βρέθηκε.");
      res.redirect("/users/"+req.params.id);
    } else {
      user.isBlocked = false;
      user.save(function(err){
        res.redirect("/users/" + req.params.id);
      });
    }
  });
});

// DESTROY
router.delete("/:id", middleware.checkDeleteUser, function(req,res){
  Post.find().where("author").equals(req.params.id).exec(function(err,posts){
    if(err) {
      console.log(err);
    } else {
      for(var i = 0; i< posts.length ; i++) {
        Store.findByIdAndUpdate(posts[i].location, {$pull: {posts: posts[i]._id}}, {new: true}).exec(function(err){
          if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
        });
        Post.deleteOne(posts[i],function(err){
          if(err){
            console.log(err);
          }
        });
      }
      Review.find().where("author").equals(req.params.id).deleteMany(function(err){
        if(err){
          console.log(err);
        } else {
            User.findById(req.params.id, function(err,user){
              if(err) {
                req.flash("error","Ο χρήστης δεν βρέθηκε.");
                res.redirect("/");
              } else {
                if(user.avatarId != "") {
                  cloudinary.v2.uploader.destroy(user.avatarId,function(err){
                    User.deleteOne(user,function(err){
                      res.redirect("/");
                    });
                  });
                } else {
                User.deleteOne(user,function(err){
                  res.redirect("/");
                });
              }
              }
          });
        }
      });
    }
  });
});

// SHOW POINTS REDEMPTION PAGE
router.get("/:id/redeem",middleware.isUser, middleware.canRedeem, function(req,res){
    User.findById(req.params.id,function(err,user){
      if(err) {
        req.flash("error","Ο χρήστης δεν βρέθηκε.");
        res.redirect("/users/");
      } else {
        if(user._id.equals(req.user._id)) {
          res.render("redeem",{user: user});
        } else {
            req.flash("error","Μπορείτε να εξαργυρώστε μόνο δικούς σας πόντους.");
            res.redirect("back");
        }
      }
    });
});

// SEND EMAIL WITH POINTS REDEPTION QRCODE
router.post("/:id/redeem", middleware.isUser, middleware.canRedeem, function(req, res, next) {
  async.waterfall([ // functons in the array are called one after the other

    // create a token that will be sent with the url as an email and expires after an hour
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString("hex");
        done(err, token);
      });
    },

    // find user with the given email, if is exists in the DB
    function(token, done) {
      User.findById(req.params.id, function(err, user) {
        if (!user) {
          req.flash("error", "Ο χρήστης δεν βρέθηκε.");
          return res.redirect("back");
        }
        if(!user._id.equals(req.user._id)) {
          req.flash("error","Μπορείτε να εξαργυρώστε μόνο δικούς σας πόντους.");
          return res.redirect("back");
        }
        user.redeemPointsToken = token;
        user.redeemPointsExpires = Date.now() + 604800000; // 1 week
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },

    // send the email with nodemailer
    function(token, user, done) {
      // a service is required to send a mail
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.GMAILADDRESS,
          pass: process.env.GMAILPW
        }
      });

      var currentdate = new Date();
      var expiryDate = new Date();
      expiryDate.setDate(currentdate.getDate() + 7);
      expiryDate= expiryDate.getDate().toString() + "/"+ (expiryDate.getMonth()+1).toString()+"/" +expiryDate.getFullYear().toString();

      var datetime = currentdate.getDate().toString() + (currentdate.getMonth()+1).toString() + currentdate.getFullYear().toString();
      var filename = datetime + user.username + "MyFuel.png";
      var link = "http://" + req.headers.host + "/users/" + req.params.id + "/redeem/" + token + "/?redeemPoints=" + req.body.redeemPoints

      const res = qrcode.toCanvas(canvas, link);
      var buf = canvas.toBuffer();
      fs.writeFile(process.cwd()+"/tmp/" + filename, buf, function(err){
        //what the user sees
        var mailOptions = {
          to:  user.email,
          from: "no-reply@myfuel.com",
          subject: "Εξαργύρωση MyFuel πόντων",
          text: "Λαμβάνετε το συγκεκριμένο μήνυμα γιατί εσείς (ή κάποιος άλλος) στείλατε αίτημα για εξαργύρωση πόντων.\n" +
            "Κάντε click στο ακόλουθο link, ή κάντε το επικόλληση στο browser για να εξαργυρώσετε τους " + req.body.redeemPoints + " πόντους σας:\n\n" +
            'http://' + req.headers.host + "/users/" + req.params.id + '/redeem/' + token + "/?redeemPoints=" + req.body.redeemPoints + '\n\n' +
            "Το κουπόνι σας έχει ισχύ μέχρι τις "+expiryDate+".\n\n"+
            'Αν δεν στείλατε εσείς το αίτημα, μπορείτε να αγνοήσετε το mail και οι πόντοι σας θα μείνουν ως έχουν.\n',
          attachments: [{
            filename: "MyFuelRedemption.png",
            path: process.cwd()+"/tmp/" + filename
          }]
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          fs.unlink(process.cwd()+"/tmp/" + filename, function(err){
            if (err) throw err;
          });
          req.flash("success", user.username + ", περισσότερες πληροφορίεςγια την εξαργύρωση των MyFuel πόντων σας έχουν σταλεί στο mail σας.");
          done(err, "done");
        });
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect("/users/" + req.params.id);
  });
});

// SHOW COMPLETE POINTS REDEMPTION PAGE
router.get("/:id/redeem/:token", middleware.isStore, function(req, res) {
  // find the user that has the token and make sure it's not expired
  User.findOne({ redeemPointsToken: req.params.token, redeemPointsExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash("error", "Το κλειδί για εξαργύρωση πόντων είναι άκυρο ή έχει λήξει.");
      return res.redirect("/users/" + req.params.id);
    }
    res.render("actualRedemption", {token: req.params.token, id: req.params.id, user: user, redeemPoints: req.query.redeemPoints});
  });
});

// COMPLETE TRANSACTION
router.post("/:id/redeem/:token", middleware.isStore, function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ redeemPointsToken: req.params.token, redeemPointsExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Ο χρήστης δεν βρέθηκε.");
          return res.redirect("back");
        }
        else {
          user.redeemPointsToken = undefined;
          user.redeemPointsExpires = undefined;
          user.points = user.points - req.query.redeemPoints;
          user.save(function(err){
            done(err,user);
          });
        }
      });
    },

    // password reset confirmation mail
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILADDRESS,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to:  user.email,
        from: "no-reply@myfuel.com",
        subject: "Εξαργύρωση MyFuel πόντων",
        text: "Γεια σας, " + user.username + ",\n\n" +
          "Η συναλλαγή σας ολοκληρώθηκε και " + req.query.redeemPoints + " πόντοι έχουν αφαιρεθεί από το λογαριασμό σας.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err, "done");
      });
    }
  ], function(err) {
    res.render("completeRedemption");
  });
});

module.exports = router;
