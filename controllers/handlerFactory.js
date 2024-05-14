const APIFeatures = require("./../utils/APIFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const cloudinary = require("cloudinary").v2;

// Configuring Cloudinary
cloudinary.config({
  cloud_name: "dd9txketg",
  api_key: "877765274648393",
  api_secret: "HO3B6pXsF8kjVTIiOwDecbw-oHI",
});

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .fields()
      .limit();

    const docs = await features.query;

    res.status(200).json({
      status: "success",
      noOfDocs: docs.length,
      data: {
        docs,
      },
    });
  });
};

exports.getOne = (Model, popOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);

    if (!query) next(new AppError("No such doc found with that ID", 404));

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) next(new AppError("No such doc found with that ID", 404));

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });
};

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    await Model.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Deleted Successfully",
      data: null,
    });
  });
};

exports.updateOne = (Model, ...allowedKeys) => {
  return catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm)
      next(new AppError("This route is not for updating password", 400));

    const filteredObj = (obj, ...allowedFields) => {
      const newObj = {};
      Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
      });
      return newObj;
    };

    const filteredBody = filteredObj(req.body, ...allowedKeys);

    if (req.file) filteredBody.photo = req.file.filename;

    const upload = await cloudinary.uploader.upload(req.file.path);

    if (req.file) filteredBody.imageURL = upload.secure_url;

    const doc = await Model.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "Data Updated Successfully",
      data: {
        doc,
      },
    });
  });
};
