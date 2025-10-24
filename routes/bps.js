const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const protect = require("../config/authMiddleware");

const headers = {
  Accept: "application/json",
  "X-Ipay-Auth-Code": "1",
  "X-Ipay-Client-Id": process.env.CLIENT_ID,
  "X-Ipay-Client-Secret": process.env.CLIENT_SECRET,
  "X-Ipay-Endpoint-Ip": process.env.CLIENT_IP,
  "Content-Type": " application/json",
  "X-Ipay-Outlet-Id": process.env.CLIENT_OUTLET_ID,
};

const categories = asyncHandler(async (req, res, next) => {
  try {
    let data = "";
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://api.instantpay.in/marketplace/utilityPayments/category",
      headers: headers,
      data: data,
    };

    const response = await axios.request(config);
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});

const biller = asyncHandler(async (req, res, next) => {
  const { categoryKey } = req.body;
  try {
      let data = JSON.stringify({
        "pagination": {
            "pageNumber": 1,
            "recordsPerPage": 10
        },
        "filters": {
            "categoryKey": categoryKey,
            "updatedAfterDate": "C04"
        }
        })
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.instantpay.in/marketplace/utilityPayments/billers",
            headers: headers,
            data: data,
        };

        const response = await axios.request(config)
        res.status(200).json(response.data)
    } catch (err) {
        console.error(err);
        res.status(500).json({message:'Internal Server Error',error:err})
    }
});

const billerDetails = asyncHandler(async (req,res,next) => {
    const {billerId} = req.body
    try {
    let data = JSON.stringify({
        "billerId": billerId
    });

    let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.instantpay.in/marketplace/utilityPayments/billerDetails',
    headers: headers,
    data : data
    };
    const response = await axios.request(config)
    res.status(200).json(response.data)
   } catch (err) {
        console.error(err);
        res.status(500).json({message:"Internal Server Error",error:err})
    }
})

const billPayment = asyncHandler(async (req,res,next) => {
    const {billerId,externalRef,enquiryReferenceId,telecomCircle,initChannel,terminalId,mobile,postalCode,latitude,longitude,amount} = req.body
    try {
        let data = ({
            "billerId":billerId,
            "externalRef":externalRef,
            "enquiryReferenceId": enquiryReferenceId,
            "telecomCircle": telecomCircle,
            "inputParameters": {
                "param1": mobile
            },
            "initChannel": initChannel,
            "deviceInfo": {
                "terminalId": terminalId,
                "mobile": mobile,
                "postalCode": postalCode,
                "geoCode": `${latitude},${longitude}`
            },
            "paymentMode": "Cash",
            "paymentInfo": {
                "Remarks": "CashPayment"
            },
            "remarks": {
                "param1": mobile
            },
            "transactionAmount": amount,
            "customerPan": ""
        })

        console.log("step 1",data);


        let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.instantpay.in/marketplace/utilityPayments/payment',
        headers: headers,
        data : data
        };

        const response = await axios.request(config)
        res.status(200).json(response.data)

    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Internal Server Error",error:err})
    }
})
router.get("/", protect, categories);
router.post("/biller", protect, biller);
router.post("/billerDetails", protect, billerDetails);
router.post("/billPayment", protect, billPayment);

module.exports = router;
