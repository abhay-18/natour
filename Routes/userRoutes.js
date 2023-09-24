const express = require('express');

const userController = require('./../controllers/userControllers');

const router = express.Router();

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router
  .route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

module.exports = router;
