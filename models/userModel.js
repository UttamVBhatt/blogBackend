const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    minlength: [3, "Your name should contain atleast 3 characters"],
    validator: [
      validator.isAlpha,
      "Please write only alphabets into your name",
    ],
  },
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    unique: true,
    lower: true,
    trim: true,
    validator: [validator.isEmail, ["Please provide valid email address"]],
  },
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: [8, "Your password should not contain less than 8 characters"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message:
        "Both passwords are not same, please field both password fields correctly",
    },
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  imageURL: {
    type: String,
  },
  blogs: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Blog",
    },
  ],
  age: {
    type: Number,
    required: [true, "Please provide your current age"],
    minlength: [10, "Your age should not be smaller than 10"],
    maxlength: [100, "Your age should not be greater than 100"],
  },
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Blog",
    },
  ],
  profession: {
    type: String,
    required: [true, "Please provide your profession"],
    minlength: [2, "Your profession should not contain less than 2 characters"],
  },
  following: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.comparePasswords = async (
  requestedPassword,
  existedPassword
) => await bcrypt.compare(requestedPassword, existedPassword);

userSchema.methods.changedPasswordAfter = (jwtTimeStamp) => {
  if (this.passwordChangedAt) {
    const timeStamp = parseInt(this.passwordChangedAt, 10);
    return jwtTimeStamp < timeStamp;
  }
  return false;
};

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetToken = resetToken;

  this.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000);

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
