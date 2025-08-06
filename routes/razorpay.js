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
    const {amount,CustomerName,Invoice,phone,customerID,charges} = req.body
    console.log("step 10",req.body);



    const chargesAmount = Number(((amount * charges) / 100).toFixed(2));
    const creditedAmount = Number((amount - chargesAmount).toFixed(2));

    const request = {
        amount : parseInt(amount *100),
        currency:process.env.CURRENCY,
        receipt:`receipt_order_${Date.now()}`,
        payment_capture:1
    }
    try {
        const order = await instance.orders.create(request)

        const createOrderSQL = 'INSERT INTO payments (user_id, order_id, amount,customer_name,mobile_number, charges, currency,invoice_id, payment_date) VALUES (?, ?, ?, ?, ?, ?,?,?,?)'
            db.query(createOrderSQL,[customerID,order.id,amount,CustomerName,phone,chargesAmount,process.env.CURRENCY,Invoice,new Date()],(err,result)=>{
                if (err) {
                    res.status(400)
                    console.log(err);
                    throw new Error("Database insert Failed");

                }
                console.log(result);

                return res.status(201).json({orderid:order.id,amount:order.amount,currency:order.currency})
            })
    } catch (err) {
        console.log(err);
        res.status(500).json({error:err.message})
    }

})

const paymentStatus = asyncHandler(async (req, res) => {
    const { orderID, customerID,charges } = req.body;
    try {
        const response = await instance.orders.fetch(orderID);
        console.log(response,"step 2");


        // const { payment_status, order_amount } = response.data[0];
        const { status, amount_paid } = response;

        const order_amount = parseInt(amount_paid/100)
        const payment_status = status==="paid"&&"SUCCESS"
        // console.log("step 3",order_amount,payment_status);

        const creditedAmount = order_amount-(order_amount*charges/100)
        console.log("step 1", creditedAmount,order_amount,amount_paid);


        // Check if order already marked SUCCESS
        const paymentCheckSQL = `SELECT status FROM payments WHERE order_id = ?`;

        db.query(paymentCheckSQL, [orderID], (err, rows) => {
            if (err) {
                console.error("DB check failed", err);
                return res.status(500).json({ message: "Internal error" });

            }

            const existingStatus = rows[0]?.status;

            if (payment_status === "SUCCESS" && existingStatus !== "SUCCESS") {
                // Update payment status
                const updateStatusSQL = `UPDATE payments SET status = ? WHERE order_id = ?`;
                db.query(updateStatusSQL, ["SUCCESS", orderID]);

                // Update or Insert wallet
                const checkWalletSQL = `SELECT * FROM wallet WHERE wallet_user_id = ? LIMIT 1`;
                db.query(checkWalletSQL, [customerID], (err, rows) => {
                    if (err) return console.error("Wallet check error:", err);

                    if (rows.length > 0) {

                        const updateWalletSQL = `
                            UPDATE wallet
                            SET wallet_balance = wallet_balance + ?, wallet_updated_at= ?
                            WHERE wallet_user_id = ?`;
                        db.query(updateWalletSQL, [creditedAmount, new Date(), customerID],(err,result)=>{
                            console.log(err);
                            console.log(result);


                        });
                    } else {

                        const insertWalletSQL = `
                            INSERT INTO wallet (wallet_user_id, wallet_balance, wallet_updated_at)
                            VALUES (?, ?, ?)`;
                        db.query(insertWalletSQL, [customerID, creditedAmount, new Date()]);
                    }

                    res.status(200).json({ message: "Wallet credited successfully",order_status:payment_status });

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

router.post("/",protect,createOrder)
router.post("/payment-status",protect,paymentStatus)

module.exports=router