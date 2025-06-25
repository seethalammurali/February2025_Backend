const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
const Razorpay = require('razorpay')

const instance = new Razorpay({
    key_id:process.env.RAZ_ID,
    key_secret:process.env.RAZ_KEY
})

const createOrder = asyncHandler(async (req,res) => {
    const {amount} = req.body
    console.log(amount);

    const request = {
        amount : amount *100,
        currency:process.env.CURRENCY,
        receipt:`receipt_order_${Date.now()}`,
        payment_capture:1
    }
    console.log(request);

    try {
        const order = await instance.orders.create(request)
        console.log(order);
        res.json({orderid:order.id,amount:order.amount,currency:order.currency})
    } catch (err) {
        console.log(err);
        res.status(500).json({error:err.message})
    }
    
})

router.post("/",protect,createOrder)
module.exports=router