const fs = require('fs')

const path = require('path')

const uploadDir = path.join(__dirname,'../uploads')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir,{recursive:true})
}

module.exports={uploadDir}