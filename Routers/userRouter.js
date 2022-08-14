/* This is user router
 It will handle all the request get,post,patch etc for users */
const express = require("express");
const { viewUserProfile , viewUserCurrentPlans , viewUpdateUserProfile , updateUserProfile, viewUserWallet , viewUserWalletCredit , userWalletCredit ,viewUserWalletDebit , userWalletDebit , viewAllPlans , purchasePlan , viewContactUs , contactUs } = require("../Controllers/userController.js");
const verifyUserLoggedIn = require("../Handlers/verifyUserLoggedIn.js");
const upload = require("../Handlers/upload.js");
const bodyParser = require("body-parser");

const userRouter = express.Router();
userRouter.use(verifyUserLoggedIn);


userRouter.get("/myProfile",viewUserProfile);

userRouter.route("/updateProfile")
.get(viewUpdateUserProfile)
.post(updateUserProfile);

userRouter.get("/currentPlans",viewUserCurrentPlans);

userRouter.get("/wallet",viewUserWallet);

userRouter.route("/wallet/credit")
.get(viewUserWalletCredit)   // Paying topup via stripe
.post(userWalletCredit);

userRouter.route("/wallet/debit")
.get(viewUserWalletDebit)    //Withdraw money from user wallet
.post(userWalletDebit);

userRouter.route("/plans")
.get(viewAllPlans)
.post(purchasePlan);

userRouter.route("/contactUs")
.get(viewContactUs)
.post(contactUs);



module.exports = userRouter;