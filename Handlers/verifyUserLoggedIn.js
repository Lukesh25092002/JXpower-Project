/* This file contains the most important middle warre function
 Not the same as verifyJWT, veerifyJWT is simply a fuction that returns _id if JWT is verified or else return false
 But this is middleware, it has its own anility to canel or prceed the request-response cycle*/
const userModel = require("../Models/userModel.js");
const verifyJWT = require("../Helpers/verifyJWT.js");


// This function is middleware which will verify JWT with help of verifyJWT.js and also route the user to further
// Also if user is logged in it will add a new item "userRecord in the request body"
async function verifyUserLoggedIn(req, res, next) {
    const userID = await verifyJWT(req.cookies['auth-token']);
    if (!userID) {
        if(req.headers['user-agent'].includes("Mozilla")){
            res.redirect("http://localhost/userAuth/login");
            return ;
        }

        res.status(400).json({
            message: "The JWT couldnt be verified",
            description: "The userID that the verifyJWT returned is null"
        });
        return;
    }

    let userRecord = null;
    try {
        userRecord = await userModel.findOne({ _id: String(userID) });
    } catch (err) {
        if(req.headers['user-agent'].includes("Mozilla")){
            res.redirect("http://localhost/userAuth/login");
            return ;
        }

        res.status(401).json({
            myStatus: "failed",
            message: err.message,
            description: "When trying to fetch user with ID from database, error appeared"
        });
        return;
    }
    if (userRecord == null) {
        if (req.headers['user-agent'].includes("Mozilla")) {
            res.status(401).redirect("http://localhost/userAuth/login");
            return;
        }

        res.status(401).json({
            message: "The user could not be found",
            description: "When the searched user with ID in userModel, null came"
        });
        return;
    }

    req.userRecord = userRecord;
    next();    // To the route that is protected, i.e needs user to be logged in first of all
}

module.exports = verifyUserLoggedIn;