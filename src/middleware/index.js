var Post = require("../models/post");
var User = require("../models/user");
var Review = require("../models/review");

// all middleware will go here
var middlewareObj = {};

middlewareObj.isStore = function(req,res,next){
  if(req.isAuthenticated() && req.user.type=="store"){
    next();
  } else {
    req.flash("error","Η συγκεκριμένη ενέργεια μπορεί να πραγματοποιηθεί μόνο από MyFuel πρατήρια.");
    res.redirect("/");
  }
}

middlewareObj.isUser = function(req,res,next){
  if(req.isAuthenticated() && req.user.type=="user"){
    next();
  } else {
    req.flash("error","Η συγκεκριμένη ενέργεια μπορεί να πραγματοποιηθεί μόνο από MyFuel χρήστες.");
    //res.redirect("/stores/"+req.user._id);
    res.redirect("back");
  }
}

middlewareObj.canRedeem = function(req,res,next) {
  if(req.user.points >= 2000) {
    next();
  } else {
    req.flash("error","Οι MyFuel πόντοι σας δεν είναι αρκετοί για να πραγματοποιείσετε κάποια εξαργύρωση.");
    res.redirect("/users/"+req.user._id);
  }
}

middlewareObj.checkPostOwnership = function(req,res,next){
  if(req.isAuthenticated()) {
    Post.findById(req.params.id, function(err, foundPost){
      if(err) {
        req.flash("error","Η προσφορά δεν βρέθηκε.");
        res.redirect("back"); // takes the user BACK to the previous page they were on
      }
      else {
        // does the user own the post?
        if(foundPost.author.equals(req.user._id) || req.user.isAdmin) { // because found...id is an object and req...id is a String
          next();
        } else {
          req.flash("error","Μπορείτε να επεξεργαστείτε μόνο προσφορές που έχετε προστεθεί από εσάς.");
          res.redirect("back");
        }
      }
    });
  } else {
      req.flash("error","Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
      res.redirect("/login");
  }
}

middlewareObj.checkUser = function(req,res,next){
  if(req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser){
      if(err) {
        req.flash("error","Ο χρήστης δεν βρέθηκε.");
        res.redirect("back"); // takes the user BACK to the previous page they were on
      }
      else {
        // is the user trying to edit their own profile?
        if(foundUser._id.equals(req.user._id) || req.user.isAdmin) { // because found...id is an object and req...id is a String
          next();
        } else {
          req.flash("error","Μπορείτε να επεξεργαστείτε μόνο το δικό σας λογαριασμό.");
          res.redirect("back");
        }
      }
    });
  } else {
      req.flash("error","Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
      res.redirect("/login");
  }
}

middlewareObj.isLoggedIn = function(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("error","Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
  res.redirect("/login");
}

middlewareObj.isNotLoggedIn = function(req,res,next){
  if(!req.isAuthenticated()){
    return next();
  }
  req.flash("error","Είστε ήδη συνδεδεμένος.");
  res.redirect("/");
}

middlewareObj.isAdmin = function(req,res,next){
  if(req.isAuthenticated() && req.user.isAdmin){
    return next();
  } else {
    req.flash("error","Η συγκεκριμένη ενέργεια δεν επιτρέπεται.");
    res.redirect("/");
  }
}

middlewareObj.checkDeleteUser = function(req,res,next){
  if(req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser){
      if(err) {
        req.flash("error","Ο χρήστης δεν βρέθηκε.");
        res.redirect("back"); // takes the user BACK to the previous page they were on
      }
      else {
        // is the user trying to delete their own profile?
        if(foundUser._id.equals(req.user._id)) {
          req.logout();
          req.flash("success","Ο λογαριασμός σας διαγράφηκε.");
          return next();
        }
        //is the user an admin trying to delete someone?
        else if(req.user.isAdmin){ // because found...id is an object and req...id is a String
          req.flash("success","Ο χρήστης διαγράφηκε.");
          next();
        }
        else {
          req.flash("error","Μπορείτε να διαγράψετε μόνο το δικό σας λογαριασμό.");
          res.redirect("back");
        }
      }
    });
  } else {
      req.flash("error","Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
      res.redirect("/login");
  }
}

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                if(foundReview.author.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "Μπορείτε να επεξεργαστείτε μόνο δικές σας κριτικές.");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
        res.redirect("/login");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Post.findById(req.params.id).populate("reviews").exec(function (err, foundPost) {
            if (err || !foundPost) {
                req.flash("error", "Η προσφορά δεν βρέθηκε.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundPost.reviews
                var foundUserReview = foundPost.reviews.some(function (review) {
                    return review.author.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "Έχετε γράψει ήδη κριτική.");
                    return res.redirect("back");
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "Για τη συγκεκριμένη ενέργεια, είναι απαραίτητο να είστε συνδεδεμένοι.");
        res.redirect("/login");
    }
};

module.exports = middlewareObj;
