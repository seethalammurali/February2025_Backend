var express = require('express');
var router = express.Router();
const asyncHandler = require('express-async-handler')
const db = require('../config/db')
const bcrypt = require('bcryptjs')
const protect = require('../config/authMiddleware')

const getDashboard=asyncHandler(async(req,res)=>{
    const getDashboardSql = `select
 (select count(distributor_id) from distributor)  total_distributor,
 (select count(retailer_id) from retailer)  total_retailer,
 (select count(kyc_status) from retailer where kyc_status='Pending') total_pending;`;
  const dashboardData = await new Promise((resolve, reject) => {
    db.query(getDashboardSql, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  if (dashboardData) {
    res.status(201).json(dashboardData);
  }
// res.json({message:'Dashboard data'})
})
const getDistributorDashboard=asyncHandler(async(req,res)=>{
    const {distributor}=req.body
    const getDistributorDashboardSql = `select
 (select count(retailer_id) from retailer where distributor_id=? )  total_retailer`;
 try {
    
 } catch (err) {
    console.log(err);
    throw new Error("Internal server error",err);
    
 }
  const dashboardData = await new Promise((resolve, reject) => {
    db.query(getDistributorDashboardSql,[distributor], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  if (dashboardData) {
    res.status(201).json(dashboardData);
  }
})
router.get('/',protect,getDashboard)
router.post('/distributor',protect,getDistributorDashboard)


module.exports=router