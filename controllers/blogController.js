const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const Blog = require("./../models/blogModel");
const User = require("./../models/userModel");
const multer = require("multer");
const sharp = require("sharp");
const handlerFactory = require("./handlerFactory");

exports.getAllBlogs = handlerFactory.getAll(Blog);
exports.getOneBlog = handlerFactory.getOne(Blog, "comments.user");
exports.deleteBlog = handlerFactory.deleteOne(Blog);
exports.updateBlog = handlerFactory.updateOne(Blog, "heading", "description");

exports.createBlog = catchAsync(async (req, res, next) => {
  req.body.user = req.params.userId;

  const user = await User.findById(req.params.userId);
  const newBlog = await Blog.create(req.body);

  user.blogs.unshift(newBlog.id);
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    message: "Blog created successfully",
    data: {
      newBlog,
    },
  });
});

exports.getBlogsForOneUser = catchAsync(async (req, res, next) => {
  const user = req.params.userId;
  const blogs = await Blog.find({ user });

  res.status(200).json({
    status: "success",
    noOfBlogs: blogs.length,
    data: {
      blogs,
    },
  });
});

// exports.getLikes = catchAsync(async (req, res, next) => {
//   const blog = await Blog.findById(req.params.id);
//   const userId = req.params.userId;

//   if (!blog) next(new AppError("No Such doc found with that ID", 404));

//   blog.likes.unshift(userId);
//   await blog.save({ validateBeforeSave: false });

//   res.status(200).json({
//     status: "success",
//     message: "Liked",
//   });
// });

// exports.getUnlikes = catchAsync(async (req, res, next) => {
//   const blog = await Blog.findById(req.params.id);
//   const userId = req.params.userId;

//   if (!blog) next(new AppError("No Such doc found with that ID", 404));

//   const index = blog.likes.indexOf(userId);
//   blog.likes.splice(index, 1);
//   await blog.save({ validateBeforeSave: false });

//   res.status(200).json({
//     status: "success",
//     message: "Unliked",
//   });
// });

exports.addAndUpdateComment = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  const user = await User.findById(req.params.userId);

  const comment = req.body.comment;

  if (!comment) next(new AppError("Your can't pass empty comments", 400));

  if (!blog) next(new AppError("No Such blog found with that ID", 404));

  blog.comments.unshift({
    user: req.params.userId,
    comment,
  });
  await blog.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    message: "Comment Added Successfully",
    comments: { user, comment: blog.comments[0] },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.blogID);
  const commentID = req.params.commentID;
  const user = await User.findById(req.params.userId);

  if (!blog) next(new AppError("No such blog found with that ID", 404));

  if (String(blog.user) === String(req.params.userId)) {
    blog.comments.forEach((comment, index) => {
      console.log(comment.id, commentID);
      if (String(comment.id) === String(commentID)) {
        return blog.comments.splice(index, 1);
      }
    });

    await blog.save({ validateBeforeSave: false });

    const newBlogComments = [];
    blog.comments.forEach((comment) => {
      newBlogComments.unshift({
        user,
        comment: comment.comment,
        _id: comment.id,
      });
    });

    res.status(200).json({
      status: "success",
      message: "Selected Comment has been deleted",
      comments: newBlogComments,
    });
  } else {
    blog.comments.forEach((comment, index) => {
      if (String(comment.user._id) === String(req.params.userId)) {
        return blog.comments.splice(index, 1);
      }
    });

    await blog.save({ validateBeforeSave: false });

    const newBlogComments = [];
    blog.comments.forEach((comment) => {
      newBlogComments.unshift({
        user,
        comment: comment.comment,
        _id: comment.id,
      });
    });

    return res.status(200).json({
      status: "success",
      message: "Your comment has been deleted",
      comments: newBlogComments,
    });
  }
});

// Uploading User's Picture

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images, 400"), false);
  }
};

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/blogImages");
  },
  filename: (req, file, cb) => {
    cb(null, `blog-${req.params.id}_${Date.now()}`);
  },
});

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadBlogPhoto = upload.single("photo");
