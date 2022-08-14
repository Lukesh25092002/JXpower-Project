/* This is the main entrance of this webpage
This is the main server page and in this page are the links to  several other components
Heart of backend*/
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const app = express();
dotenv.config();
app.use(express.json({ type: "application/json" }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use("/public",express.static("./Public"));
app.set("views",path.join(__dirname,"./Views"));

const schedule = require("node-schedule");
const veryImportant = require("./veryImportantscrip.js");
schedule.scheduleJob("0 0 0 * * *",veryImportant);

//Connecting this program to Mongo database
mongoose.connect(process.env.DATABASE_LINK)
    .then(function () {
        console.log("Database connected");
    })
    .catch(function (err) {
        console.log(err);
    });



// Loading all the plans in database
/*    const planModel = require("./Models/planModel.js");
createNewPlan(["name",dailyIncome,totalIncome,servingTime,price]);    */

app.get("/home",function(req,res){
    res.render("home.ejs",{});
});

// Setting up userRouter
const userRouter = require("./Routers/userRouter.js");
app.use("/user", userRouter);

// Setting userAuthRouter
const userAuthRouter = require("./Routers/userAuthRouter.js");
app.use("/userAuth", userAuthRouter);

// Setting adminRouter
const adminRouter = require("./Routers/adminRouter.js");
app.use("/admin", adminRouter);

// Setting adminAuthRouter
const adminAuthRouter = require("./Routers/adminAuthRouter.js");
app.use("/adminAuth",adminAuthRouter);

app.get("/success",function(req,res){
    console.log("This is a post type request success.html file");
    res.sendFile("Views/success.html",{root: __dirname});
});

app.get("/cancel",function(req,res){
    console.log("This is a post type request cancel.html file");
    res.sendFile("Views/cancel.html",{root: __dirname});
});

const endpointSecret = "whsec_2e0a9da1096c83749feeb5debfb2f0b4e81c4471798b0bdbb16d03b034189be1";

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  });



//Listning to requests from frontend
app.listen(80, function () {
    console.log("Server started...");
});



// create new plan
async function createNewPlan(planDetails) {
    const planRecord = await planModel.findOne({ name: planDetails[0] });
    if (planRecord != null) {
        // this means plan is already present
        return;
    }

    const newPlanRecord = new planModel({
        name: planDetails[0],
        dailyIncome: planDetails[1],
        totalIncome: planDetails[2],
        servingTime: planDetails[3],
        price: planDetails[4]
    });

    try {
        await newPlanRecord.save();
    } catch (err) {
        console.log(err.message);
    }
}

