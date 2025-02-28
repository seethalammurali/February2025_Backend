const  express = require("express");
const  router = express.Router();
const asyncHandler = require("express-async-handler");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const protect = require("../config/authMiddleware");
const generateToken = require("../config/generateToken");
const fs=require('fs')
const path = require('path')
const {uploadDir} =require('../config/uploads')
const {s3,S3_BUCKET} = require('../config/aws3');
const { ifError } = require("assert");
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const createDistributor = asyncHandler(async (req, res) => {
  const {
    id,
    userType,
    roleId,
    firstName,
    lastName,
    mobile,
    email,
    password,
    aadhar,
    pan,
    status,
    comments,
    create,
    update,
  } = req.body;
  console.log(req.files);

  let files = req.files || {}

  // let aadhar

  const saveFileLocally = (file)=>{
    const filePath = path.join(uploadDir,`${Date.now()}_${file.name}`)
    file.mv(filePath)
    return `/uploads/${path.basename(filePath)}`
  }
  
  const uploadToS3 = async (file) => {
    const uploadParams = {
      Bucket:S3_BUCKET,
      Key:`uploads/${Date.now()}_${file.name}`,
      Body:file.data,
      ContentType:file.miemtype,
      ACL:'public-read'
    }

    const result = await s3.upload(uploadParams).promise()
    return result.Location
  }

  if(files.aadharUrl) aadharUrl= await uploadToS3(files.aadharUrl);
  if(files.panUrl) panUrl= await uploadToS3(files.panUrl);
  if(files.profileUrl) profileUrl= await uploadToS3(files.profileUrl);
  if(files.signatureUrl) signatureUrl= await uploadToS3(files.signatureUrl);
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

   function generateUserId(userType,mobile) {
    return new Promise((resolve, reject) => {
      const lastFiveDigits = mobile.slice(-5)
      let userCode=""

      if (userType === 'distributor') {
        userCode = `QPD${lastFiveDigits}`
      } else if (userType === 'retailer') {
        userCode = `QPR${lastFiveDigits}`
      } else{
        reject(new Error('Invalid user type.Must be distributor or retailer'))
      }
      resolve(userCode)
    })
  }
const distributorId = await generateUserId(userType,mobile)

const findDistributorSql = 'select distributor_id from distributor where distributor_id=?'

const distributorExist = await new Promise((resolve, reject) => {
  db.query(findDistributorSql,[distributorId],(err,result)=>{
    if (err) reject(err)
    resolve(result.length>0)
  })
})

if (distributorExist) {
  res.status(400)
  throw new Error("Distributor exists with the given Mobile");
  
}
  await new Promise((resolve, reject) => {
    db.query(
      createUserSql,
      [
        id,
        distributorId,
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
          console.log('step 3',err);
          
          res.status(400);
          
          throw new Error(err);
        }
        console.log(result);
        
        res
          .status(201)
          .json({
            message: "User registered Successfully",
            userId: distributorId,
          });
      }
    );
  });
});
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const getDistributor = asyncHandler(async (req, res) => {
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

const updateDistributor = asyncHandler(async (req, res) => {
  res.status(201).json({ message: "Customer updated successfully" });
});

// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const getDistributorDetails = asyncHandler(async (req, res) => {
  const {ditributorId} = req.body
  console.log(req.body);
  
  const getDistributorDetailsSql ='select * from distributor where distributor_id=?'
  const distributor = await new Promise((resolve,reject)=>{
    db.query(getDistributorDetailsSql,[ditributorId],(err,result)=>{
      if(err) reject(err)
        resolve(result)
    })
  })
  if (distributor) {
    res.status(201).json(distributor)
  }
});

router.get("/profile", protect, getDistributor);
router.post("/profile/id", protect, getDistributorDetails);
router.post("/register", protect, createDistributor);
router.put("/profile", protect, updateDistributor);
module.exports = router;
