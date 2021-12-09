require("dotenv").config();
const express        = require("express"),
      app            = express(),
      bodyParser     = require("body-parser"), //bodyParser is used for POST requests
      mongoose       = require("mongoose"),
      passport       = require("passport"),
      session        = require("express-session"),
      flash          = require("connect-flash"),
      LocalStrategy  = require("passport-local"),
      User           = require("./models/user"),
      Store          = require("./models/store"),
      methodOverride = require("method-override"),
      fs             = require('fs'),
      https          = require('https');


// require ROUTES
const reviewRoutes      = require("./routes/reviews"),
      postRoutes        = require("./routes/posts"),
      indexRoutes       = require("./routes/index"),
      storeRoutes       = require("./routes/stores"),
      userRoutes        = require("./routes/users");

// require API routes
const APIPostRoutes        = require("./routes/api_posts");
const APIStoreRoutes       = require("./routes/api_stores");
const APILoginRoutes       = require("./routes/api_login");


// APP CONFIG
const options = {
  autoIndex: false, // Don't build indexes
  reconnectTries: 30, // Retry up to 30 times
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0
}

const connectWithRetry = () => {
console.log('MongoDB connection with retry')
mongoose.connect("mongodb://mongodb:27017/myFuel_databaset", options).then(()=>{
  console.log('MongoDB is connected')
}).catch(err=>{
  console.log('MongoDB connection unsuccessful, retry after 5 seconds.')
  setTimeout(connectWithRetry, 5000)
})
}

connectWithRetry()

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine","ejs")


// passport CONFIG
app.use(session({
  secret: "MyFuel is the best crowdsourcing app there is",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use("userLocal", new LocalStrategy(User.authenticate()));
passport.use("storeLocal", new LocalStrategy(Store.authenticate()));
passport.serializeUser(function (entity, done) {
    done(null, { id: entity.id, type: entity.type });
});

passport.deserializeUser(function (obj, done) {
  switch (obj.type) {
    case "user":
      User.findById(obj.id)
        .then(user => {
          if (user) {
            done(null, user);
          } else {
              done(new Error('user id not found:' + obj.id, null));
            }
          });
        break;
    case "store":
      Store.findById(obj.id)
        .then(device => {
          if (device) {
            done(null, device);
          } else {
              done(new Error('device id not found:' + obj.id, null));
            }
          });
        break;
    default:
      done(new Error('no entity type:', obj.type), null);
      break;
  }
});

app.use(async function(req,res,next){
  res.locals.currentUser = req.user;
  res.locals.error       = req.flash("error");
  res.locals.success     = req.flash("success");
  next();
});

app.use("/",indexRoutes);
app.use("/posts",postRoutes);
app.use("/posts/:id/reviews", reviewRoutes);
app.use("/stores",storeRoutes);
app.use("/users",userRoutes);

app.use("/api/posts",APIPostRoutes);
app.use("/api/stores",APIStoreRoutes);
app.use("/api/login",APILoginRoutes);

// BLANK PAGE
app.get("*",function(req,res){
  res.render("blank");
});

// PORT
const port = process.env.PORT || 3000;

var httpsOptions = {
	            key: fs.readFileSync('./certs/key.pem'),
	            cert: fs.readFileSync('./certs/certificate.pem')
};

// START SERVER
const http_server = app.listen(port,()=> console.log(`The MyFuel Server has started on port ${port} for http and port ${port+1} for https`));
const https_server = https.createServer(httpsOptions, app).listen(port+1);

// STOP SERVER
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received");
  console.log("Closing HTTP server...");
  https_server.close(() => {
    console.log("Https server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
  http_server.close(() => {
    console.log("Http server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
