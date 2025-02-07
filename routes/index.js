const express = require('express');
const router = express.Router();
const db = require('../config/db')
/* GET home page. */
router.post('/', function(req, res, next) {
  console.log(req.body)
  const {userID,password} = req.body
  sql_login=`select ur.Role,l.user_email,l.user_password,l.user_id from login l join user_roles ur on l.role_id=ur.ID where l.user_id='${userID}';`

  db.query(sql_login,(err,results)=>{
    if (err) {
      console.log(err);
      
    } else {
      res.json(results)
      // console.log(results);
      
      
    }
  })
});

module.exports = router;
