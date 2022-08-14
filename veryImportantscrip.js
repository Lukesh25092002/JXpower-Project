/* This is the script which is expected to run every night for giving the JX coins to users */

// This function will give away all the users JX coins according to their corresponding plans
// This function will also remove the current plan from user Model if it is expired
const userModel = require("./Models/userModel.js");
const planModel = require("./Models/planModel.js");

async function veryImportant() {
    let allUserModelRecords;
    try {
        allUserModelRecords = await userModel.find({});
    } catch (err) {
        console.log({
            message: err.message,
            description: "There was error in finding user Records, This is a fatal error contact to web developer immediately"
        });
        return ;
    }
    allUserModelRecords.forEach(async function (userRecord, index) {
        // reverting the optedForWithdrawRequest to false
        try{
            userRecord.updateOne({ optedFoorWithdrawRequest : false });
        }catch(err){
            console.log({
                message: err,
                description: "There was error in updating optedForWithdrawRequest, this is fatel error contact to web developer"
            });
        }

        // JX coins for short term plan 
        try{
            if (userRecord['currentShortTermPlanID']) {
                if (userRecord['currentShortTermPlanExpiryDate'] <= Date.now()) {
                    await userRecord.updateOne({
                        currentShortTermPlanID: undefined,
                        currentShortTermPlanExpieyDate: undefined
                    });
    
                    console.log({
                        message: err.message,
                        description: "There was error in cancellation of user plan after expiry, this is fatal ERROR contact web developer immediately"
                    });
    
                }
                else {
                    const planID = userRecord['currentShortTermPlanID'];
                    const planRecord = await planModel.findOne({ '_id': planID });
    
                    const updatedWalletBalance = parseInt(userRecord['currentWalletBalance'] + planRecord['dailyIncome']);
                    await userRecord.updateOne({ currentWalletBalance: updatedWalletBalance });
                    console.log("wallet add long term");
                }
            }
        }catch(err){
            console.log({
                message: err,
                description: "This is a FATAL ERROR, problem in updating the user walletBalance for short term plan"
            });
        }

        // JX coins for long tem plans
        try{
            if (userRecord['currentLongTermPlanID']) {
                if (userRecord['currentShortTermPlanExpiryDate'] <= Date.now()) {
                    await userRecord.updateOne({
                        currentShortTermPlanID: undefined,
                        currentShortTermPlanExpiryDate: undefined
                    });
                }
                else {
                    const planID = userRecord['currentLongTermPlanID'];
                    const planRecord = await planModel.findOne({ '_id': String(planID) });
    
                    const updatedWalletBalance = parseInt(userRecord['currentWalletBalance'] + planRecord['dailyIncome']);
                    await userRecord.updateOne({ currentWalletBalance: updatedWalletBalance });
                    console.log("wallet add long term");
                }
            }
        }catch(err){
            console.log({
                message: err,
                description: "This is a FATAL ERROR, problem in updating the user walletBalance for long term plan"
            });
        }
    });
}

module.exports = veryImportant;