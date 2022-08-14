/* This  is user Controller and contains the implementation of all the functions mentioned in userRouter */
const planModel = require("../Models/planModel.js");
const userModel = require("../Models/userModel.js");
const transporter = require("../Helpers/transporter.js");
const userWithdrawRequestModel = require("../Models/userWithdrawRequestModel.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// This function will display the user profile to the user
// JWT at the time of login in cookie named 'auth-token' is expected in request
// This is a get type request
async function viewUserProfile(req, res) {
    const userRecord = req.userRecord;
    res.render("userProfile.ejs", {
        profilePicture: userRecord['image'],
        username: userRecord['username'],
        email: userRecord['email'],
        firstName: userRecord['firstName'],
        lastName: userRecord['lastName'],
        age: userRecord['age'],
        referralLink: userRecord['referralLink']
    });
}



// This function will display the user current plans page which he purchased to the user
// Nothing expected in request except for userRecord which will come through verifyUserLoggedIn
// This is a get type request
async function viewUserCurrentPlans(req, res) {
    const userRecord = req.userRecord;

    let shortTermPlan = undefined;
    if (userRecord['currentShortTermPlanID']) {
        let planRecord = null;
        try {
            planRecord = await planModel.findOne({ '_id': userRecord['currentShortTermPlanID'] });
        } catch (err) {
            res.status(400).json({
                message: "The plan record matching with the ID in userRecord was not found",
                description: "This is a problem of database"
            });
        }

        shortTermPlan = {
            name: planRecord['name'],
            image: planRecord['image'],
            dailyIncome: planRecord['dailyIncome'],
            totalIncome: planRecord['totalIncome'],
            servingTime: planRecord['servingTime'],
            expiryDate: userRecord['currentShortTermPlanExpiryDate'],
        }
    }

    let longTermPlan = undefined;
    if (userRecord['currentLongTermPlanID']) {
        let planRecord = null;
        try {
            planRecord = await planModel.findById({ _id: userRecord['currentLongTermPlanID'] });
        } catch (err) {
            res.status(400).json({
                message: "The plan record matching with the ID in userRecord was not found",
                description: "This is a problem of database"
            });
        }

        longTermPlan = {
            name: planRecord['name'],
            image: planRecord['image'],
            dailyIncome: planRecord['dailyIncome'],
            totalIncome: planRecord['totalIncome'],
            servingTime: planRecord['servingTime'],
            expiryDate: userRecord['currentLongTermPlanExpiryDate'],
        }
    }

    console.log("currentShortTermPlanExpiryDate", userRecord['currentShortTermPlanExpiryDate']);
    console.log("currentLongTermPlanExpiryDate", userRecord['currentLongTermPlanExpiryDate']);
    console.log(shortTermPlan);
    console.log(longTermPlan);

    res.render("currentPlans.ejs", {
        shortTermPlan: shortTermPlan,
        longTermPlan: longTermPlan
    });
}



// This function will display the user wallet page
// JWT at the time of login in cookie named 'auth-token' is expected in request
// This is a get type request
async function viewUserWallet(req, res) {
    const userRecord = req.userRecord;
    res.render("userWallet.ejs", {
        balanceAmount: userRecord['currentWalletBalance']
    });
}



// This function will display the user wallet credit page ie send session link to stripe
// nothing is expected in request
// This is a get type request
async function viewUserWalletCredit(req, res) {
    let session;
    try{
        session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: "payment",
            line_items: [{
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "350 JX coins Bundle"
                    },
                    unit_amount: 35000
                },
                quantity: 1
            }],
            success_url: "http://localhost/success",
            cancel_url: "http://localhost/cancel"
        });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was error in generating session via stripe"
        });
        return ;
    };

    //console.log(session);

    res.json({
        redirectURL: session.url,
        message: "This is a success message",
        description: "This is return message from session url via stripe",
    });
}



// This function will assume the user has made sussessful payment in viewUserWalletCredit
// in headers secretkey in hashed format is expected and in body I dont know
// This is a post type request
async function userWalletCredit(req, res) {
    console.log("hi someone clicked on the post route in user wallet credit");

    let event;
    try{
        event = await stripe.webhooks.constructEvent(req.body,process.env.STRIPE_WEBHOOK_SIGNING_SECRET_KEY,req.headers['stripe-signature']);
    }catch(err){
        console.log("There was error",err.message);
        res.status(400).json({
            success: false
        });
        return ;
    }

    console.log(event);

    res.json({
        success: "true"
    });
}



