const express = require('express');

const userController = require('./../controllers/userControllers');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.patch('/updateMe', authController.protect, userController.updateMe);
router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser);

router
  .route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

module.exports = router;
