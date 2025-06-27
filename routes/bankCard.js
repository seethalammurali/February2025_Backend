const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')


const bankDetails = asyncHandler(async (req,res) => {
    const {bankName,accountNumber,ifsc,mobile} = req.body
    console.log(req.body);

    const createBankSql = 'insert into bank_details (bank_name,bank_account_number,bank_ifsc_code,bank_mobile_number) values (?,?,?,?)'
    try {
        await new Promise((resolve,reject)=>{
            db.query(createBankSql,[bankName,accountNumber,ifsc,mobile],(err,result)=>{
            if (err) {
                console.log(err);                
                return reject (new Error('Database insertion failed'))
            }
            resolve(result)
            })
        })    
        res.status(201).json({message:'Bank details addes  Successfully'})
    } catch (err) {
        res.status(500).json({error:err.message|| 'server error'})
    }
    
})
const cardDetails = asyncHandler(async (req,res) => {
    const {cardName,cardNumber,bankName,mobile} = req.body
    console.log(req.body);

    const createCardSql = 'insert into card_details (card_name,card_number,card_bank_name,card_mobile_number) values (?,?,?,?)'
    try {
        await new Promise((resolve,reject)=>{
            db.query(createCardSql,[cardName,cardNumber,bankName,mobile],(err,result)=>{
            if (err) {
                console.log(err);                
                return reject (new Error('Database insertion failed'))
            }
            resolve(result)
            })
        })    
        res.status(201).json({message:'Card details added  Successfully'})
    } catch (err) {
        res.status(500).json({error:err.message|| 'server error'})
    }
})
router.post("/",protect,bankDetails)
router.post("/card",protect,cardDetails)
module.exports=router