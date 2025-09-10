const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db');
const { BankDetails, CardDetails } = require('../models');


const bankDetails = asyncHandler(async (req, res) => {
  const { bankName, accountNumber, ifsc, mobile } = req.body;

  try {
    await BankDetails.create({
      bank_name: bankName,
      bank_account_number: accountNumber,
      bank_ifsc_code: ifsc,
      bank_mobile_number: mobile,
    });

    res.status(201).json({ message: "Bank details added successfully" });
  } catch (err) {
    console.error("Error adding bank details:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Add Card Details
const cardDetails = asyncHandler(async (req, res) => {
  const { cardName, cardNumber, bankName, mobile } = req.body;

  try {
    await CardDetails.create({
      card_name: cardName,
      card_number: cardNumber,
      card_bank_name: bankName,
      card_mobile_number: mobile,
    });

    res.status(201).json({ message: "Card details added successfully" });
  } catch (err) {
    console.error("Error adding card details:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

router.post("/",protect,bankDetails)
router.post("/card",protect,cardDetails)
module.exports=router