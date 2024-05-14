const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const handlerFactory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

exports.getAllUsers = handlerFactory.getAll(User);
exports.getOneUser = handlerFactory.getOne(User);
exports.deleteMe = handlerFactory.deleteOne(User);
exports.updateMe = handlerFactory.updateOne(
  User,
  "name",
  "email",
  "age",
  "profession"
);

// Uploading User's Picture

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/userImages");
  },
  filename: (req, file, cb) => {
    cb(null, `user-${req.params.id}-${Date.now()}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images, 400"), false);
  }
};

// const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// exports.resizeUsersPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   (req.file.filename = `user-${req.params.id}-${Date.now()}.jpeg`),
//     await sharp(req.file.buffer)
//       .resize(500, 500)
//       .toFormat("jpeg")
//       .jpeg({ quality: 90 })
//       .toFile(`./public/userImages/${req.file.filename}`);

//   next();
// });

exports.uploadUserPhoto = upload.single("photo");

// Following And Unfollowing a User

exports.followAndUnfollow = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userId);
  const userToFollow = await User.findById(req.params.id);

  if (!userToFollow) next(new AppError("No such user found with that ID", 404));

  if (userToFollow.followers.includes(currentUser.id)) {
    const currentUsersIndex = userToFollow.followers.indexOf(currentUser.id);
    userToFollow.followers.splice(currentUsersIndex, 1);

    const userToFollowIndex = currentUser.following.indexOf(userToFollow.id);
    currentUser.following.splice(userToFollowIndex, 1);

    await userToFollow.save({ validateBeforeSave: false });
    await currentUser.save({ validateBeforeSave: false });

    res.status(201).json({
      status: "success",
      message: "Unfollowed Successfully",
      user: currentUser,
    });
  } else {
    userToFollow.followers.unshift(currentUser.id);
    currentUser.following.unshift(userToFollow.id);

    await userToFollow.save({ validateBeforeSave: false });
    await currentUser.save({ validateBeforeSave: false });

    res.status(201).json({
      status: "success",
      message: "Followed Successfully",
      user: currentUser,
    });
  }
});

exports.addInLikes = catchAsync(async (req, res, next) => {
  if (!req.body.user || !req.body.blogId)
    next(new AppError("Please provide the user object", 400));

  const user = await User.findById(req.body.user._id);
  const blogId = req.body.blogId;

  if (user.likes.includes(blogId)) {
    const index = user.likes.indexOf(blogId);
    user.likes.splice(index, 1);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Unliked Successfully",
      user,
    });
  } else {
    user.likes.unshift(blogId);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Liked Successfully",
      user,
    });
  }
});

exports.getAllFollowersOfAUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) next(new AppError("No such user found with that ID", 404));

  const arrOfAllUsers = user.followers.map(async (id) => {
    const followerUser = await User.findById(id);
    return followerUser;
  });

  const allFollowers = await Promise.all(arrOfAllUsers);

  res.status(200).json({
    status: "success",
    data: {
      allFollowers,
    },
  });
});

exports.getAllFollowingsOfAUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) next(new AppError("No such user found with that ID", 404));

  const arrOfAllUsers = user.following.map(async (id) => {
    const followingUser = await User.findById(id);
    return followingUser;
  });

  const allFollowings = await Promise.all(arrOfAllUsers);

  res.status(200).json({
    status: "success",
    data: {
      allFollowings,
    },
  });
});
