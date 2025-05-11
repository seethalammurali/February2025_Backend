const crypto = require('crypto')

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY,'hex')
const ivLength = 16


const encrypt = (text)=>{
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm,secretKey,iv)

    let encrypted = cipher.update(text,'utf-8','hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
}

const decrypt = (data)=>{
    const [ivHex,encrypted]= data.split(':')
    const iv = Buffer.from(ivHex,'hex')
    const decipher = crypto.createDecipheriv(algorithm,secretKey,iv)
    let decrypted = decipher.update(encrypted,'hex','utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted

}

module.exports={encrypt,decrypt}