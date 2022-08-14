/* This is adminAuthController and in relational to the adminAuth router
Here all the functions that were used in adminAuthuth router are actually defined
This is custom module and exports all the functions to adminAuthRouter
*/
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const adminModel = require("../Models/adminModel.js");
const adminForgotPasswordModel = require("../Models/adminForgotPasswordModel.js");
const transporter = require("../Helpers/transporter.js");
const generateOTP = require("../Helpers/generateOTP.js");


// This function will view the login page for the admin
// nothing is expected in the request
// This is get type request
async function viewAdminLogin(req, res) {
    res.render("adminLogin.ejs", {});
};


// This function will login the admin
// login credentials like email and password expected in the request
// This is post type request
async function loginAdmin(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    if (email == undefined || email == "" || password == undefined || password == "") {
        res.status(400).json({
            status: "failed",
            message: "Email and password cannot be empty",
            description: "You have left username and password feilds empty"
        });
        return;
    }

    let adminRecord = null;
    try {
        adminRecord = await adminModel.findOne({ email: email });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was server error in fetching adminRecord"
        });
        return;
    }
    if (adminRecord == null) {
        res.status(401).json({
            status: "failed",
            message: "Incorrect Email",
            description: "Couldn't find any entry in the database with the email as " + email
        });
        return;
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, adminRecord['password']);
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was server error in validating password via bcrypt"
        });
        return;
    }
    if (!isValidPassword) {
        res.status(401).json({
            status: "failed",
            message: "Incorrect Password",
            description: "The password that you enterd for " + adminRecord['username'] + " dose not match with the one in database"
        });
        return;
    }

    try {
        const token = await jsonwebtoken.sign(String(adminRecord['_id']), process.env.SERVER_SECRET_KEY);
        res.cookie("auth-token", token);
    } catch (err) {
        res.status(500).json({
            status: "failed",
            message: err.message,
            description: "There was some problem in server side, token couldnt be generated"
        });
        return;
    }

    res.json({
        status: "success",
        message: "Congrulations!, You are logged in",
        description: "All is well"
    });
}



// This function will logout out of the admin acccount
// Nothing in the request in required
// The cookie containig JWT will be removed
async function logoutAdmin(req, res) {
    res.cookie("auth-token", undefined, { maxAge: 1 });

    res.json({
        message: "You are logged out",
        description: "The jwt is removed from your cookie section, now auth token in undefined and just after 1 millisecond the cookie named auth-token will also be destroyed"
    });
}



// This function will view the forgot password page for admin
// nothing is expected in request
// This is a get type request
async function viewAdminForgotPassword(req, res) {
    res.render("adminForgotPassword.ejs", {});
}



// This function forgot password for admin
// The registered email is required for in body of request
// An email will be sent to that email containing the resetPassword link
async function adminForgotPassword(req, res) {
    const email = req.body.email;

    let adminRecord = null;
    try {
        adminRecord = await adminModel.findOne({ email: email });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in finding adminRecord from adminModel"
        });
        return;
    }
    if (adminRecord == null) {
        res.status(400).json({
            message: "The admin with email couldnt be found",
            description: "The email id is not found in the adminModel"
        });
        return;
    }

    try {
        await adminForgotPasswordModel.deleteMany({ adminID: adminRecord['_id'] });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in deleting previous records"
        });
        return;
    }

    const dynamic_link = `http://localhost/adminAuth/resetPassword/${process.env.ADMIN_RESET_PASSWORD_ROUTE_SECRET_KEY}/${adminRecord['_id']}`;
    try {
        const newOTP = generateOTP();
        const newAdminForgotPasswordRecord = new adminForgotPasswordModel({
            adminID: adminRecord['_id'],
            OTP: String(newOTP),
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000    // 5 minnutes
        });
        await newAdminForgotPasswordRecord.save();

        const mailOptions = {
            from: `Power Charge 👻  <${process.env.ADMIN_EMAIL_ID}>`, // sender address
            to: adminRecord['email'], // list of receivers
            subject: "You requested for forgot password", // Subject line
            text: `Heres the link for resetting your password
            ${dynamic_link}
            and the OTP is ${newAdminForgotPasswordRecord['OTP']}
            Click on the above link to and enter above OTP and create a new password
            Do not share this link as well as OTP with anyone!`, // plain text body
            //html: "<b>Hello world?</b>", // html body
        };
        await transporter.sendMail(mailOptions);
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in storing newAdminForgetPasswordRecord in adminForgotPasswordModel or either sending email"
        });
        return;
    }

    res.json({
        message: "This is a success message",
        description: "Reset password link has been sent to your email,All is Well",
        redirectLink: dynamic_link
    });
}



