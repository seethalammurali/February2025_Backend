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
const {encrypt,decrypt} = require('../middleware/encryption')
 
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
      throw new Error('Invalid file provided for upload')
    }

    const distributorFolder = await generateUserId(userType,mobile);
    console.log("step 1",distributorFolder);
    
    const filePath = `${distributorFolder}/${Date.now()}_${file.name}`
    console.log('step 2',filePath);
    

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

    if (userType === 'distributor') {
      userCode = `QPD${lastFiveDigits}`
    } else{
      reject(new Error('Invalid user type. Must be distributor'))
    }
    resolve(userCode)
  })
}

function isEncrypted(value) {
  return (
    typeof value === "string" &&
    value.includes(":") &&
    value.split(":").length === 2 &&
    /^[0-9a-fA-F]+$/.test(value.split(":")[0])
  );
}


// @desc create distributor profile
// @route POST /api/users/auth
// @access Private

const createDistributor = asyncHandler(async (req, res) => {
  const {
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

  if(files.aadharUrl) aadharUrl= await uploadToS3(files.aadharUrl,userType,mobile);
  if(files.panUrl) panUrl= await uploadToS3(files.panUrl,userType,mobile);
  // if(files.profileUrl) profileUrl= await uploadToS3(files.profileUrl);
  if(files.labourLicenseUrl) labourLicenseUrl= await uploadToS3(files.labourLicenseUrl,userType,mobile);
  if(files.shopImageUrl) shopImageUrl= await uploadToS3(files.shopImageUrl,userType,mobile);
  if(files.cancelledCheckUrl) cancelledCheckUrl= await uploadToS3(files.cancelledCheckUrl,userType,mobile);


  const findCustomerSql =
    "select user_mobile,aadhar_number from distributor where user_mobile=? or aadhar_number=?";
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
    "INSERT INTO distributor ( distributor_id,role_id,user_type,name_as_per_aadhaar,aadhar_number,dob,gender,address,state,district,pincode,user_mobile,user_email,user_password,aadhar_url,pan_number,name_as_per_pan,pan_url,business_name,business_category,business_address,business_state,business_district,business_pincode,business_labour_license_Number,business_proprietor_Name,shop_photo_url,business_ll_url,bank_name,account_number,ifsc_code,account_holder_name,cancelled_check_url,doj,kyc_status,comments,distributor_margin,created_timestamp,updated_timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

   
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
        distributorId,
        roleid,
        userType,
        encrypt(aadharName),
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
        // profileUrl,
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
            message: "Distributor registered Successfully",
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
  const findDistributorSql = "select * from distributor";
  try {
    const user = await new Promise((resolve, reject) => {
      db.query(findDistributorSql, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
    const decryptedData = user.map((item)=>{
      
        const decryptedUser = {...item}
  
        for(const key in decryptedUser){
          if (isEncrypted(decryptedUser[key])) {
            try {
              decryptedUser[key]= decrypt(decryptedUser[key])
            } catch (err) {
              console.warn(`Decryption failed for key  ${key}`);
              
            }
          }
        }
        return decryptedUser
    })
    res.status(201).json(decryptedData)
  } catch (err) {
    
    res.status(500).json({message:'Failed to fetch disributor'})
  }

  // if (user) {
  //   res.status(201).json(user);
  // }
});
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const updateDistributor = asyncHandler(async (req, res) => {

  try {
    const {
      ID,
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
      ditributorMargin
    } = req.body
    console.log("step 10",req.body);
    console.log("step 11",req.files);
  
    let files = req.files || {}
  
    const uploadPromises = ["aadharUrl","panUrl","labourLicenseUrl","shopImageUrl","cancelledCheckUrl"].map(async (key) => {
      if (files[key]) {
        return {[key]:await uploadToS3(files[key],userType,mobile)}
      }
      return{[key]:null}
    })
  
    const uploadFiles =Object.assign({},...(await Promise.all(uploadPromises)))
    const updateDistributorSql = `UPDATE distributor 
            SET 
                distributor_id = COALESCE(?, distributor_id), 
                role_id = COALESCE(?, role_id), 
                user_type = COALESCE(?, user_type), 
                name_as_per_aadhaar = COALESCE(?, name_as_per_aadhaar), 
                aadhar_number = COALESCE(?, aadhar_number), 
                dob = COALESCE(?, dob), 
                gender = COALESCE(?, gender), 
                address = COALESCE(?, address), 
                state = COALESCE(?, state), 
                district = COALESCE(?, district), 
                pincode = COALESCE(?, pincode), 
                user_mobile = COALESCE(?, user_mobile), 
                user_email = COALESCE(?, user_email), 
                user_password = COALESCE(?, user_password),
                aadhar_url=COALESCE(?, aadhar_url),
                pan_number = COALESCE(?, pan_number), 
                pan_url = COALESCE(?, pan_url), 
                name_as_per_pan = COALESCE(?, name_as_per_pan), 
                business_name = COALESCE(?, business_name), 
                business_category = COALESCE(?, business_category), 
                business_address = COALESCE(?, business_address), 
                business_state = COALESCE(?, business_state), 
                business_district = COALESCE(?, business_district), 
                business_pincode = COALESCE(?, business_pincode), 
                business_labour_license_Number = COALESCE(?, business_labour_license_Number), 
                business_proprietor_Name = COALESCE(?, business_proprietor_Name), 
                shop_photo_url = COALESCE(?, shop_photo_url), 
                business_ll_url = COALESCE(?, business_ll_url), 
                bank_name = COALESCE(?, bank_name), 
                account_number = COALESCE(?, account_number), 
                cancelled_check_url = COALESCE(?, cancelled_check_url), 
                ifsc_code = COALESCE(?, ifsc_code), 
                account_holder_name = COALESCE(?, account_holder_name), 
                doj = COALESCE(?, doj), 
                kyc_status = COALESCE(?, kyc_status), 
                comments = COALESCE(?, comments), 
                distributor_margin = COALESCE(?, distributor_margin),
                updated_timestamp = COALESCE(?, updated_timestamp)
            WHERE ID = ?`;

    const newDistributorId  = await generateUserId(userType,mobile)
  await new Promise((resolve, reject) => {
    db.query(updateDistributorSql,
      [
        newDistributorId,
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
        uploadFiles.aadharUrl,
        panNumber,
        uploadFiles.panUrl,
        panName,
        businessName,
        businessCategory,
        businessAddress,
        businessState,
        businessDistrict,
        businessPincode,
        businessLabourLicenseNumber,
        businessProprietorName,
        uploadFiles.shopImageUrl,
        uploadFiles.labourLicenseUrl,
        bankName,
        accountNumber,
        uploadFiles.cancelledCheckUrl,
        IFSC,
        accountName,
        formattedDate(doj),
        status,
        comments,
        ditributorMargin,
        formattedDate(update),
        ID],(err,result)=>{
          
          if (err) {
            console.log('Error in updating distributor',err);
            res.status(500).json({message:'Database update failed'})
            reject(err)
          } else {
            res.status(201).json({message:'Distributor updated successfully',newDistributorId})
            resolve(result)
            console.log(result);
            
          }
        })
  })
  } catch (err) {
    console.log(err);
    res.status(500).json({message:'Internal server error',err})
    
  }
  
});
// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const approveDistributor = asyncHandler(async (req, res) => {
  const {distributor,status,create,update} = req.body 
  const password = process.env.DISTRIBUTOR_PSWD
  const distributorExistSql = 'select role_id,distributor_id,user_mobile,user_email,kyc_status from distributor where distributor_id=?'
  try {
    
    const distributorExist = await new Promise((resolve, reject) => {
      db.query(distributorExistSql,[distributor],(err,result)=>{
        if(err) reject(err)
          resolve(result)
      })
    })
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)
    let updateSql
    let updateParams
  
    if (distributorExist.length===0) {
      return res.status(404).json({message:"Distributor not found"})
    }
    
    const {role_id,distributor_id,user_mobile,user_email} = distributorExist[0]

    if (status==='Approve') {
      // update distributor status
      updateSql ='update distributor set kyc_status=? , user_password=? where distributor_id=?'
      updateParams=[status,hashedPassword,distributor]
      await new Promise((resolve, reject) => {
        db.query(updateSql,updateParams,(err,result)=>{
          if(err) reject(err)
            resolve(result)
        })
      })

      // create distributor login
      insertSql = 'INSERT INTO login (role_id, user_id,user_password,user_mobile,user_email,created_timestamp,updated_timestamp)VALUES(?,?,?,?,?,?,?)'
      insertParams=[role_id,distributor_id,hashedPassword,user_mobile,user_email,formattedDate(create),formattedDate(update)]

      await new Promise((resolve, reject) => {
        db.query(insertSql,insertParams,(err,result)=>{
          if(err) reject(err)
            resolve(result)
        })
      })
      res.status(201).json({ message: "Distributor approved successfully" });
    } else if (status==='Reject') {
      updateSql ='update distributor set kyc_status=? where distributor_id=?'
      updateParams=[status,distributor]
      
      await new Promise((resolve, reject) => {
        db.query(updateSql,updateParams,(err,result)=>{
          if(err) reject(err)
            resolve(result)
        })
      })
      res.status(200).json({message:'Distributor Rejected'})
    } else{
      return res.status(400).json({message:'Inavalid status provided'})
    }    
  } catch (err) {
    res.status(500).json({message:'Internal server error',err})
  }
});

// @desc Get user profile
// @route POST /api/users/auth
// @access Public

const getDistributorDetails = asyncHandler(async (req, res) => {
  const {ditributorId} = req.body
  
  const getDistributorDetailsSql ='select * from distributor where distributor_id=?'
  try {
    const distributor = await new Promise((resolve,reject)=>{
      db.query(getDistributorDetailsSql,[ditributorId],(err,result)=>{
        if(err) reject(err)
          resolve(result)
      })
    })
    const decryptedData = distributor.map((item)=>{
      console.log(item);
      
        const decryptedUser = {...item}
  
        for(const key in decryptedUser){
          if (isEncrypted(decryptedUser[key])) {
            try {
              decryptedUser[key]= decrypt(decryptedUser[key])
            } catch (err) {
              console.warn(`Decryption failed for key  ${key}`);
              
            }
          }
        }
        return decryptedUser
    })
    res.status(201).json(decryptedData)
    
  } catch (err) {
    console.log(err);
    res.status(500).json({message:'Failed to Fetch distributor'})
  }

  // if (distributor) {
  //   res.status(201).json(distributor)
  // }
});

const updateDistributorMargin = asyncHandler(async(req,res)=>{
  const {id,margin}=req.body

  try {
    if (margin===undefined) {
      res.status(400).json({error:'Margin is required'})
    }

    let updateDistributorMarginSql = 'update distributor set distributor_margin=?'
    let param = [margin]

    if (id) {
      updateDistributorMarginSql+=" where distributor_id=?"
    }
    

    await new Promise((resolve,reject)=>{
      db.query(updateDistributorMarginSql,[param,id],(err,result)=>{
        if(err) reject(err)
          resolve(result)
      })
    })

    res.status(201).json({message:'Margin Updated successfully'})
    
    
  } catch (err) {
    res.status(500).json({message:'Internal server error',err})
  }

})

router.get("/profile", protect, getDistributor);
router.post("/profile/id", protect, getDistributorDetails);
router.post("/register", protect, createDistributor);
router.put("/profile", protect, updateDistributor);
router.post("/approve", protect, approveDistributor);
router.put("/update", protect, updateDistributorMargin);


module.exports = router;
