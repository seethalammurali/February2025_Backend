const jwt = require('jsonwebtoken')
console.log('step 1');

const generateToken = (res,userId)=>{
const token = jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'1d'})
console.log(token,"step 2");

res.cookie('jwt',token,{
    httOnly:true,
    secure:process.env.NODE_ENV !=='development',
    sameSite: 'strict',
    maxAge:24*60*60*1000
})
}

module.exports=generateToken