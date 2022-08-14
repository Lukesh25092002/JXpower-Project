/* This is adminAuth router and it is implemented for authorisation of admin
It's role it to authorise if admin is ligit or not
It contains login and logout and other one time used functionalities*/
const express = require("express");
const { viewAdminLogin , loginAdmin , logoutAdmin , viewAdminForgotPassword , adminForgotPassword , viewResetAdminPassword , adminResetPassword } = require("../Controllers/adminAuthController.js");
const adminAuthRouter = express.Router();

adminAuthRouter.route("/login")
.get(viewAdminLogin)
.post(loginAdmin);

adminAuthRouter.post("/logout",logoutAdmin);

adminAuthRouter.route(`/forgotPassword/${process.env.ADMIN_FORGOT_PASSWORD_ROUTE_SECRET_KEY}`)
.get(viewAdminForgotPassword)
.post(adminForgotPassword);

adminAuthRouter.route(`/resetPassword/${process.env.ADMIN_RESET_PASSWORD_ROUTE_SECRET_KEY}/:id`)    //This link will be sent in email
.get(viewResetAdminPassword)
.patch(adminResetPassword);



module.exports = adminAuthRouter;