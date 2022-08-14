/* This is authController and in relational to the authoristion router
Here all the functions that were used in auth router are actually defined
This is custom module and exports all the functions to authRouter
*/
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const temporaryUserModel = require("../Models/temporeryUserModel");
const userModel = require("../Models/userModel");
const userEmailVerificationModel = require("../Models/userEmailVerificationModel.js");
const userForgotPasswordModel = require("../Models/userForgotPasswordModel.js");
const transporter = require("../Helpers/transporter.js");
const generateOTP = require("../Helpers/generateOTP.js");


// This is function will open create account page
// Nothing expected in request
// post type request
async function viewCreateAccount(req, res) {
    res.render("createAccount.ejs", {});
}


// This is function will create a new account
// refererUsername in query and username, password,email in request body
// post type request
async function createNewUserAccount(req, res) {
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const refererUsername = req.query.refererUsername;

    if (username == undefined || username == "" || email == undefined || email == "" || password == undefined || password == "") {
        res.status(401).json({
            message: "The username email and password cannot be empty",
            description: "All the necessary feilds  are not filled"
        });
        return;
    }

    let rea1 = await userModel.findOne({ username: username });
    let rea2 = await userModel.findOne({ email: email });
    if (rea1 != null || rea2 != null) {
        // this account already present in database
        res.status(400).json({
            message: "The details are overlapping",
            description: "Somebody else has already used the username or email"
        });
        return;
    }

    //hashing needs to be implemented
    let salt = await bcrypt.genSalt(3);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newTemporaryUserRecord = new temporaryUserModel({
        username: username,
        email: email,
        password: hashedPassword
    });

    try {    // deleting the previous unverified records and adding new record in temporaryUserModel
        await temporaryUserModel.deleteMany({ username: username });
        await temporaryUserModel.deleteMany({ email: email });
        await newTemporaryUserRecord.save();
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "The user couldnt be created due to some unknown error"
        });
        return;
    }

    //transporter
    const newOTP = generateOTP();
    const dynamic_link = `http://localhost/userAuth/verifyEmail/${newTemporaryUserRecord['_id']}`;
    const mailOptions = {
        from: '"Power Charge 👻" <lukeshpatil05@gmail.com>', // sender address
        to: newTemporaryUserRecord['email'], // list of receivers
        subject: "Email Verification", // Subject line
        text: `You are creating a new account on Power Charge
        This is the email verification OTP ${newOTP}
        Enter this OTP on this link now ${dynamic_link}
        Hurry Up! the OTP will expire after 5 minutes` // plain text body
        //html: "<b>Hello world?</b>", // html body
    };

    try {
        await transporter.sendMail(mailOptions);
        await userEmailVerificationModel.findOneAndDelete({ temporaryUserID: newTemporaryUserRecord['_id'] });
        const newUserEmailVerificationRecord = new userEmailVerificationModel({
            temporaryUserID: newTemporaryUserRecord['_id'],
            OTP: newOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000,    // 5 minutes
            refererUsername: refererUsername
        });
        await newUserEmailVerificationRecord.save();
    } catch (err) {
        await newTemporaryUserRecord.delete();
        res.status(500).json({
            message: err.message,
            description: "modemailer couldnt send mail, the email ID or there was a problem in storig data in database of userEmailVerification",
        });
        return;
    }

    res.json({
        status: "email verification pending",
        message: "User successfully created",
        description: "new account been added in database of user, This account is not stored in actual database but a temprory one and is not considered valid",
        dynamic_link: dynamic_link
    });
}



// This function will open veriifyEmail page to verify the email of newly created user account
// userID in the parameters of request expected ( create account process should be done first )
// This is a get type request
async function viewVerifyUserEmail(req, res) {
    res.render("verifyUserEmail.ejs", {});
}


