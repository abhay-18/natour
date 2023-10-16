/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongosanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Set security http headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Two many requests from this IP, please try again in an hour'
});

app.use('/api/v1/users/login', limiter);

// Body parser
app.use(express.json());

// Data sanitization against NoSQL query injection
app.use(mongosanitize());

// Prevent parameter solution ------------
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// serving static files.
app.use(express.static(`${__dirname}/public`));

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// error handling
app.all('*', function(req, res, next) {
  const err = new AppError('Cannot get the requested URL', 404);
  next(err);
});

// global Error Middleware (next(err) will call this middleware)------
app.use(globalErrorHandler);
module.exports = app;
