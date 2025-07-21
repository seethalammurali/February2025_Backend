const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
const { Cashfree, CFEnvironment } =require("cashfree-pg");

const cashfree = new Cashfree(CFEnvironment.SANDBOX, `${process.env.APP_ID}`, `${process.env.SECRET_KEY}`);

const createOrder = asyncHandler(async(req,res)=>{
    const {amount,phone,customerID,orderID,charges} = req.body
    console.log(req.body);

    const creditedAmount = amount-(amount*charges/100)
    console.log("step 2",creditedAmount);

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
      const createOrderSQL = 'insert into payments (user_id,order_id,amount,charges,currency,payment_date) values (?,?,?,?,?,?)'
      db.query(createOrderSQL,[customerID,orderID,amount,charges*100,process.env.CURRENCY,new Date()],(err,result)=>{
        if (err) {
          res.status(400)
          console.log(err);
          throw new Error("");
        }
      })
      res.status(201).json({Message:'Order Created Successfully',Session_ID:response.data.payment_session_id})
    }).catch((error) => {
        res.status(400).json({message:error.response.data.message})
    });

})

const paymentStatus = asyncHandler(async (req, res) => {
    const { orderID, customerID } = req.body;
    console.log("step 10");

    try {
        const response = await cashfree.PGOrderFetchPayments(orderID);
        console.log(response.data);

        const { payment_status, order_amount } = response.data[0];
        console.log("step 11",payment_status,order_amount);

        // Check if order already marked SUCCESS
        const paymentCheckSQL = `SELECT status FROM payments WHERE order_id = ?`;

        db.query(paymentCheckSQL, [orderID], (err, rows) => {
            if (err) {
                console.error("DB check failed", err);
                return res.status(500).json({ message: "Internal error" });
                console.log("step 12");

            }

            const existingStatus = rows[0]?.status;

            if (payment_status === "SUCCESS" && existingStatus !== "SUCCESS") {
                // Update payment status
                const updateStatusSQL = `UPDATE payments SET status = ? WHERE order_id = ?`;
                db.query(updateStatusSQL, ["SUCCESS", orderID]);
                console.log("step 12.1");

                // Update or Insert wallet
                const checkWalletSQL = `SELECT * FROM wallet WHERE wallet_user_id = ? LIMIT 1`;
                db.query(checkWalletSQL, [customerID], (err, rows) => {
                    if (err) return console.error("Wallet check error:", err);
                    console.log("step 13");

                    if (rows.length > 0) {
                        console.log("step 14");

                        const updateWalletSQL = `
                            UPDATE wallet
                            SET wallet_balance = wallet_balance + ?, wallet_updated_at= ?
                            WHERE wallet_user_id = ?`;
                        db.query(updateWalletSQL, [order_amount, new Date(), customerID],(err,result)=>{
                            console.log(err);
                            console.log(result);


                        });
                    } else {
                        console.log("step 15");

                        const insertWalletSQL = `
                            INSERT INTO wallet (wallet_user_id, wallet_balance, wallet_updated_at)
                            VALUES (?, ?, ?)`;
                        db.query(insertWalletSQL, [customerID, order_amount, new Date()]);
                    }

                    res.status(200).json({ message: "Wallet credited successfully",order_status:response.data });

                });
            } else {
                res.status(200).json({ message: "Payment not completed or already processed",  });
            }
        });
    } catch (err) {
        console.error("Cashfree fetch error:", err.response?.data?.message || err.message);
        res.status(400).json({ message: "Unable to fetch order status" });
    }
});



const orderHistory = asyncHandler(async (req,res) => {
    const {userId} = req.body
    console.log(req.body);

    const orderHistorySQL = "select * from orders where order_user_id = ?";
  try {
    const orders = await new Promise((resolve, reject) => {
      db.query(orderHistorySQL,[userId], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    res.status(200).json(orders)
  } catch (err) {

    res.status(500).json({message:'Failed to fetch Transactions'})
  }

})


router.post("/",protect,createOrder)
router.post("/payment-status",protect,paymentStatus)
router.post('/orders',protect,orderHistory)

module.exports = router