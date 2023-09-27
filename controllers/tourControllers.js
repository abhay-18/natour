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
    // Build Query----->
    // Basic filtering---->
    const queryObj = { ...req.query };
    const exculdedFields = ['page', 'sort', 'limit', 'fields'];
    exculdedFields.forEach(el => delete queryObj[el]);

    // Advance filtering--->
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|ft|lte|lt)\b/g, match => `$${match}`);
    // console.log(queryStr);

    let query = Tour.find(
      JSON.parse(queryStr)
    ); /* Find method returns the query, hence it is advisable to get the query first and then use the await keyword while executing the query.*/

    // Sorting--->
    if ('sort' in req.query) {
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log(sortBy);
      query = query.sort(sortBy);
    } else {
      query = query.sort('createdAt');
    }
    // console.log(req.query);
    // Limiting fields --->
    if ('fields' in req.query) {
      const fields = req.query.fields.split(',').join(' ');
      console.log(fields);
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Pagination--->
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const totalTours = await Tour.countDocuments();

    if (skip >= totalTours) {
      throw new Error('Page does not exist.');
    }
    // Execute query--->
    const tours = await query;

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
