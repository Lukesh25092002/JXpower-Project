/* This  is admin Controller and contains the implementation of all the functions mentioned in adminRouter */

const { options } = require("../Helpers/transporter");
const planModel = require("../Models/planModel");
const userModel = require("../Models/userModel");
const userWithdrawRequestModel = require("../Models/userWithdrawRequestModel");


// This function will display the admin profile to the admin
// JWT at the time of login in cookie named 'auth-token' is expected in request which will be taken care by  verifyAdminLoggedIn
// This is a get type request
async function viewAdminPanel(req, res) {
    const adminRecord = req.adminRecord;

    let totalUsers;
    try{
        const userRecords = [...await userModel.find()];
        totalUsers = userRecords.length;
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was problem in retriving all users from database for 'totalUsers' calculation"
        });
    }

    let totalPurchases = 0;
    try{
        const planRecords = [...await planModel.find()];
        planRecords.forEach(function(planRecord){
            totalPurchases = totalPurchases + planRecord['totalPurchases'];
        });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was problem in retriveing all users for 'totalPurchases' calculation"
        });
    }

    res.render("adminPanel.ejs",{
        photo: adminRecord['image'],
        username: adminRecord['username'],
        email: adminRecord['email'],
        totalUsers,
        totalPurchases
    });
}



// This function will display the admin payments to the admin
// nothing expected in the request
// This is a get type request
async function viewUserPaymentRequests(req,res){
    let userWithdrawRequestRecords;
    try{
        userWithdrawRequestRecords = [...await userWithdrawRequestModel.find()];
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was problem in fetching the records from userWithdrawRequestModel"
        });
    }

    let withdrawRequests = [];
    for(let i=0 ; i<userWithdrawRequestRecords.length ; i++){
        const userWithdrawRequestRecord = userWithdrawRequestRecords[i];
        const userID = userWithdrawRequestRecord['userID'];

        let userRecord = null;
        try{
            userRecord = await userModel.findOne({ _id: userID });
        }catch(err){
            res.status(500).json({
                message: err.message,
                description: "There was a problem in fetching userRecord from user Model"
            });
        }

        const data = {
            image: userRecord['image'],
            userID: String(userRecord['_id']),
            username: userRecord['username'],
            email: userRecord['email'],
            name: userWithdrawRequestRecord['name'],
            accountNumber: userWithdrawRequestRecord['accountNumber'],
            IFSCcode: userWithdrawRequestRecord['IFSCcode']
        };
        withdrawRequests.push(data);
    }

    res.render("adminPayments.ejs",{
        withdrawRequests: withdrawRequests
    });
}



// This function will delete the record from userWithdrawRequestModel assuming that the admin has done payment to that user
// userID expected in the request body
// This is a delete type request
async function deleteUserPaymentRequest(req,res){
    const userID = req.body.userID;
    if(userID==undefined || userID==""){
        res.status(400).json({
            message: "Incomplete credentials",
            description: "The userID field was empty"
        });
        return ;
    }

    let userRecord = null;
    try{
        userRecord = await userModel.findOne({ _id: userID });
    }catch(err){
        res.status(401).json({
            message: "Invalid credentials",
            description: "Your userID dose not match with any existing record ID in user Model"
        });
        return ;
    }
    if(userRecord == null){
        res.status(401).json({
            message: "Invalid credentials",
            description: "Your userID dose not match with any existing record ID in user Model"
        });
        return ;
    }

    // to ensure that the user has requested payment
    let userWithdrawRequestRecord = null;
    try{
        userWithdrawRequestRecord = await userWithdrawRequestModel.findOne({ userID: userID });
    }catch(err){
        res.status(401).json({
            message: err.message,
            description: "There was a problem in fetching userWithdrawRequestRecord from userWithdrawRequestModel"
        });
        return ;
    }
    if(userWithdrawRequestRecord == null){
        res.status(401).json({
            message: "Invalid credentials",
            description: "Your userID dose not correspond to any existing record in userWithdrawRequestModel, no such record exists"
        });
        return ;
    }

    // update current wallet Balance    -- done in wallet debit
    //increment total withdraw in userRecord     -- done in wallet debit

    // delete the planRecord from planModel
    try{
        await userWithdrawRequestModel.deleteOne({ userID: userID });
    }catch(err){
        res.status(500).json({
            message:  err.message,
            description: "There was error in deleting the record"
        });
        return ;
    }

    res.json({
        message: "This is success message",
        description: "The record has been deleted, and assumed that admin payed the user via bank details manually"
    });
    
}



// This function will view the userInformation
// nothing required in request
// This is a get request
async function viewAllUserInformation(req,res){
    let allUserRecords = [];
    try{
        allUserRecords = [...await userModel.find()];
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "THere was error in fetching userRecords from userModel"
        });
    }

    const userInformationRecords = allUserRecords.map(function(userRecord){
        return {
            image: userRecord['image'],
            userID: userRecord['_id'],
            firstName: userRecord['firstName'],
            lastName: userRecord['lastName'],
            age: userRecord['age'],
            username: userRecord['username'],
            email: userRecord['email'],
            currentWalletBalance: userRecord['currentWalletBalance'],
            totalWithdraw: userRecord['totalWithdraw'],
            totalPurchases: userRecord['totalPurchases'],
            currentShortTermPlanID: userRecord['currentShortTermPlanID'],
            currentShortTermPlanExpiryDate: userRecord['currentShortTermPlanExpiryDate'],
            currentLongTermPlanID: userRecord['currentLongTermPlanID'],
            currentLongTermPlanExpiryDate: userRecord['currentLongTermPlanExpiryDate']
        };
    });

    res.render("allUserInformation.ejs",{
        userInformationRecords: userInformationRecords
    });
}



// This function will view the planInformation
// nothing required in request
// This is a get request
async function viewAllPlanInformation(req,res){
    let allPlanRecords = [];
    try{
        allPlanRecords = [...await planModel.find()];
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was error in fetching planRecords from planModel"
        });
    }

    res.render("allPlanInformation.ejs",{
        planInformationRecords: allPlanRecords
    });
}


// This function will update the admin profile
// Any details in this request will be overrided and expected in the request
// This is a patch request
async function updateAdminProfile(req,res){
    const adminRecord = req.adminRecord;
    try{
        if(req.file){
            await adminRecord.updateOne({image: req.file.filename});
        }
        if(req.body.firstName){
            await adminRecord.updateOne({firstName: req.body.firstName});
        }
        if(req.body.lastName){
            await adminRecord.updateOne({lastName: req.body.lastName});
        }
    }catch(err){
        res.json({
            message: err.message,
            description: "some error happened in updating user information"
        })
    }

    if(req['user-agent'].includes("Mozilla")){
        res.redirect("/admin/viewAdminProfile");
        return ;
    }

    res.json({
        message: "This is a success message, account details updated",
        description: "The excution reached till the end of all the midddlewares and functions",
        data: userRecord
    });
}

module.exports = {
    viewAdminPanel: viewAdminPanel,
    viewUserPaymentRequests: viewUserPaymentRequests,
    deleteUserPaymentRequest: deleteUserPaymentRequest,
    viewAllUserInformation: viewAllUserInformation,
    updateAdminProfile: updateAdminProfile,
    viewAllPlanInformation: viewAllPlanInformation
}