class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["sort", "page", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt | gte |lt |lte)\b/,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("createdAt");
    }

    return this;
  }

  fields() {
    if (this.queryString.fields) {
      const sortBy = this.queryString.fields.split(",").join("");
      this.query = this.query.select(sortBy);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  limit() {
    const page = this.queryString.page * 1;
    const limit = this.queryString.limit * 1;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
