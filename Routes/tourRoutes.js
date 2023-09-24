const express = require('express');

const router = express.Router();
const tourController = require('./../controllers/tourControllers');

router.param('id', tourController.checkID);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

router
  .route('/')
  .get(tourController.getTours)
  .post(tourController.checkBody, tourController.createTour);

module.exports = router;
