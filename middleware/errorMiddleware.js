
const notFound = (req,res,next)=>{
    const error = new Error(`Not Found -${req.originalUrl}`)
    res.status(404)
    next(error)
}

const errorHandler=(err,req,res,nex)=>{
let statusCode = res.statusCode = 200?500:res.statusCode
let message = err.message
console.log('error',err);

if (err.name==='CastError' && err.kind ==='ObjectId') {
    statusCode=404
    message='Resource Not Found'
}

res.status(statusCode).json({
    message:message,
    stack:process.env.NODE_ENV==='production'?null:err.stack
})
}

module.exports={notFound,errorHandler}