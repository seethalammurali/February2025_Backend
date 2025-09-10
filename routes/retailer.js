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
const { Retailer, Distributor, User } = require("../models");
const { Op, where } = require("sequelize");

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

const uploadToS3 = async (file,userType,mobile) => {
  try {
    if (!file || !file.data) {
      throw new Error("Invalid file provided for upload");

    }
    const retailerId = await generateUserId(userType,mobile)
    const filePath = `${retailerId}/${Date.now()}_${file.name}`

    const uploadParams = {
      Bucket:S3_BUCKET,
      Key:`TheQuickPayMe/${filePath}`,
      Body:file.data,
      ContentType:file.mimetype,
      ACL:'public-read'
    }

    const command = new PutObjectCommand(uploadParams)

    const result = await s3.send(command)

    return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/TheQuickPayMe/${filePath}`
  } catch (err) {
    console.log('Error uploading to s3',err);
    throw err

  }
}

function generateUserId(userType,mobile) {
  return new Promise((resolve, reject) => {
    const lastFiveDigits = mobile.slice(-5)
    let userCode=""

    if (userType === 'retailer') {
      userCode = `QPR${lastFiveDigits}`
    } else{
      reject(new Error('Invalid user type. Must be retailer'))
    }
    resolve(userCode)
  })
}
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
    retailerPercentage,
  } = req.body;

  let files = req.files || {};
  let aadharUrl, panUrl, labourLicenseUrl, shopImageUrl, cancelledCheckUrl;

  if (files.aadharUrl) aadharUrl = await uploadToS3(files.aadharUrl, userType, mobile);
  if (files.panUrl) panUrl = await uploadToS3(files.panUrl, userType, mobile);
  if (files.labourLicenseUrl) labourLicenseUrl = await uploadToS3(files.labourLicenseUrl, userType, mobile);
  if (files.shopImageUrl) shopImageUrl = await uploadToS3(files.shopImageUrl, userType, mobile);
  if (files.cancelledCheckUrl) cancelledCheckUrl = await uploadToS3(files.cancelledCheckUrl, userType, mobile);

  // Check if retailer already exists (by mobile OR Aadhaar)
  const existingRetailer = await Retailer.findOne({
    where: {
      [Op.or]: [{ user_mobile: mobile }, { aadhar_number: aadharNumber }],
    },
  });

  if (existingRetailer) {
    return res.status(400).json({ message: "Aadhar or Mobile number already exists" });
  }

  // Validate distributor exists
  const distributorExists = await Distributor.findOne({ where: { distributor_id: distributorId } });
  if (!distributorExists) {
    return res.status(400).json({ message: "Distributor does not exist" });
  }

  // Generate retailer ID
  const retailerId = await generateUserId(userType, mobile);

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create retailer
  const retailer = await Retailer.create({
    distributor_id: distributorId,
    retailer_id: retailerId,
    role_id: roleid,
    user_type: userType,
    name_as_per_aadhaar: aadharName,
    aadhar_number: aadharNumber,
    dob: formattedDate(dob),
    gender,
    address,
    state,
    district,
    pincode,
    user_mobile: mobile,
    user_email: email,
    user_password: hashedPassword,
    aadhar_url: aadharUrl,
    pan_number: panNumber,
    name_as_per_pan: panName,
    pan_url: panUrl,
    business_name: businessName,
    business_category: businessCategory,
    business_address: businessAddress,
    business_state: businessState,
    business_district: businessDistrict,
    business_pincode: businessPincode,
    business_labour_license_number: businessLabourLicenseNumber,
    business_proprietor_name: businessProprietorName,
    shop_photo_url: shopImageUrl,
    business_ll_url: labourLicenseUrl,
    bank_name: bankName,
    account_number: accountNumber,
    ifsc_code: IFSC,
    account_holder_name: accountName,
    cancelled_check_url: cancelledCheckUrl,
    doj: formattedDate(doj),
    kyc_status: status,
    comments,
    retailer_percentage: retailerPercentage,
    created_at: formattedDate(create),
    updated_at: formattedDate(update),
  });

  res.status(201).json({
    message: "Retailer registered successfully",
    userId: retailer.retailer_id,
  });
});



// controllers/retailerController.js
const getRetailer = asyncHandler(async (req, res) => {
  try {
    const { distributor } = req.body;

    // Build query condition
    const whereClause = distributor ? { distributor_id: distributor } : {};

    // Fetch retailers
    const retailers = await Retailer.findAll({ where: whereClause });

    if (!retailers || retailers.length === 0) {
      return res.status(404).json({ message: "No retailer found" });
    }

    return res.status(200).json(retailers);
  } catch (err) {
    console.error("Error fetching retailers:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
});

const updateRetailer = asyncHandler(async (req, res) => {
  try {
    const {
      ID,
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
      retailerPercentage,
    } = req.body;

    console.log("Step 10", req.body);

    let files = req.files || {};
    let uploadedFiles = {};

    // Upload files if present
    const uploadPromises = ["aadharUrl", "panUrl", "labourLicenseUrl", "shopImageUrl", "cancelledCheckUrl"].map(
      async (key) => {
        if (files[key]) {
          uploadedFiles[key] = await uploadToS3(files[key], userType, mobile);
        }
      }
    );
    await Promise.all(uploadPromises);

    // Find retailer
    const retailer = await Retailer.findOne({ where: { id: ID } });
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    // Hash password if provided
    let hashedPassword = retailer.user_password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Generate new retailer ID (optional - only if you want to change ID)
    const newRetailerId = userType && mobile ? await generateUserId(userType, mobile) : retailer.retailer_id;

    // Build update object dynamically
    const updateData = {
      distributor_id: distributorId || retailer.distributor_id,
      retailer_id: newRetailerId,
      role_id: roleid || retailer.role_id,
      user_type: userType || retailer.user_type,
      name_as_per_aadhaar: aadharName || retailer.name_as_per_aadhaar,
      aadhar_number: aadharNumber || retailer.aadhar_number,
      dob: dob ? formattedDate(dob) : retailer.dob,
      gender: gender || retailer.gender,
      address: address || retailer.address,
      state: state || retailer.state,
      district: district || retailer.district,
      pincode: pincode || retailer.pincode,
      user_mobile: mobile || retailer.user_mobile,
      user_email: email || retailer.user_email,
      user_password: hashedPassword,
      aadhar_url: uploadedFiles.aadharUrl || retailer.aadhar_url,
      pan_number: panNumber || retailer.pan_number,
      pan_url: uploadedFiles.panUrl || retailer.pan_url,
      name_as_per_pan: panName || retailer.name_as_per_pan,
      business_name: businessName || retailer.business_name,
      business_category: businessCategory || retailer.business_category,
      business_address: businessAddress || retailer.business_address,
      business_state: businessState || retailer.business_state,
      business_district: businessDistrict || retailer.business_district,
      business_pincode: businessPincode || retailer.business_pincode,
      business_labour_license_number: businessLabourLicenseNumber || retailer.business_labour_license_number,
      business_proprietor_name: businessProprietorName || retailer.business_proprietor_name,
      shop_photo_url: uploadedFiles.shopImageUrl || retailer.shop_photo_url,
      business_ll_url: uploadedFiles.labourLicenseUrl || retailer.business_ll_url,
      bank_name: bankName || retailer.bank_name,
      account_number: accountNumber || retailer.account_number,
      ifsc_code: IFSC || retailer.ifsc_code,
      account_holder_name: accountName || retailer.account_holder_name,
      cancelled_check_url: uploadedFiles.cancelledCheckUrl || retailer.cancelled_check_url,
      doj: doj ? formattedDate(doj) : retailer.doj,
      kyc_status: status || retailer.kyc_status,
      comments: comments || retailer.comments,
      retailer_percentage: retailerPercentage || retailer.retailer_percentage,
      updated_at: formattedDate(update),
    };

    await retailer.update(updateData);

    res.status(200).json({
      message: "Retailer updated successfully",
      retailerId: retailer.retailer_id,
    });
  } catch (err) {
    console.error("Error in updating retailer", err);
    res.status(500).json({ message: "Internal server error", err });
  }
});


const approveRetailer = asyncHandler(async (req, res) => {
  const { retailer, status, create, update } = req.body;
  const password = process.env.RETAILER_PSWD;

  try {
    // Check if retailer exists
    const retailerExist = await Retailer.findOne({
      where: { retailer_id: retailer },
      attributes: ["id","role_id", "retailer_id", "user_mobile", "user_email", "kyc_status"],
    });

    if (!retailerExist) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    const { role_id, retailer_id, user_mobile, user_email } = retailerExist;

    if (status === "Approve") {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update retailer status
      await retailerExist.update({
        kyc_status: status,
        user_password: hashedPassword,
      },{where:{id:retailerExist.id}});

      // Create retailer login in users table
      await User.create({
        role_id,
        user_id: retailer_id,
        user_password: hashedPassword,
        user_mobile,
        user_email,
        created_at: formattedDate(create),
        updated_at: formattedDate(update),
      });

      return res.status(201).json({ message: "Retailer approved successfully" });
    } else if (status === "Reject") {
      // Update retailer status only
      await retailerExist.update({ kyc_status: status });

      return res.status(200).json({ message: "Retailer rejected" });
    } else {
      return res.status(400).json({ message: "Invalid status provided" });
    }
  } catch (err) {
    console.error("Error in approveRetailer:", err);
    res.status(500).json({ message: "Internal server error", err });
  }
});


const getRetailerDetails = asyncHandler(async (req, res) => {
  try {
    const { retailerId } = req.body;

    if (!retailerId) {
      return res.status(400).json({ message: "Retailer ID is required" });
    }

    // Fetch retailer by ID
    const retailer = await Retailer.findOne({
      where: { retailer_id: retailerId },
    });

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    return res.status(200).json([retailer]);
  } catch (err) {
    console.error("Error fetching retailer details:", err);
    return res
      .status(500)
      .json({ message: "Database error", error: err.message });
  }
});


const updateRetailerPercentage = asyncHandler(async (req, res) => {
  const { id, margin } = req.body;

  try {
    if (margin === undefined) {
      return res.status(400).json({ error: "Margin is required" });
    }

    const whereCondition = id ? { retailer_id: id } : {}; // update all if no id

    await Retailer.update(
      { retailer_percentage: margin },
      { where: whereCondition }
    );

    res.status(201).json({ message: "Margin updated successfully" });
  } catch (err) {
    console.error("Error in updateRetailerPercentage:", err);
    res.status(500).json({ message: "Internal server error", err });
  }
});

// Update retailer status
const retailerStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;

  try {
    if (status === undefined) {
      return res.status(400).json({ error: "Status is required" });
    }

    await Retailer.update(
      { retailer_status: status },
      { where: { retailer_id: id } }
    );

    res.status(201).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error in retailerStatus:", err);
    res.status(500).json({ message: "Internal server error", err });
  }
});

router.post('/profile',protect,getRetailer)
router.post('/profile/id',protect,getRetailerDetails)
router.post('/register',protect,createRetailer)
router.put('/profile',protect,updateRetailer)
router.post('/approve',protect,approveRetailer)
router.put('/update',protect,updateRetailerPercentage)
router.put("/status", protect, retailerStatus);

module.exports=router