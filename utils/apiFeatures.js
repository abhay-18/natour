class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // Basic filtering---->
    const queryObj = { ...this.queryStr }; // copy of queryStr stored  in queryObj
    const exculdedFields = ['page', 'sort', 'limit', 'fields'];
    exculdedFields.forEach(el => delete queryObj[el]);

    // Advance filtering--->
    // eslint-disable-next-line no-unused-vars
    let qStr = JSON.stringify(queryObj);
    qStr = qStr.replace(/\b(gte|ft|lte|lt)\b/g, match => `$${match}`);
    this.query.find(JSON.parse(qStr));
    return this;
  }

  sort() {
    if ('sort' in this.queryStr) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('createdAt');
    }
    return this;
  }

  limit() {
    if ('fields' in this.queryStr) {
      const fields = this.queryStr.fields.split(',').join(' ');
      console.log(fields);
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
