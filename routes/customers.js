var express = require("express");
var router = express.Router();
const asyncHandler = require("express-async-handler");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const protect = require("../config/authMiddleware");
const generateToken = require("../config/generateToken");

// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const createCustomer = asyncHandler(async (req, res) => {
  const {
    id,
    ditributorId,
    roleId,
    firstName,
    lastName,
    mobile,
    email,
    password,
    aadhar,
    aadharUrl,
    pan,
    panUrl,
    profileUrl,
    signatureUrl,
    status,
    comments,
    create,
    update,
  } = req.body;

  const findCustomerSql =
    "select user_mobile,aadhar_number from distributor where user_mobile=? and aadhar_number=?";
  const customerExist = await new Promise((resolve, reject) => {
    db.query(findCustomerSql, [mobile, aadhar], (err, result) => {
      if (err) reject(err);
      resolve(result.length>0);
      console.log(result);
      
    });
  });
  console.log(customerExist);
  
  if (customerExist) {
    res.status(400);
    throw new Error("Dealer or Retailer already exists");
  }
  const createUserSql =
    "INSERT INTO distributor (ID, distributor_id,role_id,first_name,last_name,user_mobile,user_email,user_password,aadhar_number,aadhar_url,pan_number,pan_url,profile_url,signature_url,doj,kyc_status,comments,updated_timestamp) VALUES (?,?,?,?, ?,?,?,?,?,?,?, ?, ?, ?, ?,?,?,?);";

  await new Promise((resolve, reject) => {
    db.query(
      createUserSql,
      [
        id,
        ditributorId,
        roleId,
        firstName,
        lastName,
        mobile,
        email,
        password,
        aadhar,
        aadharUrl,
        pan,
        panUrl,
        profileUrl,
        signatureUrl,
        create,
        status,
        comments,
        update,
      ],
      (err, result) => {
        if (err) {
          res.status(400);
          
          throw new Error("Inavlid User Data",err);
        }
        res
          .status(201)
          .json({
            message: "User registered Successfully",
            userId: result.insertId,
          });
      }
    );
  });
  res.status(201).json({ message: "Customercreated successfully" });
});
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const getCustomer = asyncHandler(async (req, res) => {
  const findCustomerSql = "select * from distributor";
  const user = await new Promise((resolve, reject) => {
    db.query(findCustomerSql, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  if (user) {
    res.status(201).json(user);
  }
});
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const updateCustomer = asyncHandler(async (req, res) => {
  res.status(201).json({ message: "Customer updated successfully" });
});

router.get("/profile", protect, getCustomer);
router.post("/register", protect, createCustomer);
router.put("/profile", protect, updateCustomer);
module.exports = router;
