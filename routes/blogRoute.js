const express = require("express");

const blogController = require("./../controllers/blogController");

const router = express.Router();

router.use("/one/user/:userId", blogController.getBlogsForOneUser);

router.route("/comment/:id/:userId").patch(blogController.addAndUpdateComment);

router.route("/create-blog/:userId").post(blogController.createBlog);

router.patch(
  "/upload-photo/:id",
  blogController.uploadBlogPhoto,
  blogController.updateBlog
);

router
  .route("/:blogID/:commentID/:userId")
  .delete(blogController.deleteComment);

router.route("/").get(blogController.getAllBlogs);

router
  .route("/:id")
  .get(blogController.getOneBlog)
  .delete(blogController.deleteBlog)
  .patch(blogController.updateBlog);

module.exports = router;
