const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const protect = require("../config/authMiddleware");

function generateRandomAlphanumeric(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

const headers = {
  Accept: "application/json",
  "X-Ipay-Auth-Code": "1",
  "X-Ipay-Client-Id": process.env.CLIENT_ID,
  "X-Ipay-Client-Secret": process.env.CLIENT_SECRET,
  "X-Ipay-Endpoint-Ip": process.env.CLIENT_IP,
  "Content-Type": " application/json",
  "X-Ipay-Outlet-Id": process.env.CLIENT_OUTLET_ID,
};
const gst = asyncHandler(async (req,res,next) => {
  console.log(req.body);

  const {gst,latitude,longitude} = req.body
    try {
        let data =JSON.stringify({
            "gstNumber": gst,
            "externalRef": generateRandomAlphanumeric(10),
            "latitude": latitude,
            "longitude": longitude
        })

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.instantpay.in/identity/verifyGstin',
            headers: headers,
            data : data
        };
        const response = await axios.request(config)
        res.status(200).json(response.data)
    } catch (err) {
        console.error(err);
        res.status(500).json({message:'Internal server Error',error:err})
    }
})


router.post("/",protect,gst)

module.exports=router;