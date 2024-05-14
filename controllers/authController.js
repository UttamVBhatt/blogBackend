const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const sendEmail = require("./../utils/sendEmail");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_STRING, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, status, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(status).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser, 201, res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    next(new AppError("Please provide your email or password", 401));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePasswords(password, user.password)))
    next(new AppError("Please provide valid email or password", 400));

  createSendToken(user, 200, res);
});

exports.logOut = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 1 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie("jwt", "Logged Out", cookieOptions);

  res.status(200).json({
    status: "success",
    message: "Logged Out Successfully",
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId).select("+password");

  if (
    !user ||
    !(await user.comparePasswords(req.body.oldPassword, user.password))
  )
    next(new AppError("Please provide valid old password", 401));

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token)
    return next(
      new AppError(
        "You are not logged in , please login to get the access",
        400
      )
    );

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_STRING
  );

  const user = await User.findById(decoded.id);

  if (!user)
    next(
      new AppError("User belonging to this token does no longer exist", 404)
    );

  if (user.changedPasswordAfter(decoded.iat))
    next(
      new AppError(
        "User has recently changed the password, please login again to get the access",
        400
      )
    );

  req.user = user;

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) next(new AppError("Please provide valid email address", 404));

  const resetToken = user.createResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password ? Submit your new password and password confirm on this url ${resetURL} \n\n If you didn't forget your password then please ignore this email`;

  try {
    sendEmail({
      email: user.email,
      subject: `Your password reset token will be valid for only 5 minutes`,
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Email Sent Successfully",
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email, Try again later!",
        500
      )
    );
  }
});

// exports.resetPassword = catchAsync(async (req, res, next) => {
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await User.findOne({
//     resetPasswordToken: hashedToken,
//     resetPasswordExpires: { $gt: Date.now() },
//   });

//   if (!user) return next(new AppError("Token is invalid or expired", 400));

//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   createSendToken(user, 200, res);
// });
