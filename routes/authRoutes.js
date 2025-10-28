const express = require("express");
const {
  createUsersFromSelectedEnquiries,
  login,
  createAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  createStaff,
  importUsersFromExcel,
  getUserById,
  getUsersList
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/create-from-enquiries",
  // protect,
  // adminOnly,
  createUsersFromSelectedEnquiries
);

router.post("/login", login);
router.post("/create-admin", createAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.post("/create-staff", createStaff);
router.post("/import-users-excel",importUsersFromExcel );
router.get('/users', getUsersList);
router.get('/:id', getUserById);



module.exports = router;
