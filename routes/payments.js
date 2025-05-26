const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')

const { Cashfree, CFEnvironment } =require("cashfree-pg"); 

const cashfree = new Cashfree(CFEnvironment.SANDBOX, `${process.env.APP_ID}`, `${process.env.SECRET_KEY}`);

const createOrder = asyncHandler(async(req,res)=>{
    const {amount,phone,customerID,orderID} = req.body

    const request = {
        "order_amount": amount,
        "order_currency": process.env.CURRENCY,
        "order_id": orderID,
        "customer_details": {
            "customer_id": customerID,
            "customer_phone": phone
        },
        "order_meta": {
            "return_url": "https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id={order_id}"
        }
    };
    
    cashfree.PGCreateOrder(request).then((response) => {
        console.log('Order created successfully:',response.data);
        res.status(201).json({Message:'Order Created Successfully',Session_ID:response.data.payment_session_id})
    }).catch((error) => {
        console.error('Error:', error.response.data.message);
        res.status(400).json({message:error.response.data.message})
    });
})


router.post("/",protect,createOrder)

module.exports = router