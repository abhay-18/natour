const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
);

exports.checkBody = (req, res, next) => {
  if ('name' in req.body && 'price' in req.body) {
    next();
  } else {
    return res.status(400).json({
      status: 'failed',
      message: 'Bad request'
    });
  }
};
exports.checkID = (req, res, next, val) => {
  if (val > tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID'
    });
  }
  next();
};

// 1. Get tour by Id
exports.getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find(el => el.id === id);
  const data = { status: 'success', data: tour };

  res.status(200).json(data);
};

// 2. Update tour by id
exports.updateTour = (req, res) => {
  const { body } = req;
  const id = req.params.id * 1;
  let tour;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < tours.length; i++) {
    if (tours[i].id === id) {
      Object.assign(tours[i], body);
      tour = tours[i];
    }
  }

  const data = { status: 'success', data: tour };

  res.status(200).json(data);
};

// 3. Delete tour
exports.deleteTour = (req, res) => {
  const id = req.params.id * 1;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < tours.length; i++) {
    if (tours[i].id === id) {
      tours.splice(i, 1);
    }
  }

  const data = { status: 'success' };
  res.status(200).json(data);
};

// 4. Create Tour
exports.createTour = (req, res) => {
  const newid = tours[tours.length - 1].id + 1;
  const data = Object.assign({ id: newid }, req.body);
  tours.push(data);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status = 201;
      res.json({
        status: 'success',
        data: {
          tour: data
        }
      });
    }
  );
};

// 5. Get all tours---
exports.getTours = (req, res) => {
  const data = { status: 'success', data: { tours: tours } };
  res.status = 200;
  res.json(data);
};
