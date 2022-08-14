/* This userEmailVerificationModel
This is stored the entry of OTP when the user creates a new account*/
const mongoose = require("mongoose");

const userEmailVerificationSchema = mongoose.Schema({
    temporaryUserID: {
        type: String,
        required: true,
        unique: true
    },
    OTP: {
        type: String,
        required: true
    },
    refererUsername: {
        type: String,
        required: false,
        default: undefined
    },
    createdAt: {
        type: Date,
        require: true
    },
    expiresAt: {   //by default 5 minutes decided by the developer
        type: Date,
        required: true
    } 
});

const userEmailVerificationModel = mongoose.model('userEmailVerificationModel',userEmailVerificationSchema);

module.exports = userEmailVerificationModel;