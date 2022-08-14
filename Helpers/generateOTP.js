/* This is OTP generater
This is function is expected to run at the time of email verification ,OTP will be sent to user email at time of account creation*/

// This is function will generate 4 letters OTP in string format
function generateOTP(){
    const numericalOTP = Math.floor(1000 + Math.random()*8999);
    const stringOTP = String(numericalOTP);
    return stringOTP;
};

module.exports = generateOTP;