//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const { request } = require("http");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true

}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = {
    email: String,
    password: String
};

const User = new mongoose.model("User", userSchema );

app.get("/", function(request, response){
    response.render("home");
});

app.get("/login", function(request, response){
    response.render("login");
});

app.get("/register", function(request, response){
    response.render("register");
});

//to catch when the user go to Register Page (or Login page) and submit his email address and Password
app.post("/register", function(request, response){
    const newUser = new User({
        email: request.body.username,
        password: request.body.password
    });
    newUser.save(function(error){
        if (error){
            console.log(error);
        } else {
            //Only rendering the secrets page when user already registered or did a Login
            response.render("secrets")
        }
    });
});

//to catch when user in Login page his email/password, but we nee check if its already exist in database
app.post("/login", function(request, response){
    const username = request.body.username;
    const password = request.body.password;
    //now we check if we can find any match in our db for the username (email) that user entered.
    User.findOne({email: username}, function(error, foundUser){
        if (error){
            console.log(error);
        } else {
            if (foundUser){
                if (foundUser.password == password){
                    //after user did login successfully which means his password match to what exist in db, then he will 
                    //redirected to secrets page!
                    response.render("secrets")
                }else {
                    response.send("Bad Password Bastard!")
                }
            }
        }
    
    });
});

app.listen(3000, function(){
    console.log("server started on port 3000!");

});