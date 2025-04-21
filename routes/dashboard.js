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

router.post('/',protect,getDashboard)


module.exports=router