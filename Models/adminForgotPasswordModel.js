/* This is  a model for those admin who forgot password
 Those  admins who opted for forgot password will be temporary tored here so that when that reset their password we could verify them
 This is not a permanet  model every, it is temporary
 It the time expires of the request is successful record will be deleted
 Kaam ho gaya to delete karo records*/
 const mongoose = require("mongoose");

 const adminForgotPasswordSchema =  mongoose.Schema({
     adminID: {
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
 
 const adminForgotPasswordModel = mongoose.model('adminForgotPasswordModel',adminForgotPasswordSchema);
 
 module.exports = adminForgotPasswordModel;