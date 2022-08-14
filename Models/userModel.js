/* This is user Schema
It is a format of document theat will be stored in database*/
const mongoose = require("mongoose");
const emailValidator = require("email-validator");

const userSchema = mongoose.Schema({
    image: {
        type: String,
        default: "default-user.png"
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    age: {
        type: Number
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: function(){
            return emailValidator.validate(this.email);
        }
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        required: true,
        default: true
    },
    referralLink: {
        type: String,
        required: true
    },
    optedForWithdrawRequest: {
        type: Boolean,
        required: true,
        default: false
    },
    currentWalletBalance: {
        type: Number,    // This is in rupees and whole number
        required: true,
        default: 0
    },
    totalWithdraw: {
        type: Number,   // This is number of times
        required: true,
        default: 0
    },
    totalPurchases: {
        type: Number,
        required: true,
        default: 0
    },
    currentShortTermPlanID: {
        type: String,
        default: undefined
    },
    currentShortTermPlanExpiryDate: {
        type: Date,
        default: undefined
    },
    currentLongTermPlanID: {
        type: String,
        default: undefined
    },
    currentLongTermPlanExpiryDate: {
        type: Date,
        default: undefined
    }
});

const userModel = mongoose.model("userModel",userSchema);

module.exports = userModel;