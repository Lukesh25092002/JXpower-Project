/* This is transporter a helper function
This is relation with email sending
nodemailer requires a transporter to  send mail and this transporter.sendMail()  will directly send mail*/
const nodemailer = require("nodemailer");


// This function returns a transporter object which has function sendMail(mailOptions) to send Emails
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ADMIN_EMAIL_ID, // generated ethereal user
      pass: process.env.ADMIN_EMAIL_PASSWORD, // generated ethereal password
    }
  });

module.exports = transporter;