const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv')
const {notFound,errorHandler} = require('./middleware/errorMiddleware')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const distributorRouter = require('./routes/distributor')
const retailerRouter = require('./routes/retailer')
const dashboardRouter = require('./routes/dashboard')
const paymentsRouter = require('./routes/payments')
const cashFreeAPI = require('./routes/cashfree')
const RazorPay = require('./routes/razorpay')
const BankCard = require('./routes/bankCard')
const Contact = require('./routes/contact')
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload')
const app = express();
dotenv.config()

const corsOptions={
  origin:process.env.CORS_ORIGIN ||'*',
  methods:"GET,POST,PUT,DELETE",
  allowedHeaders:"Content-Type,Authorization",
  credentials:true
}

app.use(cors(corsOptions))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(fileUpload())
app.use(logger('dev'));
app.use(bodyParser.json())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/distributor', distributorRouter);
app.use('/api/retailer', retailerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/cashfree',cashFreeAPI)
app.use('/api/razor',RazorPay)
app.use('/api/bank',BankCard)
app.use('/api/contact',Contact)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(notFound)
app.use(errorHandler)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(bodyParser.json())


module.exports = app;
