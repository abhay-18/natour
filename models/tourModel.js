const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [
        10,
        'A tour name must have a minimum length of 10 characters'
      ],
      maxlength: [50, 'A tour cannot have name more than 50 characters']
    },
    slug: String,
    rating: {
      type: Number,
      default: 4.5
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have Group Size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty level must be: Easy, Medium or Hard'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour cannot have ratingsAverage greater equal to 1'],
      max: [5, 'A tour must have ratingsAverage less than equal to 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Price Discount({VALUE}) must be less than Price.'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: true
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],
    secretTour: Boolean
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
tourSchema.virtual('durationWeeks').get(function() {
  return Number((this.duration / 7).toFixed(2)); // We have used a regular function instead of arrow functions because this keyword does not work with arrow fucntions.
});

// Document Middleware- pre : can be used only with save and create
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.post('save', function(doc, next) {
  console.log(doc);
  next();
});

// Query Middleware- will be called before executing query or after executing query.

//Before executing query------>
// Will be called when query will start with find.
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  console.log(docs);
  next();
});

// Aggregation Middleware--------->
tourSchema.pre('aggregate', function(next) {
  // this.pipeline will return a array.
  this.pipeline().unshift({
    $match: {
      secretTour: { $ne: true }
    }
  });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
