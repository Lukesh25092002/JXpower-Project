/* This is user auth router and it is implemented for authorisation of user
It's role it to authorise if user is ligit or not
It contains login and logout and other one time used functionalities*/
const { viewCreateAccount , createNewUserAccount , viewVerifyUserEmail ,verifyEmail , viewUserLogin ,loginUser , logoutUser , viewUserForgotPassword ,userForgotPassword , userResetPassword, viewResetUserPassword } = require("../Controllers/userAuthController.js");
const giveRefererReward = require("../Handlers/giveRefererReward.js");

const express = require("express");
const userAuthRouter = express.Router();


userAuthRouter.route("/createAccount")   // can also contain  refererUsername in query
.get(viewCreateAccount)
.post(createNewUserAccount);


userAuthRouter.route("/verifyEmail/:id")    //The link will be sent in email of user
.get(viewVerifyUserEmail)
.post(verifyEmail,giveRefererReward); // give reward to referer 


userAuthRouter.route("/login")
.get(viewUserLogin)
.post(loginUser);


userAuthRouter.post("/logout",logoutUser);

userAuthRouter.route("/forgotPassword")
.get(viewUserForgotPassword)
.post(userForgotPassword);


userAuthRouter.route("/resetPassword/:id")    //This link will be sent in email
.get(viewResetUserPassword)
.patch(userResetPassword);


module.exports = userAuthRouter; 