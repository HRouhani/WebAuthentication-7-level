//jshint esversion:6
//we only need to require it and then call config on it!
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { request } = require("http");
//level 4, no need
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { stringify } = require('querystring');




const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true

}));

//same as before we can put this sectet at .dotenv (.env) file by using the module!
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
//use passport for dealing with session!
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
//Error we got-> (node:19164) DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead
mongoose.set("useCreateIndex", true);


//change from simple version to full-version to be able to use the mongoose-encryption 
//so we create a schema from mongoose.schema class
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
});

//to salt and hash our password, and save them in mongo database!
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);
//we remove following secret and moved it to .env file as part of the dotenv to be used!
// const secret = "ThisISthesecretUSEtoEncrypt.";

//the following plugin will encrypt everything in our database which means username/password, but 
//our purpose is to encrypt only the Password, so we change
//userSchema.plugin(encrypt, {secret: secret});
//Level 4, we use hash and no need
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema );

//we use passportlocalMangoose to create local login strategy
passport.use(User.createStrategy());
 
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());
// I did not use previous code (from passport-local-mongoose), since the following general passport serialization/deserilization code
// work with any stratetgy including of google
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //to see the complete profile of the user in google  
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(request, response){
    response.render("home");
});

//this part will enable our bottom created in Register/Login to popo up the Google login website
app.get("/auth/google",
  //profile which includes email as well as userID
  passport.authenticate('google', { scope: ["profile"] })
  );

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(request, response){
    response.render("login");
});

app.get("/register", function(request, response){
    response.render("register");
});

//in level 6, through cookies, we create a route secrets, since if the user directly go to this page
//they should be able to see it if they are still logged in (cookies being used)! -> we use all 5 packages 
//that we have installed for this prupose!
app.get("/secrets", function(request, response){
    if (request.isAuthenticated()){
        response.render("secrets");
    } else {
        response.redirect("/login");
    }
});

app.get("/logout", function(request, response){
    //in passport there is a function that can deauthenticate user and end its session!
    request.logout();
    response.redirect("/");
});

//to catch when the user go to Register Page (or Login page) and submit his email address and Password
app.post("/register", function(request, response){
    //we use passportlocalmangoose as a middle man to handle manythings for us here!
    User.register({username: request.body.username}, request.body.password, function(error, user){
        if (error){
            console.log(error),
            response.redirect("/register");
        } else {
            //if there is no error, then we authenticate first the user, which basically means we managed
            //to successfully setup a cookie which saved the current login session and check if they already logged in!
            passport.authenticate("local")(request, response, function(){
                response.redirect("/secrets");
            });
        }
    });  
});

//to catch when user in Login page his email/password, but we nee check if its already exist in database
app.post("/login", function(request, response){
    
    const user = new User({
        username: request.body.username,
        password: request.body.password
    });
    //we use login function from passport on the user that we want to login, 
    request.login(user, function(error){
        if (error){
            console.log(error);
        } else {
            //the authenticate function basically here or in Register part, will send a cookie to the 
            //client browser and tell them to hold on that cookie, and since the cookie has some information,
            //it will tell our server(backend) about that user if they are authorize to see the secrects page or not!
            passport.authenticate("local")(request, response, function(){
                response.redirect("/secrets");
            });
        }

    });
    
});

app.listen(3000, function(){
    console.log("server started on port 3000!");

});