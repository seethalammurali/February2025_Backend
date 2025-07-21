var express = require('express');
var router = express.Router();
const asyncHandler = require('express-async-handler')
const db = require('../config/db')
const bcrypt = require('bcryptjs')
const protect = require('../config/authMiddleware')

const getDashboard=asyncHandler(async(req,res)=>{
  const{distributor} = req.body
  console.log(req.body);

    let getDashboardSql = `select
        (select count(distributor_id) from distributor)  total_distributor,
        (select count(retailer_id) from retailer)  total_retailer,
        (select count(kyc_status) from retailer where kyc_status='Pending') total_pending;`;
    let value = []

    if (distributor) {
      getDashboardSql = `select
    count(*) as total_retailer,
    count(case when kyc_status = 'Pending' then 1 end) as total_pending
from retailer
where distributor_id = ?;`;
       value=[distributor]
    }
    try {
      const dashboardData = await new Promise((resolve, reject) => {
        db.query(getDashboardSql,value, (err, result) => {
          if (err) reject(err);

          resolve(result);
        });
      });
      if (dashboardData.length > 0 ) {
        res.status(201).json(dashboardData)
      }else{
        return res.status(400).json({message:'No Data found'})
      }

    } catch (err) {
      res.status(500).json({message:'Database error',err})
    }
})

const retailer = asyncHandler(async (req,res) => {
  console.log(req.body);
  const {customerID} = req.body

  const retailerDashboardSQL = `select w.*,r.business_name from wallet w join retailer r on w.wallet_user_id=r.retailer_id where w.wallet_user_id=?;`
  try {
    const result = await new Promise((resolve, reject) => {
    db.query(retailerDashboardSQL, [customerID], (err, rows) => {
      if (err) {return reject(err)};
      resolve(rows)

    });
  });
  if(result.length ===0){
    return res.status(404).json({message:"Wallet not found for this user"})
  }
  res.status(200).json({wallet:result[0]})

  } catch (err) {
    console.log(err);
    res.status(500).json({message:"Server Error"})

  }


})
router.post('/',protect,getDashboard)
router.post('/retailer',protect,retailer)


module.exports=router