// This function will display the user wallet debit page
// nothing is expected in request
// This is a get type request
async function viewUserWalletDebit(req, res) {
    res.render("userWalletDebit.ejs",{});
}



// This function will sent a request to withdraw money from user wallet
// the bank acount number is required in request body
// This is a post type request
async function userWalletDebit(req, res) {
    const userRecord = req.userRecord;
    const name = req.body.name;
    const accountNumber = req.body.accountNumber;
    const IFSCcode = req.body.IFSCcode;

    if (name=="" || name==undefined || accountNumber == "" || accountNumber == undefined || IFSCcode=="" || IFSCcode==undefined) {
        res.status(400).json({
            message: "Incomplete credentails",
            description: "Your have not entered you account number"
        });
        return;
    }

    if (userRecord['currentWalletBalance'] < 350) {
        res.status(403).json({
            message: "Invalid balance",
            description: "your current wallet balance is lower than 350"
        });
        return;
    }

    if (userRecord['optedForWithdrawRequest'] == true) {
        res.status(403).json({
            message: "request not allowed",
            description: "You cannot opt for withdraw two times in single day"
        });
        return;
    }

    let previousUserWithdrawRequestRecord = null;
    try {
        previousUserWithdrawRequestRecord = await userWithdrawRequestModel.findOne({ userID: userRecord['_id'] });
    } catch (err) {
        res.status(500).json({
            message: "THere was inter server error",
            description: "There was an error in fetching data from userWithdrawRequestModel"
        });
        return ;
    }

    if (previousUserWithdrawRequestRecord != null) {
        res.status(403).json({
            message: "Multiple withdraw not allowed",
            description: "Your previous withdraw request is still pending to be approved"
        });
        return;
    }

    const currDate = new Date();
    const newUserWithdrawRequestRecord = new userWithdrawRequestModel({
        userID: userRecord['_id'],
        name : name,
        accountNumber: accountNumber,
        IFSCcode: IFSCcode,
        createdAt: currDate
    });
    try {
        await userRecord.updateOne({
            currentWalletBalance: parseInt(parseInt(userRecord['currentWalletBalance'])+350),
            totalWithdraw: parseInt(parseInt(userRecord['totalWithdraw'])+1)
        });
        await newUserWithdrawRequestRecord.save();
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was problen in saving the newUserWithdrawRequestRecord in data base in userWithdrawRequestModel or updating the userModel"
        });
        return ;
    }

    res.json({
        message: "Your request was successful",
        description: "The request was recorded for the admin to view"
    });
}



// This function will display the user all plans avilable
// JWT at the time of login in cookie named 'auth-token' is expected in request
// This is a get type request
async function viewAllPlans(req, res) {
    res.render("allPlans.ejs", {});
}



// This function will open the update user profile
// No details expected, just user logged in first
// This is a get type request
async function viewUpdateUserProfile(req, res) {
    res.render("updateProfile.ejs", {});
}


// This function will update the user profile
// Any details in this request will be overrided and expected in the request
// This is a patch type request
async function updateUserProfile(req, res) {
    const userRecord = req.userRecord;
    try {
        /* if (req.file != undefined) {
            await userRecord.updateOne({ image: req.file.filename });
        } */
        if (req.body.firstname != undefined) {
            await userRecord.updateOne({ firstName: req.body.firstname });
        }
        if (req.body.lastname != undefined) {
            await userRecord.updateOne({ lastName: req.body.lastname });
        }
        if (req.body.age != undefined) {
            await userRecord.updateOne({ age: parseInt(req.body.age) });
        }
    } catch (err) {
        res.json({
            message: err.message,
            description: "some error happened in updating user information"
        });
        return;
    }

    res.json({
        message: "This is a success message, account details updated",
        description: "The excution reached till the end of all the midddlewares and functions",
        data: userRecord
    });
}



