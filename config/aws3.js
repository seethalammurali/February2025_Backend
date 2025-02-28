const AWS = require('@aws-sdk/client-s3');
const dotenv = require('dotenv')

dotenv.config()

const s3 = new AWS.S3({
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region:process.env.AWS_REGION
})

const S3_BUCKET = process.env.AWS_BUCKET_NAME

module.exports={s3,S3_BUCKET}