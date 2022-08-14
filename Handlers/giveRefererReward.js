/* This file contains the most important middle warre function
 This is middle ware even if  fails will not stop anything from hapenning
 But this is middleware, it has its own anility to canel or prceed the request-response cycle but it will not send anny response even if it fails*/
const userModel = require("../Models/userModel");

async function giveRefererReward(req, res) {
    try {
        const refererUsername = req['refererUsername'];
        console.log("The username is : ",refererUsername);
        console.log(typeof("The type of referer Username is : ",refererUsername));
        if (!refererUsername) {
            //throw new Error("forsi");
            return;
        }

        const refererUserRecord = await userModel.findOne({ username: refererUsername });
        if (refererUserRecord == undefined) {
            //throw new Error("forsititu");
            return;
        }

        await refererUserRecord.updateOne({ currentWalletBalance: refererUserRecord['currentWalletBalance'] + 5 });  // 5 rupees is fixed
    } catch (err) {
        console.log({
            message: err.message,
            description: "Couldnt send the reward to the referer"
        });
    }
}

module.exports = giveRefererReward;