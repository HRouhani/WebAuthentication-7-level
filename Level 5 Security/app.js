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
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true

}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//change from simple version to full-version to be able to use the mongoose-encryption 
//so we create a schema from mongoose.schema class
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});
//we remove following secret and moved it to .env file as part of the dotenv to be used!
// const secret = "ThisISthesecretUSEtoEncrypt.";

//the following plugin will encrypt everything in our database which means username/password, but 
//our purpose is to encrypt only the Password, so we change
//userSchema.plugin(encrypt, {secret: secret});
//Level 4, we use hash and no need
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


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
    bcrypt.hash(request.body.password, saltRounds, function(err, hash) {

        const newUser = new User({
            email: request.body.username,
            //password: request.body.password
            password: hash
        });
        //when the save being called, behind the scene mangoose-encryption package will encrypt the password 
        //with the secret that we have defined!
        newUser.save(function(error){
            if (error){
                console.log(error);
            } else {
                //Only rendering the secrets page when user already registered or did a Login
                response.render("secrets")
            }
        });


    });

    
});

//to catch when user in Login page his email/password, but we nee check if its already exist in database
app.post("/login", function(request, response){
    const username = request.body.username;
    //const password = request.body.password;
    //const password = md5(request.body.password);
    const password = request.body.password;
    //now we check if we can find any match in our db for the username (email) that user entered.
    //when we call find, mangoose will automatically decrypt the password field behind the scene!
    User.findOne({email: username}, function(error, foundUser){
        if (error){
            console.log(error);
        } else {
            if (foundUser){
                //if (foundUser.password == password){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result == true){
                        response.render("secrets")
                    }else {
                        response.send("Bad Password Bastard!")
                    }
                        
                });
                    
            }
        }
    
    });
});

app.listen(3000, function(){
    console.log("server started on port 3000!");

});