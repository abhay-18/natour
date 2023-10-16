const User = require('../models/userModel');
const AppError = require('../utils/appError');

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      users
    }
  });
});

exports.getUser = (req, res) => {
  const data = { message: 'Route not defined yet!!' };
  res.status(500).json(data);
};

exports.createUser = (req, res) => {
  const data = { message: 'Route not defined yet!!' };
  res.status(500).json(data);
};

exports.deleteUser = (req, res) => {
  const data = { message: 'Route not defined yet!!' };
  res.status(500).json(data);
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Send error if user tries to update password.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating your password. Please use /updatePassword instead.'
      )
    );
  }

  // 2) Update the user
  let { name } = req.user;
  let { email } = req.user;
  if (req.body.name) ({ name } = req.body);
  if (req.body.email) ({ email } = req.body);

  // We will use findByIdAndUpdate update the user data because we want only run the validators for modified fields.
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name: name, email: email },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
