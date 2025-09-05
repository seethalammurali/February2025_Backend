const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
const bcrypt = require('bcryptjs')
const nodemailer = require("nodemailer");
const { where } = require('sequelize');
const { User } = require('../models');



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false, // ⛔ not recommended for production
  }

});


transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP Error:", err);
  } else {
    console.log("✅ Gmail server is ready to send messages");
  }
});


const forgotPassword = asyncHandler(async(req,res)=>{
    try {
        const {user_email} = req.body
        const user = await User.findOne({where:{user_email}})

        if (!user ) {
            return res.status(404).json({message:'User not found'})
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        user.otp=otp
        user.otp_expiry=otpExpiry
        await user.save()

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user_email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    });

    res.json({ message: "OTP sent to your email" });

    } catch (err) {
        console.log(err);
        res.status(500).json({message:'Server error'})

    }
})

const verify = asyncHandler(async (req,res) => {
    try {
    const { user_email, otp } = req.body;
    const user = await User.findOne({ where: { user_email } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otp_expiry < new Date()) return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }


})

const resetPassword = asyncHandler(async (req,res) => {
    try {
    const { user_email, password } = req.body;
    const user = await User.findOne({ where: { user_email } });
    console.log(user);


    if (!user) return res.status(404).json({ message: "User not found" });
    // if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    // if (user.otp_expiry < new Date()) return res.status(400).json({ message: "OTP expired" });

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    user.user_password = hashedPassword;
    // user.otp = null;
    // user.otp_expiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

})

router.post('/forgot-password',protect,forgotPassword)
router.post('/verify',protect,verify)
router.post('/reset-password',protect,resetPassword)
module.exports=router;