/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};

const createJWTToken = user => {
  const payload = user._id;
  const token = jwt.sign({ id: payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.EXPIRES_IN
  });
  return token;
};

const createSendToken = (user, statusCode, res, signup = false) => {
  const token = createJWTToken(user);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  if (signup === true) {
    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } else {
    res.status(statusCode).json({
      status: 'success',
      token
    });
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  // We create the newUser like this because we don't want any user to have admin rights.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  // Json web token sign process----------
  createSendToken(newUser, 200, res, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // (1) Check if email or passowrd is null or not----
  if (!email || !password) {
    return next(new AppError('Please enter email and password', 404));
  }
  // (2) Check if user exists and password is correct----
  const user = await User.findOne({ email }).select('+password'); // since we have disable the password field in output so we select it manually

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Please enter correct email or password !', 404));
  }

  // (3) if everything iss ok then proceed.
  createSendToken(user, 200, res);
});

// middleware for checking user rights --------------->
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log(token);
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to Continue')
    );
  }
  // 2) Verify the token
  // This promsify will convert this function into promise so that we can handle errors
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  // 3) Check if user still exists.
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token does not exist.', 401)
    );
  }
  // 4) Check if user changed password after JWT is issued.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }
  // Grant access to protected route
  req.user = currentUser;
  next();
});

// middleware for authorization of certain resource for eg. deleting a tour
exports.restrictTo = roles => {
  // roles is an array containing ['admin', 'lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorize to delete the tour.', 403)
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get email based on filled email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('The email is not registered with us. Please sign up.', 404)
    );
  }
  // 2) Generate the random reset token
  const resetToken = await user.generateToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your Password? Submit a Patch request with you new Password and passwordConfirm to: ${resetURL}.\n 
                   If you didn't forget your password ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was error while sending the mail! Try again later!')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  console.log(user);
  // 2) If token is not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token expired.', 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  // 3) Update password changed property of the user
  await user.save();

  // 4) Log the user in, send jwt.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // since the this route is protected we will have the user in request object.
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.checkPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Password is incorrect !!', 401));
  }
  // 3) If so, update password
  user.password = req.body.NewPassword;
  user.passwordConfirm = req.body.NewPasswordConfirm;
  await user.save();
  // We will not use findByIdandUpdate - 1) validators will not work. 2)Pre-save middleware will not work.

  // 4) Log user in, send jwt
  createSendToken(user, 200, res);
});
