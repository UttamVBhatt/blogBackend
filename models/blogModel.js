const mongoose = require("mongoose");
const validator = require("validator");

const blogSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: [true, "Please provide a heading for your blog"],
    minlength: [
      2,
      "A blog's heading should not contain less than 2 characters",
    ],
    // maxlength: [23, "Your heading should not contain more than 20 characters"],
  },
  description: {
    type: String,
    minlength: 20,
    required: [true, "Please provide some description for your blog"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  photo: {
    type: String,
    default: "blog-default.png",
  },
  imageURL: {
    type: String,
  },
  category: {
    type: String,
    required: [true, "Please provide the category in which your blog relies"],
    minlength: [3, "The Category's name should not be less than 3 characters"],
    // validate: [
    //   validator.isAlpha,
    //   "The Category's name should only contain characters",
    // ],
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      comment: {
        type: String,
        required: [true, "Your comment should not be empty"],
        minlength: 1,
      },
    },
  ],
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
