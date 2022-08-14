const express = require("express");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const stripe = Stripe('sk_test_51LIXZQSISZFsR7kgWcczudRHu2bs0CBdTxIbH81GiqcwBR8f0stTri0ej8U8SjiQKZvtZLkuj7OQFKRZGEI1m5yz00QaqR4fUU');
const app = express();
dotenv.config();
//app.use(express.static("./Public"));
app.use(express.json());
//app.set('view engine', 'ejs');

app.use("/static", express.static('./Public'));

const storeItems = new Map([
    [1, { priceInCents: 10000, name: "Learn React Today" }],
    [2, { priceInCents: 20000, name: "Learn CSS toady" }]
]);

app.get("/store", function (req, res) {
    res.sendFile("./views/tara.html", { root: __dirname });
});

app.post('/create-checkout-session', async (req, res) => {
    const YOUR_DOMAIN = 'http://localhost';
    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: "TT coint bunn",
                        },
                        unit_amount: 2000
                    },
                    quantity: 1,
                },
            ],
            
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
        });
    }catch(err){
        res.status(500).json({
            message: err.message,
            description: "There was error in iniciating payments from stripe"
        });
    }

    res.json({
        url: session.url,
        data: "This is success message",
        description: "The payment will begin"
    });
});


app.use("/timepass", async function (req, res) {
    const refferer = req.query.location;
    res.json({
        data: refferer
    });
});



app.listen(80, function () {
    console.log("Server started");
});