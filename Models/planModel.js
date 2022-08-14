/* This is a schema for power charge plans
 These are the plans that the company offer */
const mongoose = require("mongoose");

const planSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ["Short","Long"]
    },
    image: {
        type: String,
        required: true,
    },
    dailyIncome: {
        type: Number,    // in rupees
        required: true
    },
    totalIncome: {
        type: Number,    // in rupees
        required: true
    },
    servingTime: {
        type: Number,    // in days
        required: true
    },
    price: {
        type: Number,     //in rupees
        required: true
    },
    totalPurchases: {
        type: Number,
        required: true,
        default: 0
    }
});

const planModel = mongoose.model("planModel",planSchema);

module.exports = planModel;