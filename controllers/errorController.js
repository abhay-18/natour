const AppError = require('../utils/appError');

const handleCastError = error => {
  const msg = `Invalid ${error.path}:${error.value}`;
  return new AppError(msg, 400);
};

const handleDuplicateError = error => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const msg = `Duplicate tour name: ${value}`;
  return new AppError(msg, 400);
};

const handleValidationError = error => {
  const values = Object.values(error.errors).map(el => el.message);
  const msg = `Please enter the correct Data. ${values.join('. ')}`;
  return new AppError(msg, 400);
};

const handleJWTWebTokenError = () => {
  return new AppError('Invalid token. Please log in again.', 404);
};
const handleExpiredTokenError = () => {
  return new AppError('Token Expired. Please log in again.', 404);
};

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};
const sendErrProd = (err, res) => {
  // If the error is operational i.e. the error is from user side.
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // console.log('Error', err);

    res.status(err.statusCode).json({
      status: err.status,
      message: 'Something went wrong !!',
      error: err
    });
  }
};

// This is error middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else {
    let error = { ...err }; // Copy of err
    error.name = err.name;
    error.message = err.message;
    // Making mongoDB errors to be operational errors
    if (error.name === 'CastError') {
      error = handleCastError(error);
    }
    if (error.code === 11000) {
      error.errmsg = err.errmsg;
      error = handleDuplicateError(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTWebTokenError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleExpiredTokenError();
    }
    sendErrProd(error, res);
  }
  next();
};
