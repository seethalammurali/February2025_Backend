const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
const { Cashfree, CFEnvironment } =require("cashfree-pg");

const cashfree = new Cashfree(CFEnvironment.SANDBOX, `${process.env.APP_ID}`, `${process.env.SECRET_KEY}`);

const createOrder = asyncHandler(async (req, res) => {
  const { amount,CustomerName,Invoice, phone, customerID, orderID, charges } = req.body;

  // Convert charge % to actual value (2 decimal precision)
  const chargesAmount = Number(((amount * charges) / 100).toFixed(2));
  const creditedAmount = Number((amount - chargesAmount).toFixed(2));

  const request = {
    order_amount: amount,
    order_currency: process.env.CURRENCY,
    order_id: orderID,
    customer_details: {
      customer_id: customerID,
      customer_phone: phone,
    },
    order_meta: {
      return_url: process.env.STATUS_PAGE,
    },
  };

  try {
    const response = await cashfree.PGCreateOrder(request);

    const createOrderSQL = `
      INSERT INTO payments (user_id, order_id, amount,customer_name,mobile_number, charges, currency,invoice_id, payment_date)
      VALUES (?, ?, ?, ?, ?, ?,?,?,?)
    `;

    db.query(
      createOrderSQL,
      [customerID, orderID, amount,CustomerName,phone, chargesAmount, process.env.CURRENCY,Invoice, new Date()],
      (err, result) => {
        if (err) {
          console.error("DB Insert Error:", err);
          res.status(400);
          throw new Error("Failed to insert order into DB");
        }

        return res.status(201).json({
          message: "Order Created Successfully",
          Session_ID: response.data.payment_session_id,
        });
      }
    );
  } catch (error) {
    console.error("Cashfree Error:", error?.response?.data || error.message);
    res.status(400).json({ message: error?.response?.data?.message || "Payment failed" });
  }
});


const paymentStatus = asyncHandler(async (req, res) => {
    const { orderID, customerID,charges } = req.body;


    try {
        const response = await cashfree.PGOrderFetchPayments(orderID);

        const { payment_status, order_amount } = response.data[0];
        const creditedAmount = order_amount-(order_amount*charges/100)

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



const orderHistory = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const orderHistorySQL = "SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC";

  try {
    const orders = await new Promise((resolve, reject) => {
      db.query(orderHistorySQL, [userId], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return reject(err);
        }
        resolve(result);

      });
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }

    res.status(200).json({  orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});



router.post("/",protect,createOrder)
router.post("/payment-status",protect,paymentStatus)
router.post('/orders',protect,orderHistory)

module.exports = router