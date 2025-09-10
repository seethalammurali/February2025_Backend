const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const db = require('../config/db')
const bcrypt = require('bcryptjs')
const protect = require('../config/authMiddleware')
const generateToken = require('../config/generateToken')
const {encrypt} = require('../middleware/encryption')
const { User, UserRole, UserAudit } = require('../models');

/* GET users listing. */
// @desc Register a new user
// @route POST /api/users/auth
// @access Public
const registerUser = asyncHandler(async(req,res)=>{
  try {
    const {id,email,password,userid,role,mobile,create,update} = req.body;
    if (!email || !password || !userid || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = await User.findOne({ where: { user_email: email } });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 🔑 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 📝 Create user using Sequelize
    const newUser = await User.create({
      id,
      role_id: role,
      user_id: userid,
      user_password: hashedPassword,
      user_mobile: encrypt(mobile),
      user_email: email,
      created_at: create || new Date(),
      updated_at: update || new Date(),
    });

    return res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id,
    });
  } catch (err) {
    console.error("Error in registering user",err);
    return res.status(500).json({error:'Internal server error'})
  }
})

// @desc Auth user & get token
// @route POST /api/users/auth
// @access Public
const authUser = asyncHandler(async (req, res) => {
  try {
    const { userid, password, geoLocation } = req.body;

    if (!userid || !password) {
      return res.status(400).json({ error: "User ID and password are required" });
    }

    // 🔍 Find user with role (Sequelize join using include)
    const user = await User.findOne({
      where: { user_id: userid },
      include: [
        {
          model: UserRole,
          attributes: ["role"], // adjust to actual column name
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🔑 Verify password
    const matchPassword = await bcrypt.compare(password, user.user_password);
    if (!matchPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🎟️ Generate JWT token
    const token = generateToken(res, user.user_id);

    // 💾 Save session token
    await User.update(
      { session_token: token },
      { where: { user_id: userid } }
    );

    // 🌍 Insert into audit table if geolocation provided
    if (geoLocation?.latitude && geoLocation?.longitude) {
      await UserAudit.create({
        user_id: userid,
        login_time:new Date(),
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      });
    }

    // 🎯 Successful response
    res.json({
      message: "Authentication Successful",
      id: user.user_id,
      email: user.user_email,
      role: user.UserRole?.role || null,
      phone: user.user_mobile,
      termsAccepted: user.terms_accepted,
    });
  } catch (error) {
    console.error("❌ Auth error:", error);
    res.status(500).json({ error: "Authentication Failed" });
  }
});

module.exports = { authUser };



// @desc Logout user / clear cookie
// @route POST /api/users/auth
// @access Public
const logoutUser = ((req,res)=>{

  res.cookie('jwt','',{
    httpOnly:true,
    expires:new Date(0)
  })
  res.status(200).json({message:"Logged out successfully "})
})

// @desc Get user profile
// @route POST /api/users/auth
// @access Public
const getUser = asyncHandler(async(req,res)=>{
  if (req.user) {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role:req.user.role
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }

})
// @desc Get user profile
// @route POST /api/users/auth
// @access Public
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, userid } = req.body;
    const userId = req.user.id; // from auth middleware

    // 🔎 Check if user exists
    const user = await User.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 📝 Prepare updates
    const updatedUserId = userid || user.user_id;
    const updatedEmail = email || user.user_email;

    let updatedPassword = user.user_password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(password, salt);
    }

    // ⏱ Update with Sequelize
    await User.update(
      {
        user_email: updatedEmail,
        user_id: updatedUserId,
        user_password: updatedPassword,
        updated_at: new Date(),
      },
      { where: { user_id: userId } }
    );

    return res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ message: "Error updating user data" });
  }
});


const acceptTerms = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔎 Check if user exists
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Update terms_accepted
    await User.update(
      { terms_accepted: true, updated_at: new Date() },
      { where: { user_id: userId } }
    );

    return res.json({ message: "Terms Accepted" });
  } catch (err) {
    console.error("Error updating terms:", err);
    return res.status(500).json({ message: "Failed to update terms status" });
  }
});



router.post('/',registerUser)
router.post('/auth',authUser)
router.post('/logout',logoutUser)
router.get('/profile',protect,getUser)
router.put('/profile',protect,updateUser)
router.put('/terms',protect,acceptTerms)

module.exports = router;
