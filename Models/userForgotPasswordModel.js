/* This is  a model for those who forgot password
 Those  users who opted for forgot password will be temporary tored here so that when that reset their password we could verify them
 This is not a permanet  model every, it is temporary
 It the time expires of the request is successful record will be deleted
 Kam ho gaya to delete karo records*/
const mongoose = require("mongoose");

const userForgotPasswordSchema =  mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    OTP: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

const userForgotPasswordModel = mongoose.model('userForgotPasswordModel',userForgotPasswordSchema);

module.exports = userForgotPasswordModel;