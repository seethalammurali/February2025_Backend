const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler');
const db = require('./db');

const protect = asyncHandler(async(req,res,next)=>{
    let token;
    token = req.cookies.jwt


    if (req.headers['postman-token']) {
        console.log("Postman request detected-Skipping session validation");
        return next()

    }
    if (!token) {
        res.status(401)
        throw new Error("Not Authorized,no token");

    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        const getUserSql = 'select user_id,user_email,role_id,session_token from users where user_id=?'

        const user = await new Promise((resolve, reject) => {
            db.query(getUserSql,[decoded.userId],(err,result)=>{
                if (err) reject(err)
                resolve( result[0])
            })
        })

        if (!user) {
            res.status(401)
            throw new Error("Not Authorized,user not found");

        }
        if (user.session_token !==token || !user.session_token) {
            return res.status(401).json({message:'You are logged in on another device.',actionRequired:true})
        }
        req.user = {
            id: user.user_id,
            email: user.user_email,
            role: user.role_id,
          };
        next()
    } catch (error) {
        res.status(401)
        throw new Error("Not Authorized,token failed");

    }

})

module.exports=protect