/* This if for authentication porpose
 For many functions in authController and userController the action canot proceed if the user is not logged in first place*/
const JWT = require("jsonwebtoken");

// This function will return verify the the user JWT is valid or not only the secret key  it will not verify the user in userModel
// Return the _id of user from userModel if secret key matches or return false
async function verifyJWT(token){
    if(token == undefined){
        return false;
    }
    
    let payload = undefined;
    try{
        payload = await JWT.verify(token,process.env.SERVER_SECRET_KEY);
    }catch(err){
        return false;
    }

    if(payload == undefined || payload=="" ||  payload==null){
        return false;
    }

    return payload;
}

module.exports = verifyJWT;