// This function will reset the admin's password, the admin is required to opt forget password to get to this route in his email
// The id of admin in request parameters and new password and OTP in request body is required
// This is a post type request
async function adminResetPassword(req, res) {
    const OTP = req.body.OTP;
    const newPassword = req.body.password;
    const adminID = req.params.id;
    if (adminID == undefined || adminID == "" || newPassword == undefined || newPassword == "" || OTP == undefined || OTP == "") {
        res.json({
            message: "adminID and password cannot be empty",
            description: "the required fields are empty or undefined id of admin in params and new password adn OTP in req body"
        });
        return;
    }

    let adminRecord = null;
    try {
        adminRecord = await adminModel.findOne({ '_id': adminID });
    } catch (err) {
        res.json({
            message: err.message,
            description: "Whenever the id dosent match it gives a fatal error, the _id dosent match with anyone"
        });
        return;
    }

    if (adminRecord == null) {
        res.json({
            message: "No such admin found",
            description: "on searching the adminID in adminModel no record was found"
        });
        return;
    }

    const adminForgotPasswordRecord = await adminForgotPasswordModel.findOne({ adminID: adminRecord['_id'] });
    if (adminForgotPasswordRecord == null) {
        res.json({
            message: "The record couldnt be found",
            description: "There was no adminForgotPasswordRecord for the corresponding admin in adminForgotPasswordModel, this means the admin never requested for forgot password"
        });
        return;
    }

    if (adminForgotPasswordRecord.expiresAt <= Date.now()) {
        try {
            await adminForgotPasswordRecord.delete();
        } catch (err) {
            res.json({
                message: "The adminForgotPaswordRecord is not valid",
                description: "Expired already plus the previous records couldnt be deleted due to some eunknown problems"
            });
        }
        res.json({
            messsage: "The adminForgotPaswordRecord is no longer valid",
            description: "The adminForgotPasswordRecord has expired, the forgot password option was issued by the admin much time earlier"
        });
        return;
    }

    if (OTP != adminForgotPasswordRecord['OTP']) {
        res.json({
            message: "incorrect OTP",
            description: "Your OTP dosenot match with the one in adminForgotPasswordRecord"
        });
        return;
    }

    let updatedData = undefined;
    try {
        const salt = await bcrypt.genSalt();
        const newHashedPassword = await bcrypt.hash(newPassword, salt);
        await adminForgotPasswordRecord.deleteOne();
        updatedData = await adminRecord.updateOne({ password: newHashedPassword });
    } catch (err) {
        res.json({
            message: err.message,
            description: "There was error in updating adminRecord with newHashedPassword"
        });
    }

    res.json({
        message: "This is a success message",
        dexcription: `The execution reached till the end of the function, the details of ${adminRecord['username']} are successfully updated also the forgot password record deleted`,
        data: updatedData
    });
}



// This function will reset the admin's password, the admin is required to opt forget password to get to this route in his email
// The id of admin in request parameters and new password and OTP in request body is required
// This is a get type request
async function viewResetAdminPassword(req, res) {
    res.render("resetAdminPassword.ejs", {});
}



// This function will reset the admin's password, the admin is required to opt forget password to get to this route in his email
// The id of admin in request parameters and new password and OTP in request body is required
// This is a patch type request
async function adminResetPassword(req, res) {
    const OTP = req.body.OTP;
    const newPassword = req.body.password;
    const adminID = req.params.id;

    if (adminID == undefined || adminID == "" || newPassword == undefined || newPassword == "" || OTP == undefined || OTP == "") {
        res.status(400).json({
            message: "userID and password and OTP cannot be empty",
            description: "the required fields are empty or undefined id of user in params and new password and OTP in req body"
        });
        return;
    }

    let adminRecord = null;
    try {
        adminRecord = await adminModel.findOne({ '_id': adminID });
    } catch (err) {
        res.status(401).json({
            message: err.message,
            description: "Whenever the id dosent match it gives a fatal error, the _id dosent match with anyone"
        });
        return;
    }

    if (adminRecord == null) {
        res.status(401).json({
            message: "No such admin found",
            description: "on searching the adminID in adminModel so record was found"
        });
        return;
    }

    let adminForgotPasswordRecord = null;
    try {
        adminForgotPasswordRecord = await adminForgotPasswordModel.findOne({ adminID: adminRecord['_id'] });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was a problem in finding adminForgotPasswordRecord from adminForgotPasswordModel"
        });
        return;
    }
    if (adminForgotPasswordRecord == null) {
        res.status(403).json({
            message: "The record couldnt be found",
            description: "There was no adminForgotPasswordRecord for the corresponding admin in adminForgotPasswordModel, this means the admin never requested for forgot password"
        });
        return;
    }

    if (adminForgotPasswordRecord.expiresAt <= Date.now()) {
        try {
            await adminForgotPasswordRecord.delete();
        } catch (err) {
            res.status(500).json({
                message: "The adminForgotPasswordRecord is not valid",
                description: "Expired already plus  the previous records couldnt be deleted due to som eunknown problems"
            });
            return;
        }
        res.status(403).json({
            messsage: "The adminForgotPasswordRecord is no longer valid",
            description: "The adminForgotPasswordRecord has expired, the forgot password option was issued by the user much time earlier"
        });
        return;
    }

    if (OTP != adminForgotPasswordRecord['OTP']) {
        res.status(401).json({
            message: "The OTP is incorrect",
            description: "The OPT you entered dose not match with one stored in userForgotPasswordModel"
        });
        return;
    }

    try {
        const salt = await bcrypt.genSalt();
        const newHashedPassword = await bcrypt.hash(newPassword, salt);
        await adminForgotPasswordRecord.deleteOne();
        await adminRecord.updateOne({ password: newHashedPassword });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in updating userRecord with newHashedPassword"
        });
    }

    res.json({
        message: "This is a success message",
        dexcription: `The execution reached till the end of the function, the detaills of ${adminRecord['username']} are successfully updated also the forgot password record deleted`
    });
}

module.exports = {
    viewAdminLogin,
    loginAdmin,
    logoutAdmin,
    viewAdminForgotPassword,
    adminForgotPassword,
    viewResetAdminPassword,
    adminResetPassword
}