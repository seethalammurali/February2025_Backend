const  express = require("express");
const  router = express.Router();
const asyncHandler = require("express-async-handler");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const protect = require("../config/authMiddleware");
const path = require('path')
const {uploadDir} =require('../config/uploads')
const {s3,S3_BUCKET} = require('../config/aws3');
const {PutObjectCommand} = require('@aws-sdk/client-s3');


const createRetailer = asyncHandler(async (req, res) => {
    const {
      distributorId,
      roleid,
      aadharName,
      mobile,
      email,
      password,
      aadharNumber,
      panNumber,
      userType,
      status,
      comments,
      create,
      update,
      dob,
      gender,
      address,
      state,
      district,
      pincode,
      panName,
      businessName,
      businessCategory,
      businessAddress,
      businessState,
      businessDistrict,
      businessPincode,
      businessLabourLicenseNumber,
      businessProprietorName,
      bankName,
      accountNumber,
      IFSC,
      accountName,
      doj,
      ditributorMargin,
    } = req.body;
    console.log(req.body);
  
    let files = req.files || {}
  
    // let aadhar
  
    const saveFileLocally = (file)=>{
      const filePath = path.join(uploadDir,`${Date.now()}_${file.name}`)
      file.mv(filePath)
      return `/uploads/${path.basename(filePath)}`
    }
  
    const formattedDate =(value)=>{
      const date = new Date(value)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
  
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  
  
    
    const uploadToS3 = async (file) => {
      try {
        
        const uploadParams = {
          Bucket:S3_BUCKET,
          Key:`uploads/${Date.now()}_${file.name}`,
          Body:file.data,
          ContentType:file.miemtype,
          // ACL:'public-read'
        }
    
        const command = new PutObjectCommand(uploadParams)
    
        const result = await s3.send(command)
        
        return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`
      } catch (err) {
        console.log('Error uploading to s3',err);
        throw err
        
      }
    }
  
    if(files.aadharUrl) aadharUrl= await uploadToS3(files.aadharUrl);
    if(files.panUrl) panUrl= await uploadToS3(files.panUrl);
    // if(files.profileUrl) profileUrl= await uploadToS3(files.profileUrl);
    if(files.labourLicenseUrl) labourLicenseUrl= await uploadToS3(files.labourLicenseUrl);
    if(files.shopImageUrl) shopImageUrl= await uploadToS3(files.shopImageUrl);
    if(files.cancelledCheckUrl) cancelledCheckUrl= await uploadToS3(files.cancelledCheckUrl);
    const findCustomerSql =
      "select user_mobile,aadhar_number from retailer where user_mobile=? or aadhar_number=?";
    const customerExist = await new Promise((resolve, reject) => {
      db.query(findCustomerSql, [mobile, aadharNumber], (err, result) => {
        if (err) reject(err);
        console.log("step 10",result);
        resolve(result.length>0);
        
      });
    });
    console.log("step 11",customerExist);
    
    if (customerExist) {
      res.status(400);
      throw new Error("Aadhar or Mobile number already exists");
    }
    const createUserSql =
      "INSERT INTO retailer ( distributor_id,retailer_id,role_id,user_type,name_as_per_aadhaar,aadhar_number,dob,gender,address,state,district,pincode,user_mobile,user_email,user_password,aadhar_url,pan_number,name_as_per_pan,pan_url,business_name,business_category,business_address,business_state,business_district,business_pincode,business_labour_license_Number,business_proprietor_Name,shop_photo_url,business_ll_url,bank_name,account_number,ifsc_code,account_holder_name,cancelled_check_url,doj,kyc_status,comments,distributor_margin,created_timestamp,updated_timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
  
     function generateUserId(userType,mobile) {
      return new Promise((resolve, reject) => {
        const lastFiveDigits = mobile.slice(-5)
        let userCode=""
  
        if (userType === 'retailer') {
          userCode = `QPR${lastFiveDigits}`
        } else{
          reject(new Error('Invalid user type.Must be retailer'))
        }
        resolve(userCode)
      })
    }
  const retailerId = await generateUserId(userType,mobile)
  
  const findRetailerSql = 'select distributor_id from distributor where distributor_id=?'
  
  const distributorExist = await new Promise((resolve, reject) => {
    db.query(findRetailerSql,[retailerId],(err,result)=>{
      if (err) reject(err)
      resolve(result.length>0)
    })
  })
  
  if (distributorExist) {
    res.status(400)
    throw new Error("Retailer exists with the given Mobile");
    
  }
    await new Promise((resolve, reject) => {
      db.query(
        createUserSql,
        [
          distributorId,
          retailerId,
          roleid,
          userType,
          aadharName,
          aadharNumber,
          formattedDate(dob),
          gender,
          address,
          state,
          district,
          pincode,
          mobile,
          email,
          password,
          aadharUrl,
          panNumber,
          panName,
          panUrl,
          businessName,
          businessCategory,
          businessAddress,
          businessState,
          businessDistrict,
          businessPincode,
          businessLabourLicenseNumber,
          businessProprietorName,
          shopImageUrl,
          labourLicenseUrl,
          bankName,
          accountNumber,
          IFSC,
          accountName,
          cancelledCheckUrl,
          formattedDate(doj),
          status,
          comments,
          ditributorMargin,
          formattedDate(create),
          formattedDate(update),
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
              message: "Retailer registered Successfully",
              userId: retailerId,
            });
        }
      );
    });
  });


const getRetailer = asyncHandler(async (req, res) => {
const findRetailerSql = "select * from retailer";
const user = await new Promise((resolve, reject) => {
    db.query(findRetailerSql, (err, result) => {
    if (err) reject(err);
    resolve(result);
    });
});

if (user) {
    res.status(201).json(user);
}
});

const getRetailerDetails = asyncHandler(async (req, res) => {
    const {retailerId} = req.body
    console.log(req.body);
    
    const getRetailerDetailsSql ='select * from retailer where retailer_id=?'
    const distributor = await new Promise((resolve,reject)=>{
      db.query(getRetailerDetailsSql,[retailerId],(err,result)=>{
        if(err) reject(err)
          resolve(result)
      })
    })
  
    if (distributor) {
      res.status(201).json(distributor)
    }
  });


router.get('/profile',protect,getRetailer)
router.post('/profile/id',protect,getRetailerDetails)
router.post('/register',protect,createRetailer)

module.exports=router