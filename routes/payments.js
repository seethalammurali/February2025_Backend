const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
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
            "return_url": process.env.STATUS_PAGE
        }
    };
    
    cashfree.PGCreateOrder(request).then((response) => {
        res.status(201).json({Message:'Order Created Successfully',Session_ID:response.data.payment_session_id})
    }).catch((error) => {
        res.status(400).json({message:error.response.data.message})
    });
    const createOrderSQL = 'insert into transactions (user_id,order_id,amount,phone,transaction_date) values (?,?,?,?,?)'

    await new Promise((resolve, reject) => {
        db.query(createOrderSQL,[customerID,orderID,amount,phone,new Date()],(err,result)=>{
            if (err) {
                res.status(400)
                console.log(err);
                throw new Error("");
                
            }
        })
    })
})

const paymentStatus = asyncHandler(async (req,res) => {
    const {orderID} = req.body
    console.log("Order id",req.body);

    cashfree.PGOrderFetchPayments(orderID).then((response) => {
    console.log('Order fetched successfully:', response.data);
    res.status(200).json({order_status:response.data})
}).catch((err) => {
    console.error('Error:', err.response.data.message);
    res.status(400).json({message:err.response.data.message})

    });
    
})



router.post("/",protect,createOrder)
router.post("/payment-status",protect,paymentStatus)

module.exports = router