// This function will verify the email to verify the email of newly created user account
// userID in the parameters and OTP in body of request expected ( create account process should be done first )
// This is a post type request
async function verifyEmail(req, res, next) {
    const temporaryUserRecord = await temporaryUserModel.findOne({ _id: req.params.id });
    if (temporaryUserRecord == null) {
        res.status(400).json({
            myStatus: "failed",
            message: "No required details in request",
            description: "_id is not present in request, so how can we find the record in userEmailVerificationModel and temporaryUserModel ?"
        });
        return;
    }

    const temporaryUserID = temporaryUserRecord['_id'];
    const OTP = req.body.OTP;
    if (temporaryUserID == undefined || temporaryUserID == "" || OTP == undefined || OTP == "") {
        res.status(401).json({
            myStatus: "failed",
            message: "No required details in request",
            description: "OTP not present in request, so how can we find the record in userEmailVerificationModel?"
        });
        return;
    }

    const userEmailVerificationRecord = await userEmailVerificationModel.findOne({ temporaryUserID: temporaryUserID });
    if (userEmailVerificationRecord == null) {
        res.status(401).json({
            myStatus: "failed",
            message: "wrong information in request",
            description: "no record found in database with match with userID"
        });
        return;
    }

    if (userEmailVerificationRecord.expiresAt <= Date.now()) {
        await userEmailVerificationRecord.delete();
        res.status(401).json({
            myStatus: "failed",
            message: "You are too late",
            description: "The record is already expired and too old"
        });
        return;
    }

    if (userEmailVerificationRecord.OTP != OTP) {
        res.status(401).json({
            myStatus: "failed",
            message: "Incorrect OTP",
            description: "The OTP in the database dose not match with the otp in user request"
        });
        return;
    }

    req.refererUsername = userEmailVerificationRecord['refererUsername'];
    try {
        await userEmailVerificationRecord.delete();
        const newUserRecord = new userModel({
            username: temporaryUserRecord['username'],
            email: temporaryUserRecord['email'],
            password: temporaryUserRecord['password'],
            verified: true,
            walletBalance: 5,    // this 5 rupees is fixed sign up bonus
            referralLink: `localhost/auth/createAccount?refererUsername=${temporaryUserRecord['username']}`
        });
        await newUserRecord.save();
        await temporaryUserRecord.delete();
    } catch (err) {
        res.status(500).json({
            myStatus: "failed",
            message: err.message,
            description: 'There was a problem from server side in updating the user record'
        });
        return;
    }
    res.json({
        myStatus: "success",
        message: "Your email has been verified",
        description: "Everything is all right, the excution has gone till the endof function"
    });
    next();  // will give 5 RS reward to the referer
}



// This function will login the user
// Nothing required in the request
// This is get type request
async function viewUserLogin(req, res) {
    res.render("userLogin.ejs");
}


// This function will login the user
// login credentials like email and password expected in the request body, password not of email but of the account associateed with that email
// This is post type request
async function loginUser(req, res) {
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

    let userRecord = null;
    try{
        userRecord = await userModel.findOne({ email: email });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was server error in fetching user record"
        });
        return ;
    }
    if (userRecord == null) {
        res.status(401).json({
            status: "failed",
            message: "Incorrect Email",
            description: "Couldn't find any entry in the database with the email as " + email
        });
        return;
    }

    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, userRecord['password']);
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was server error in validating password via bcrypt"
        });
        return ;
    }
    if (!isValidPassword) {
        res.status(401).json({
            status: "failed",
            message: "Incorrect Password",
            description: "The password that you enterd for " + userRecord['username'] + " dose not match with the one in database"
        });
        return;
    }

    try {
        const token = await jsonwebtoken.sign(String(userRecord['_id']), process.env.SERVER_SECRET_KEY);
        res.cookie("auth-token", token);
    } catch (err) {
        res.status(500).json({
            status: "failed",
            message: err.message,
            description: "There was some problem in server side, token couldnt be generated"
        });
        return ;
    }

    res.json({
        status: "success",
        message: "Congrulations!, You are logged in",
        description: "All is well"
    });
};



// This function will logout out of the user acccount
// Nothing in the request in required
// The cookie containig JWT will be removed
async function logoutUser(req, res) {
    res.cookie("auth-token", undefined, { maxAge: 1 });

    res.json({
        message: "You are logged out",
        description: "The jwt is removed from your cookie section, now auth token in undefined and just after 1 millisecond the cookie named auth-token will also be destroyed"
    });
}



// This function will view the forgot password page for user
// nothing is expected in request
// This is a get type request
async function viewUserForgotPassword(req, res) {
    res.render("userForgotPassword.ejs", {});
}



