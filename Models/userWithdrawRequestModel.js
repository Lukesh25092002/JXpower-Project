/* This is userWithdrawRequest Schema
Every time user clicks on withdraw a record will be created here for admin to approve and send money to bank account*/
const mongoose = require("mongoose");

const userWithdrawRequestSchema = mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    IFSCcode: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    }
});

const userWithdrawRequestModel = mongoose.model("userWithdrawRequestModel",userWithdrawRequestSchema);

module.exports = userWithdrawRequestModel;