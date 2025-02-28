const fileUpload = require('express-fileupload')

module.exports = fileUpload({

    useTempFiles:true,
    tempFileDir:'/tmp/',
    limits:{fileSize:5*1024*1024}
})