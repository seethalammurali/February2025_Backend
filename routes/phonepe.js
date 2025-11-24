const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const protect = require("../config/authMiddleware");
const {randomUUID} = require('crypto')
const {StandardCheckoutClient,Env, MetaInfo, StandardCheckoutPayRequest } = require('pg-sdk-node')

const clientId =  "M23VBTNCQXKMK_2511151628" //process.env.P_Client_ID;
const clientSecret = "ZjkwNTUwOTMtOTc1Ni00OWUzLWE0MWItNzM3MzFlNTRiMjM2" //process.env.P_Client_Secret;
const clientVersion = 1 //process.env.P_Client_Version;
const env = Env.SANDBOX;

const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);


const createPayment = asyncHandler(async (req,res,next) => {
    const {paisa} = req.body
    const merchantOrderId = randomUUID();
    const amount = paisa*100;
    const redirectUrl = "https://www.merchant.com/redirect";
    const metaInfo = MetaInfo.builder()
                        .udf1("udf1")
                        .udf2("udf2")
                        .build();

    const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amount)
            .redirectUrl(redirectUrl)
            .metaInfo(metaInfo)
            .build();
    const checkoutPageUrl = await client.pay(request).then((response)=> {return response.redirectUrl;})
    res.status(201).json({url:checkoutPageUrl})

})

router.post("/", protect,createPayment);
module.exports = router;