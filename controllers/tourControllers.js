// const fs = require('fs');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

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

exports.cheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,duration,price,difficulty,ratingsAverage';
  next();
};

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

    res.status(200).json({
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
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'error'
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err
    });
  }
};

exports.bussiestTours = async (req, res, next) => {
  const year = req.params.year * 1;
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'failure',
      error: err
    });
  }
};
