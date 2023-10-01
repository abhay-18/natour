const express = require('express');

const router = express.Router();
const tourController = require('./../controllers/tourControllers');

router.route('/tourStats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.bussiestTours);
router
  .route('/top-5-cheap')
  .get(tourController.cheapTours, tourController.getTours);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

router
  .route('/')
  .get(tourController.getTours)
  .post(tourController.createTour);

module.exports = router;
