/* This is also a schema for storing user profiles but this is not a real schema
All the users in this schema are those who didnot verify their email */
const mongoose = require("mongoose");

const temporaryUserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    }
});

const temporaryUserModel = mongoose.model("temporaryUserModel",temporaryUserSchema);
module.exports = temporaryUserModel;