const express = require("express");
const {
  createUsersFromSelectedEnquiries,login,createAdmin
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/create-from-enquiries",
  // protect,
  // adminOnly,
  createUsersFromSelectedEnquiries
);

router.post("/login",login);
router.post("/create-admin",createAdmin);


module.exports = router;