// This function will purchase a plan for user
// id of plan to be purchased in request body is required also user logged first so userRecord also in body
// This is a post type request
async function purchasePlan(req, res) {
    const userRecord = req.userRecord;
    const planID = req.body.planID;

    if (planID == undefined) {
        res.status(400).json({
            myStatus: "failed",
            message: "Incomplete creddentails",
            description: "No Plan ID was found in teh request body"
        });
        return;
    }

    let planRecord = null;
    try {
        planRecord = await planModel.findOne({ '_id': planID });
    } catch (err) {
        res.status(400).json({
            myStatus: "failed",
            message: err.message,
            description: "There wass error in extracting the planID from planMModel"
        });
        return;
    }
    if (planRecord == null) {
        res.status(401).json({
            message: "The plan record couldnt be found in database",
            description: "On fetching planRecord from plenModel via planID, planRecord was found to be null"
        });
        return;
    }

    // Short or Long and value are currentLongPlanID or currentShortPlanID
    if (planRecord['type'] == "Short") {
        if (userRecord['currentShortTermPlanID'] != null) {
            res.status(401).json({
                message: "You cannot two different plans of same kind",
                description: "You already buyed a short term plan"
            });
            return;
        }
    }
    else {    //planRecord['type'] is equal to "Long"
        if (userRecord['currentLongTermPlanID'] != null) {
            res.status(401).json({
                message: "You cannot two different plans of same kind",
                description: "You already buyed a short term plan"
            });
            return;
        }
    }

    console.log("current user balance is : ", userRecord['currentWalletBalance']);
    console.log("price of plan is : ", planRecord['price']);
    if (userRecord['currentWalletBalance'] < planRecord['price']) {
        res.status(402).json({
            message: "Insufficient balance",
            description: "There is not enough money in the wallet to buy the plan"
        });
        return;
    }

    try {
        // Purchasing a plan with JX coins
        // deduct money from user wallet
        if (planRecord['type'] == "Short") {
            await userRecord.updateOne({
                currentWalletBalance: userRecord['currentWalletBalance'] - planRecord['price'],
                currentShortTermPlanID: planRecord['_id'],
                currentShortTermPlanExpiryDate: Date.now() + (parseInt(planRecord['servingTime']) * 86400000)    //86400000 millisec equals one day
            });
        }
        else {    // planRecord['type'] == "Long"
            if (planRecord['type'] == "Long") {
                await userRecord.updateOne({
                    currentWalletBalance: userRecord['currentWalletBalance'] - planRecord['price'],
                    currentLongTermPlanID: planRecord['_id'],
                    currentLongTermPlanExpiryDate: Date.now() + (parseInt(planRecord['servingTime']) * 86400000)    //86400000 millisec equals one day
                });
            }
        }

    } catch (err) {
        res.status(402).json({
            message: err.message,
            description: "There was an error in payment makeup"
        });
        return;
    }

    try {
        await userRecord.updateOne({ totalPurchases: userRecord['totalPurchases'] + 1 });
        await planRecord.updateOne({ totalPurchases: planRecord['totalPurchases'] + 1 });
    } catch (err) {
        ress.status(500).json({
            message: "There was internal server error",
            description: "There was error in updating purchase count in userRecord or planRecord"
        });
    }

    res.json({
        myStatus: "success",
        message: "This is a successs message",
        description: "The plan is buyed now"
    });
}



// This function will duisplay the interface for emailing the query for user to admin
// nothing is required except first of all logged in
// This is a get type request
async function viewContactUs(req, res) {
    res.render("contactUs.ejs", {});
}



// This function will duisplay the interface for emailing the query for user to admin
// fuser dfeedback is required inuser request also first of all logged in
// This is a post type request
async function contactUs(req, res) {
    const userRecord = req.userRecord;
    const message = req.body.message;
    console.log("The massage is : ", message);
    if (message == "" || message == undefined) {
        res.status(400).json({
            myStatus: "failed",
            message: "The message is empty",
            description: "Write your feedback, don't mess around with the functionality"
        });
        return;
    }
    console.log("The custmer care ID is : " + process.env.CUSTOMERCARE_EMAIL_ID);

    const mailOptions = {
        from: `"Power Charge 👻" <${process.env.ADMIN_EMAIL_ID}>`, // sender address
        to: `${process.env.CUSTOMERCARE_EMAIL_ID}`, // list of receivers
        subject: "User Feedback", // Subject line
        text: `    This is feedback to customer from user


        User information :-
        ${userRecord}


        Messsage : -
        ${message}`    // plain text body
        //html: "<b>Hello world?</b>", // html body
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        res.status(400).json({
            myStatus: "failed",
            message: err.message,
            description: "There was problem in actual sending mail by nodemailer"
        });
        return;
    }

    res.json({
        myStatus: "success",
        message: "This is success message",
        description: "The mail containing the message was sent to customer care"
    });
}



module.exports = {
    viewUserProfile,
    viewUserCurrentPlans,
    viewUserWallet,
    viewUserWalletCredit,
    userWalletCredit,
    viewUserWalletDebit,
    userWalletDebit,
    viewAllPlans,
    viewUpdateUserProfile,
    updateUserProfile,
    purchasePlan,
    viewContactUs,
    contactUs
};