/* This is admin router and will handle all the actions associated with admi
just like userRouter for admin*/
const express = require("express");
const verifyAdminLoggedIn = require("../Handlers/verifyAdminLoggedIn.js");
const { viewAdminPanel , viewUserPaymentRequests , deleteUserPaymentRequest , viewAllUserInformation ,viewAllPlanInformation } = require("../Controllers/adminController.js");

const adminRouter = express.Router();
adminRouter.use(verifyAdminLoggedIn);

adminRouter.get("/panel",viewAdminPanel);

adminRouter.route("/payments")
.get(viewUserPaymentRequests)     // open the ejs file in browser
.delete(deleteUserPaymentRequest)        // This will assume that the payment is made
.post(async function(req,res){
    console.log(req.body);
    res.json({
        message: "Sab thick",
        description: "This is just a timepass message"
    });
});


adminRouter.route("/userInformation")
.get(viewAllUserInformation);     //This is page is view only admin cannot do anythingexcept viewing

adminRouter.route("/planInformation")
.get(viewAllPlanInformation);     //This is page is view only admin cannot do anythingexcept viewing

module.exports = adminRouter;