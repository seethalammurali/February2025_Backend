const { default: axios } = require('axios');
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')


const aadharVerification = asyncHandler(async(req,res)=>{
    console.log(req.body);
    const {aadhar} = req.body

    try {
        const response = await axios.post(`${process.env.API}`,{aadhaar_number:aadhar},{headers:{
            'x-client-id':process.env.SECURE_ID_APP_ID,
            'x-client-secret':process.env.SECURE_ID_SECRET_KEY,
            'Content-Type':'application/json'
        }})
        console.log(response);

        res.json({message:'Successfull',data:response.data})

    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Aadhar Verification failed",error:err})

    }
  })


const panVerification = asyncHandler(async(req,res)=>{
    console.log(req.body);
    const {pan} = req.body

    try {
        const response = await axios.post(`${process.env.PAPI}`,{pan:pan},{headers:{
            'x-client-id':process.env.SECURE_ID_APP_ID,
            'x-client-secret':process.env.SECURE_ID_SECRET_KEY,
            'Content-Type':'application/json'
        }})

        res.json({message:'Successfull',data:response.data})

    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Pan Verification failed",error:err})

    }
  })




router.post('/verify-aadhar',aadharVerification)
router.post('/verify-pan',panVerification)

module.exports = router;
