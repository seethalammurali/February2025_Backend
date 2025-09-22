const { default: axios } = require('axios');
const express = require('express');
const router = express.Router();
const crypto = require('crypto')
const asyncHandler = require('express-async-handler')
const qs = require('qs')


const encryptAadhar = (aadhar, encryptionKey) => {
  return new Promise((resolve, reject) => {
    try {
      let key = Buffer.alloc(32);
      Buffer.from(encryptionKey).copy(key);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(aadhar, "utf8", "binary");
      encrypted += cipher.final("binary");
      const encryptedBuffer = Buffer.concat([iv, Buffer.from(encrypted, "binary")]);
      const encryptedData = encryptedBuffer.toString("base64");
      resolve(encryptedData);
    } catch (err) {
      reject(err);
    }
  });
};

function ref() {
    return crypto.randomInt(100000, 1000000)
}



const aadharVerification = asyncHandler(async(req,res)=>{
    const {aadhar,latitude,longitude} = req.body
    let encryptedaadhar = await encryptAadhar(aadhar,process.env.CLIENT_ENCRYPTIONKEY)
    try {

        let data = JSON.stringify({
        "aadhaarNumber": encryptedaadhar,
        "latitude": latitude,
        "longitude": longitude,
        "consent": "Y"
        });
        let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.instantpay.in/identity/okyc/sendOtp',
        headers: {
            'X-Ipay-Auth-Code': '1',
            'X-Ipay-Client-Id': process.env.CLIENT_ID,
            'X-Ipay-Client-Secret': process.env.CLIENT_SECRET,
            'X-Ipay-Endpoint-Ip': process.env.CLIENT_IP,
            'Content-Type': 'application/json'
        },
        data : data
        };

        const response = await axios.request(config)
        res.status(200).json({data:response.data});

    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Aadhar Verification failed",error:err})

    }
  })


const panVerification = asyncHandler(async(req,res)=>{
    const {pan,latitude,longitude,name,dob} = req.body
    try {
            let data =qs.stringify({
            'pan': pan,
            'latitude': latitude,
            'longitude': longitude,
            'externalRef': ref(),
            'nameOnCard': name,
            'dateOfBirth': dob
            });

            let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.instantpay.in/identity/verifyPan',
            headers: {
                'X-Ipay-Auth-Code': '1',
                'X-Ipay-Client-Id': process.env.CLIENT_ID,
                'X-Ipay-Client-Secret': process.env.CLIENT_SECRET,
                'X-Ipay-Endpoint-Ip': process.env.CLIENT_IP,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data : data
            };

            axios.request(config)
            .then((response) => {
            res.status(200).json((response.data))
            })
            .catch((err) => {
            console.log(err);
            res.status(500).json({message:"Pan Verification failed",error:err})
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Pan Verification failed",error:err})
    }
  })

const verifyOTP = asyncHandler(async (req,res) => {
    const {otp,otpRef,latitude,longitude} = req.body
    let data = JSON.stringify({
    "otp": otp,
    "otpReferenceID": otpRef,
    "latitude": latitude,
    "longitude": longitude,
    "externalRef": JSON.stringify(ref()),
    "consent": "Y"
    });

    let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.instantpay.in/identity/okyc/verify',
    headers: {
        'X-Ipay-Auth-Code': ' 1',
        'X-Ipay-Client-Id': process.env.CLIENT_ID,
        'X-Ipay-Client-Secret': process.env.CLIENT_SECRET,
        'X-Ipay-Endpoint-Ip': process.env.CLIENT_IP,
        'Content-Type': 'application/json'
    },
    data : data
    };

    axios.request(config)
    .then((response) => {
    res.status(200).json(response.data)
    })
    .catch((err) => {
    console.log(err);
    res.status(500).json({message:"Aadhar Verification failed",error:err})

    });

})

router.post('/verify-aadhar',aadharVerification)
router.post('/verify-otp',verifyOTP)
router.post('/verify-pan',panVerification)

module.exports = router;