// This function will sent a link to email of user to reset his password
// email is expected in request
// This is a post type request
async function userForgotPassword(req, res) {
    const email = req.body.email;

    let userRecord = null;
    try{
        userRecord = await userModel.findOne({ email: email });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was error in finding userRecord from userModel"
        });
        return ;
    }
    if (userRecord == null) {
        res.status(400).json({
            message: "The user with email couldnt be found",
            description: "The email id is not found in the userModel"
        });
        return;
    }

    try {
        await userForgotPasswordModel.deleteMany({ userID: userRecord['_id'] });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in deleting previous records"
        });
        return;
    }

    const dynamic_link = `http://localhost/userAuth/resetPassword/${userRecord['_id']}`;
    try {
        const newOTP = generateOTP();
        const newUserForgotPasswordRecord = new userForgotPasswordModel({
            userID: userRecord['_id'],
            OTP: String(newOTP),
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000    // 5 minnutes
        });
        await newUserForgotPasswordRecord.save();

        const mailOptions = {
            from: `Power Charge 👻  <${process.env.ADMIN_EMAIL_ID}>`, // sender address
            to: userRecord['email'], // list of receivers
            subject: "You requested for forgot password", // Subject line
            text: `Heres the link for resetting your password
            ${dynamic_link}
            and the OTP is ${newUserForgotPasswordRecord['OTP']}
            Click on the above link to and enter above OTP and create a new password
            Do not share this link as well as OTP with anyone!`, // plain text body
            //html: "<b>Hello world?</b>", // html body
        };
        await transporter.sendMail(mailOptions);
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in storing newUserForgetPasswordRecord in userForgotPasswordModel or either sending email"
        });
        return;
    }

    res.json({
        message: "This is a success message",
        description: "Reset password link has been sent to your email,All is Well",
        redirectLink: dynamic_link
    });
}



// This function will reset the user's password, the user is required to opt forget password to get to this route in his email
// The id of user in request parameters and new password and OTP in request body is required
// This is a get type request
async function viewResetUserPassword(req, res) {
    res.render("resetUserPassword.ejs", {});
}



// This function will reset the user's password, the user is required to opt forget password to get to this route in his email
// The id of user in request parameters and new password and OTP in request body is required
// This is a patch type request
async function userResetPassword(req, res) {
    const OTP = req.body.OTP;
    const newPassword = req.body.password;
    const userID = req.params.id;

    if (userID == undefined || userID == "" || newPassword == undefined || newPassword == "" || OTP == undefined || OTP == "") {
        res.status(400).json({
            message: "userID and password and OTP cannot be empty",
            description: "the required fields are empty or undefined id of user in params and new password and OTP in req body"
        });
        return;
    }

    let userRecord = null;
    try {
        userRecord = await userModel.findOne({ '_id': userID });
    } catch (err) {
        res.status(401).json({
            message: err.message,
            description: "Whenever the id dosent match it gives a fatal error, the _id dosent match with anyone"
        });
        return;
    }

    if (userRecord == null) {
        res.status(401).json({
            message: "No such user found",
            description: "on searching the userID in userModel so record was found"
        });
        return;
    }

    let userForgotPasswordRecord = null;
    try{
        userForgotPasswordRecord = await userForgotPasswordModel.findOne({ userID: userRecord['_id'] });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was a problem in finding userForgotPasswordRecord from userForgotPasswordModel"
        });
        return ;
    }
    if (userForgotPasswordRecord == null) {
        res.status(403).json({
            message: "The record couldnt be found",
            description: "There was no userForgotPasswordRecord for the corresponding user in userForgotPasswordModel, this means the user never requested for forgot password"
        });
        return;
    }

    if (userForgotPasswordRecord.expiresAt <= Date.now()) {
        try {
            await userForgotPasswordRecord.delete();
        } catch (err) {
            res.status(500).json({
                message: "The userForgotPaswordRecord is not valid",
                description: "Expired already plus  the previous records couldnt be deleted due to som eunknown problems"
            });
            return ;
        }
        res.status(403).json({
            messsage: "The userForgotPaswordRecord is no longer valid",
            description: "The userForgotPasswordRecord has expired, the forgot ppassword option was issued by the user much time earlier"
        });
        return;
    }

    if (OTP != userForgotPasswordRecord['OTP']) {
        res.status(401).json({
            message: "The OTP is incorrect",
            description: "The OPT you entered dose not match with one stored in userForgotPasswordModel"
        });
        return;
    }

    const salt = await bcrypt.genSalt();
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    let updatedData = undefined;
    try {
        await userForgotPasswordRecord.deleteOne();
        updatedData = await userRecord.updateOne({ password: newHashedPassword });
    } catch (err) {
        res.status(500).json({
            message: err.message,
            description: "There was error in updating userRecord with newHashedPassword"
        });
        return;
    }

    res.json({
        message: "This is a success message",
        dexcription: `The execution reached till the end of the function, the detaills of ${userRecord['_username']} are successfully updated also the forgot password record deleted`,
        data: updatedData
    });
}






module.exports = {
    viewCreateAccount,
    createNewUserAccount,
    viewVerifyUserEmail,
    verifyEmail,
    viewUserLogin,
    loginUser,
    logoutUser,
    viewUserForgotPassword,
    userForgotPassword,
    viewResetUserPassword,
    userResetPassword
};

