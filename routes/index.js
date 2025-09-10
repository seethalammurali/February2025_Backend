const express = require('express');
const router = express.Router();
const db = require('../config/db')
const { User, UserRole } = require('../models')
/* GET home page. */
router.post('/', async function(req, res, next) {
  try {
    const { userID, password } = req.body;

    // ✅ Fetch user with role using Sequelize associations
    const user = await User.findOne({
      where: { user_id: userID },
      include: [{ model: UserRole, attributes: ["Role"] }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid user ID or password" });
    }

    // ✅ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid user ID or password" });
    }

    // ✅ Safe response (omit sensitive fields)
    res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        email: user.user_email,
        role: user.UserRole.Role, // comes from include
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }

});

module.exports = router;
