export const addRatingMiddleware = (model) => {
  return async (req, res, next) => {
    const data = {
      productId: req.body.id,
      userId: req.docodedToken?._id,
      rating: req.body.rating,
      review: req.body.review,
    };

    try {
      const result = await model.create(data);

      req.Query = result;
      next();
    } catch (error) {
      console.error("Error in addRatingMiddleware:", error);
      if (error.code === 11000) {
        error.status = 409;
        const field = Object.keys(error.keyValue)[0];
        error.message = `Duplicate value for field: ${field}`;
      }
      next(error);
    }
  };
};
export const addMiddleware = (model) => {
  return async (req, res, next) => {
    try {
      const adding = await model.create(req.body);
      req.Query = adding;
      next();
    } catch (error) {
      if (error.code === 11000) {
        error.status = 409;
        const field = Object.keys(error.keyValue)[0];
        error.message = `Duplicate value for field: ${field}`;
      }
      next(error);
    }
  };
};

export const getMiddleware = (model) => {
  return (req, res, next) => {
    const getting = model.find(req.body);
    req.Query = getting;
    next();
  };
};

export const ubdateMiddleware = (model) => {
  return (req, res, next) => {
    const ubdating = model.updateMany(req.body);
    req.Query = ubdating;
    next();
  };
};

export const deleteMiddleware = (model) => {
  return (req, res, next) => {
    const deleting = model.deleteMany(req.body);
    req.Query = deleting;
    next();
  };
};
