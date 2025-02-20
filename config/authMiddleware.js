const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler');
const db = require('./db');

const protect = asyncHandler(async(req,res,next)=>{
    console.log('cookie',req);
    
    
    let token;

    token = req.cookies.jwt
    if (!token) {
        res.status(401)
        throw new Error("Not Authorized,no token");
        
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        
        const getUserSql = 'select user_id,user_email,role_id from login where user_id=?'
        db.query(getUserSql,[decoded.userId],(err,result)=>{
            if (err) {
                res.status(500).json({message:'Database error'})
                return
            }
            if (result.length===0) {
                res.status(401)
                throw new Error("Not Authorized,user not found");
                
            }
            req.user = {
                id: result[0].user_id,
                email: result[0].user_email,
                role: result[0].role_id,
              };
        
            next()
        })
    } catch (error) {
        res.status(401)
        throw new Error("Not Authorized,token failed");
        
        
    }
    

})

module.exports=protect