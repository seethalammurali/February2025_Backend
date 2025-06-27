const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')


const createContact = asyncHandler(async (req,res) => {
    const {firstName,lastName,email,mobile,message} = req.body
    console.log(req.body);

    const createContactSql = 'insert into contact (contact_first_name,contact_last_name,contact_email,contact_mobile_number,contact_message) values (?,?,?,?,?)'
    try {
        await new Promise((resolve,reject)=>{
            db.query(createContactSql,[firstName,lastName,email,mobile,message],(err,result)=>{
            if (err) {
                console.log(err);                
                return reject (new Error('Database insertion failed'))
            }
            resolve(result)
            })
        })    
        res.status(201).json({message:'Contact submitted  Successfully'})
    } catch (err) {
        res.status(500).json({error:err.message|| 'server error'})
    }
    
    
})
router.post("/",protect,createContact)
module.exports=router