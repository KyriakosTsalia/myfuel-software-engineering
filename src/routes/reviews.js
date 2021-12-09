const express    = require("express"),
      router     = express.Router({mergeParams: true}),
      Post       = require("../models/post"),
      Review     = require("../models/review"),
      User       = require("../models/user.js"),
      middleware = require("../middleware");

// INDEX - SHOW ALL REVIEWS ABOUT A POST
router.get("/", function (req, res) {
    Post.findById(req.params.id).populate({
        path: "reviews",
        populate: {path: "author"},
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, post) {
        if (err || !post) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {post: post});
    });
});

// NEW - SHOW NEW REVIEW FORM
router.get("/new", middleware.isUser, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the post, only one review per user is allowed
    Post.findById(req.params.id, function (err, post) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {post: post});
    });
});

// CREATE REVIEW
router.post("/", middleware.isUser, middleware.checkReviewExistence, function (req, res) {
    Post.findById(req.params.id).populate("reviews").exec(function (err, post) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated post to the review
            review.author = req.user._id;
            review.post = post;
            //save review
            review.save();
            post.reviews.push(review);
            // calculate the new average review for the post
            post.rating = calculateAverage(post.reviews);
            //save campground
            post.save();
            User.findById(post.author,function(err,user){
              if(err){
                req.flash("error", err.message);
                return res.redirect("back");
              } else {
                if(user.ratedPosts === 0) {
                  user.ratedPosts = user.ratedPosts + 1;
                  user.rating = review.rating;
                } else {
                  user.rating = (user.rating * user.ratedPosts + review.rating) / (user.ratedPosts + 1);
                  user.ratedPosts = user.ratedPosts + 1;
                }
                user.save(function(err){
                  res.redirect('/posts/' + post._id);
                });
              }
            });
        });
    });
});

// EDIT - SHOW EDIT FORM
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
  Post.findById(req.params.id, function(err, post){
    if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
    } else {
      Review.findById(req.params.review_id, function (err, review) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {post: post, review: review});
      });
    }
  });
});

// UPDATE REVIEW
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
  Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
  }
    Post.findById(req.params.id).populate("reviews").exec(function (err, post) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      // recalculate post average
      post.rating = calculateAverage(post.reviews);
      //save changes
      post.save(function(err){
        res.redirect('/posts/' + post._id);
      });
    });
  });
});

// DESTROY REVIEW
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
  Review.findByIdAndRemove(req.params.review_id, function (err) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    Post.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, post) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      // recalculate campground average
      post.rating = calculateAverage(post.reviews);
      //save changes
      post.save(function(err){
        res.redirect("/posts/" + req.params.id);
      });
    });
  });
});

module.exports = router;

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}
