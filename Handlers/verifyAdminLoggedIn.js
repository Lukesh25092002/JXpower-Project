/* This file contains the most important middle warre function
 Not the same as verifyJWT, veerifyJWT is simply a fuction that returns _id if JWT is verified or else return false
 But this is middleware, it has its own anility to canel or prceed the request-response cycle*/
const adminModel = require("../Models/adminModel.js");
const verifyJWT = require("../Helpers/verifyJWT.js");


// This function is middleware which will verify JWT with help of verifyJWT.js and also route the user to further
// Also if user is logged in it will add a new item "userRecord in the request body"
async function verifyUserLoggedIn(req, res, next) {
    const adminID = await verifyJWT(req.cookies['auth-token']);
    if (!adminID) {
        if (req.headers['user-agent'].includes("Mozilla")) {
            res.redirect("http://localhost/adminAuth/login");
            return;
        }

        res.status(400).json({
            message: "The JWT couldnt be verified",
            description: "The adminID that the verifyJWT returned is null"
        });
        return;
    }

    let adminRecord = null;
    try {
        adminRecord = await adminModel.findOne({ _id: adminID.trim() });
    } catch (err) {
        if (req.headers['user-agent'].includes("Mozilla")) {
            res.redirect("http://localhost/adminAuth/login");
            return;
        }

        res.status(401).json({
            myStatus: "failed",
            message: err.message,
            description: "When trying to fetch admin with ID from database, error appeared"
        });
        return;
    }
    if (adminRecord == null) {
        if (req.headers['user-agent'].includes("Mozilla")) {
            res.status(401).redirect("http://localhost/adminAuth/login");
            return;
        }

        res.status(401).json({
            message: "The admin could not be found",
            description: "When the searched admin with ID in adminModel, null came"
        });
        return;
    }

    req.adminRecord = adminRecord;
    next();    // To the route that is protected, i.e needs user to be logged in first of all
}

module.exports = verifyUserLoggedIn;