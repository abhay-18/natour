// const fs = require('fs');
const Tour = require('../models/tourModel');

// exports.checkBody = (req, res, next) => {
//   if ('name' in req.body && 'price' in req.body) {
//     next();
//   } else {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Bad request'
//     });
//   }
// };
// exports.checkID = (req, res, next, val) => {
//   if (val > tours.length) {
//     return res.status(404).json({
//       status: 'failed',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// 1. Get tour by Id
exports.getTour = async (req, res) => {
  try {
    const tours = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'error'
    });
  }
};

// 2. Update tour by id
exports.updateTour = async (req, res) => {
  // Tour.findByIdAndUpdate returns the promise so we use async-await.
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // new = true returns the newly updated tour.
      runValidators: true // runValidators will validate the updated data
    });

    res.status(200).json({
      status: 'success',
      data: updatedTour
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err
    });
  }
};

// 3. Delete tour
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    req.status(204).json({
      status: 'Success',
      message: 'Tour successfully deleted.'
    });
  } catch (err) {
    res.status(404).json({
      status: 'failure',
      message: err
    });
  }
};

// 4. Create Tour
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        data: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'Invalid data sent. One or more than one field is missing.'
    });
  }
};

// 5. Get all tours---
exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.status(200).json({
      status: 'success',
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'error'
    });
  }
};
