const express = require("express");

const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.route("/signup").post(authController.signUp);
router.route("/login").post(authController.logIn);

router.route("/forgotpassword").post(authController.forgotPassword);
// router.route("/resetpassword/:token").patch(authController.resetPassword);

router.route("/logout").get(authController.logOut);
router.route("/update/password/:userId").patch(authController.updatePassword);

router.route("/like").patch(userController.addInLikes);

router.route("/").get(userController.getAllUsers);

router.patch(
  "/upload-photo/:id",
  userController.uploadUserPhoto,
  // userController.resizeUsersPhoto,
  userController.updateMe
);

router.get("/:id/followers", userController.getAllFollowersOfAUser);
router.get("/:id/following", userController.getAllFollowingsOfAUser);

router
  .route("/:id")
  .get(userController.getOneUser)
  .delete(userController.deleteMe)
  .patch(userController.updateMe);

router.route("/follow/:id/:userId").get(userController.followAndUnfollow);

module.exports = router;
