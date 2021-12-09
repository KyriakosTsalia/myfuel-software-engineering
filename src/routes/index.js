const express      = require("express"),
      router       = express.Router({mergeParams: true}),
      passport     = require("passport"),
      User         = require("../models/user"),
      async        = require("async"), //important
      nodemailer   = require("nodemailer"), //for
      crypto       = require("crypto"), //password reset
      middleware   = require("../middleware"), //if I require a directory, I automatically require the index.js
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
const upload = multer({ storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ROOT
router.get("/",function(req,res){
  res.render("landing")
});

// SHOW REGISTER FORM
router.get("/register", middleware.isNotLoggedIn, function(req,res){
  res.render("register");
});

// SIGN UP
router.post("/register", middleware.isNotLoggedIn, upload.single("avatar"), function(req,res){
  geocoder.geocode(req.body.address, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash("error", "Η διεύθυνση δεν υπάρχει.");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var address = data[0].formattedAddress;
    if(req.file) {
    cloudinary.v2.uploader.upload(req.file.path, function(err,result) {
    var newUser = new User(
      {
        username: req.body.username,
        avatar: result.secure_url,
        avatarId: result.public_id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        address: address,
        addressLat: lat,
        addressLng: lng
      }
    );
    //check if new user is admin
    if(req.body.adminCode === process.env.ADMIN_CODE) {
      newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
      if(err) {
        req.flash("error", err.message); //print the error message directly provided by the passport-local-mongoose package
        console.log(err);
        return res.redirect("register");
      }
      user.locations.push({
        name: "Σπίτι",
        location: address,
        locationLat: lat,
        locationLng: lng
      });
      user.save();
      passport.authenticate("userLocal")(req,res, function(){
        req.flash("success","Καλως ήρθες στο MyFuel " + user.username + "!");
        res.redirect("/");
      });
    });
  });
    } else {
      var newUser = new User(
        {
          username: req.body.username,
          avatar: "",
          avatarId: "",
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          address: address,
          addressLat: lat,
          addressLng: lng
        }
      );
      //check if new user is admin
      if(req.body.adminCode === process.env.ADMIN_CODE) {
        newUser.isAdmin = true;
      }
      User.register(newUser, req.body.password, function(err, user){
        if(err) {
          req.flash("error", err.message); //print the error message directly provided by the passport-local-mongoose package
          console.log(err);
          return res.redirect("register");
        }
        user.locations.push({
          name: "Σπίτι",
          location: address,
          locationLat: lat,
          locationLng: lng
        });
        user.save();
        passport.authenticate("userLocal")(req,res, function(){
          req.flash("success","Καλως ήρθες στο MyFuel " + user.username + "!");
          res.redirect("/");
        });
      });
    }
  });
});

// SHOW LOGIN FORM
router.get("/login", middleware.isNotLoggedIn, function(req,res){
  res.render("login");
});

// LOGIN
router.post("/login", middleware.isNotLoggedIn, function(req, res, next) {
  passport.authenticate(["userLocal","storeLocal"], function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect("/login"); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      if(user.isBlocked) {
        req.flash("error",user.username+", φαίνεται πως δεν μπορείς να κάνεις προσθήκες προς το παρόν. Μην ανησυχείς, ο MyFuel λογαριασμός σου εξακολουθεί να υπάρχει και τα προνόμια σου θα αποκατασταθούν άμεσα! Για περισσότερες πληροφορίες, οι Όροι Χρήσης θα σε καλύψουν απόλυτα.");
      }
      else {
        req.flash("success","Συνδεθήκατε επιτυχώς!");
      }
      if(req.user.type=="user") {
        return res.redirect("/");
      }
      return res.redirect("/stores/"+req.user._id);
    });
  })(req, res, next);
});

// LOGOUT
router.get("/logout", middleware.isLoggedIn, function(req,res){
  req.logout();
  res.redirect("/");
});

// FAQ
router.get("/faq", function(req,res){
  res.render("faq");
});

// TERMS AND CONDITIONS
router.get("/terms",function(req,res){
  res.render("terms");
});

// PRIVACY POLICY
router.get("/privacy",function(req,res){
  res.render("privacy");
});

// ABOUT US
router.get("/about",function(req,res){
  res.render("about");
});

// STATISTICS
router.get("/statistics", middleware.isUser, function(req,res){
 res.render("chart");
});

// SHOW NEW PASSWORD REQUEST FORM
router.get("/forgot", middleware.isNotLoggedIn, function(req,res){
  res.render("forgot")
});

// SEND EMAIL WITH NEW PASSWORD REQUEST TOKEN
router.post("/forgot", middleware.isNotLoggedIn, function(req, res, next) {
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
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash("error", "Δεν υπάρχει λογαριασμός με το συκεκριμένο email");
          return res.redirect("/forgot");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
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
      //what the user sees
      var mailOptions = {
        to:  user.email,
        from: "no-reply@myfuel.com",
        subject: "Ανάκτηση MyFuel λογαριασμού",
        text: "Λαμβάνετε το συγκεκριμένο μήνυμα γιατί εσείς (ή κάποιος άλλος) στείλατε αίτημα για ανάκτηση του λογαριασμού σας.\n\n" +
          "Κάντε click στο ακόλουθο link, ή κάντε το επικόλληση στο browser για να ολοκληρωθεί η διαδικασία:\n\n" +
          "http://" + req.headers.host + "/reset/" + token + "\n\n" +
          "Αν δεν στείλατε εσείς το αίτημα, μπορείτε να αγνοήσετε το mail και ο κωδικός πρόσβασής σας θα παραμείνει ως έχει.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Στάλθηκε mail στο " + user.email + " με περισσότερες οδηγίες.");
        done(err, "done");
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

// SHOW NEW PASSWORD FORM
router.get("/reset/:token", middleware.isNotLoggedIn, function(req, res) {
  // find the user that has the token and make sure it's not expired
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash("error", "Το κλειδί για ανάκτηση λογαριασμού είναι άκυρο ή έχει λήξει.");
      return res.redirect("/forgot");
    }
    res.render("reset", {token: req.params.token});
  });
});

// NEW PASSWORD GENERATION
router.post("/reset/:token", middleware.isNotLoggedIn, function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Το κλειδί για ανάκτηση λογαριασμού είναι άκυρο ή έχει λήξει.");
          return res.redirect("/forgot");
        }
        // new password given correctly
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) { // passport-local-mongoose method, all the hashing is automatically done
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) { // user is logged in
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Πληκτρολογείστε σωστά το νέο κωδικό πρόσβασής σας.");
            return res.redirect("back");
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
        subject: "Ο κωδικός πρόσβασης για το MyFuel λογαριασμό σας έχει ενημερωθεί.",
        text: "Γεια σας " + user.username + ",\n\n" +
          "Το συγκεκριμένο mail είναι μια επιβεβαίωση ότι ο κωδικός πρόσβασης για το λογαριασμός σας με mail " + user.email + " έχει ενημερωθεί.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Ο λογαριασμός σας ανακτήθηκε με επιτυχία!");
        done(err);
      });
    }
  ], function(err) {
    res.redirect("/");
  });
});

module.exports = router;
