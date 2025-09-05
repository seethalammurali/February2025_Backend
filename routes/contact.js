const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler')
const protect = require('../config/authMiddleware')
const db = require('../config/db')
const {Contact} = require('../models');
const { where } = require('sequelize');

const createContact = asyncHandler(async (req,res) => {
    const {firstName,lastName,email,mobile,message} = req.body

    try {
    const contact =await Contact.findOne({where:{contact_email:email}})
    if (contact) {
        return res.status(400).json({message:"Email id already existing.please use another email"})
    }

    await Contact.create({
        contact_first_name:firstName,contact_last_name:lastName,contact_email:email,contact_mobile_number:mobile,contact_message:message
    })
            res.status(201).json({message:'Contact submitted  Successfully'})
    } catch (err) {
        res.status(500).json({error:err.message|| 'server error'})
    }


})
router.post("/",protect,createContact)
module.exports=router