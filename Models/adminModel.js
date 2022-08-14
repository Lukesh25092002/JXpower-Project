/* This is admin Schema
It is a format of document theat will be stored in database*/
const mongoose = require("mongoose");
const emailValidator = require("email-validator");

const adminSchema = mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
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
    image: {
        type: String,
        default: "default.png"
    }
});

const adminModel = mongoose.model("adminModel",adminSchema);

module.exports = adminModel;