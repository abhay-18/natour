/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name'],
    trim: true,
    maxlength: [100, 'A name cannot be greater than 100 characters.']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Please enter a email'],
    validate: [validator.isEmail, 'Enter a Valid Email Address']
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [8, 'Password length must be less than 8'],
    select: false // This will not show password in any ouput or query.
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      // This only works on create and SAVE !!
      // If you want to update user details then use save.
      validator: function(el) {
        // Here el represents Confirmed Password.
        // this represents current document.
        return el === this.password;
      }
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  active: {
    type: Boolean,
    select: false,
    default: true
  }
});

userSchema.pre('save', async function(next) {
  // if Password is not changed then this middleware will simply call next
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);

  //Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  // Sometimes the saving to database takes time andd jwt is issued. so we substract 1sec.
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Middleware for not showing deleted users
userSchema.pre(/^find/, function(next) {
  // this points to current query
  this.find({ active: { $ne: false } });

  next();
});
// It is a instance method which is available on all documents of the collection.
userSchema.methods.checkPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// It is a instance method to check if password is changed after issuance if timestamp or not.
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

// Instance method for generating token for reset password.
userSchema.methods.generateToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex'); // unhased

  // storing Hashed form in database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // return the unhashed token.
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
