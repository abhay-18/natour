// const fs = require('fs');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.cheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,duration,price,difficulty,ratingsAverage';
  next();
};

/*Let's break down the code step by step:

const catchAsync = fn => { ... }: This defines a function called catchAsync. 
It takes one argument, fn, which is expected to be another function that returns a Promise. 
catchAsync is designed to wrap around asynchronous route handlers and handle any errors that might occur during their execution.

return (req, res, next) => { ... }: catchAsync returns a new function that takes three parameters: 
req (request), res (response), and next (a callback function to pass control to the next middleware in the request-response cycle).

fn(req, res, next).catch(err => next(err)): Inside the returned function, it calls the fn function 
(which is expected to be an asynchronous function returning a Promise) 
with the same req, res, and next parameters. If this Promise resolves successfully, everything continues as normal. 
However, if the Promise is rejected (i.e., an error occurs), it catches the error using .catch() and passes it to the next function. 
This effectively delegates error handling to the Express.js error-handling middleware. */

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
// 1. Get tour by Id
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError(`Tour with id - ${req.params.id} not found`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

// 2. Update tour by id
exports.updateTour = catchAsync(async (req, res, next) => {
  // Tour.findByIdAndUpdate returns the promise so we use async-await.
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // new = true returns the newly updated tour.
    runValidators: true // runValidators will validate the updated data
  });

  if (!updatedTour) {
    return next(new AppError(`Tour with id - ${req.params.id} not found`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: updatedTour
  });
});

// 3. Delete tour
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`Tour with id - ${req.params.id} not found`, 404));
  }

  res.status(200).json({
    status: 'Success',
    message: 'Tour successfully deleted.'
  });
});

// 4. Create Tour
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      data: newTour
    }
  });
});

// 5. Get all tours---
exports.getTours = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limit()
    .pagination();
  // Execute query--->
  const tours = await features.query;

  // Send Response
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours
    }
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 }
      }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        averageRating: { $avg: '$ratingsAverage' },
        averagePrice: { $avg: '$price' },
        minprice: { $min: '$price' },
        maxprice: { $max: '$price' },
        totalRatings: { $sum: '$ratingsQuantity' },
        numTours: { $sum: '$numTours' }
      }
    },
    {
      $sort: {
        averageRating: 1
      }
    },
    {
      $match: {
        _id: { $ne: 'EASY' }
      }
    }
  ]);

  res.status(400).json({
    status: 'success',
    stats: stats
  });
});

exports.bussiestTours = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
});
