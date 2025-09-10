var express = require('express');
var router = express.Router();
const asyncHandler = require('express-async-handler')
const db = require('../config/db')
const bcrypt = require('bcryptjs')
const protect = require('../config/authMiddleware');
const { Retailer, Distributor, Wallet } = require('../models');

const getDashboard = asyncHandler(async (req, res) => {
  try {
    const { distributor } = req.body;

    let dashboardData = {};

    if (distributor) {
      // For a specific distributor
      const totalRetailer = await Retailer.count({
        where: { distributor_id: distributor },
      });

      const totalPending = await Retailer.count({
        where: { distributor_id: distributor, kyc_status: "Pending" },
      });

      dashboardData = [{ total_retailer: totalRetailer, total_pending: totalPending }];
    } else {
      // For all distributors
      const totalDistributor = await Distributor.count();
      const totalRetailer = await Retailer.count();
      const totalPending = await Retailer.count({ where: { kyc_status: "Pending" } });

      dashboardData = [{
        total_distributor: totalDistributor,
        total_retailer: totalRetailer,
        total_pending: totalPending,
      }];
    }

    if (!dashboardData || Object.keys(dashboardData).length === 0) {
      return res.status(400).json({ message: "No Data found" });
    }

    return res.status(200).json(dashboardData);
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
});


const retailer = asyncHandler(async (req, res) => {
  const { customerID } = req.body;

  try {
    const wallet = await Wallet.findOne({
      where: { wallet_user_id: customerID },
      include: [
        {
          model: Retailer,
          attributes: ["business_name"],
          required: true, // ensures join behaves like INNER JOIN
        },
      ],
    });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for this user" });
    }

    res.status(200).json({ wallet });
  } catch (err) {
    console.error("Error in retailer dashboard:", err);
    res.status(500).json({ message: "Server Error", err });
  }
});

router.post('/',protect,getDashboard)
router.post('/retailer',protect,retailer)


module.exports=router