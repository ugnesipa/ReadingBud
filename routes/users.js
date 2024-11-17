// Importing the express module to create the router
const express = require("express");

// Create a new router instance using express.Router()
const router = express.Router();

// Importing controller functions for handling user-related actions
const {
  readAll,       // Function to read all users (only accessible by admin)
  readOne,       // Function to read a single user by their ID (only accessible by admin)
  register,      // Function to register a new user
  login,         // Function to authenticate and log in a user
  loginRequired, // Middleware to ensure the user is logged in before accessing certain routes
  adminRequired, // Middleware to ensure the user has admin privileges
  deleteUser,    // Function for the user to delete their own account
  deleteData,    // Function for an admin to delete a user's account
  followUser,    // Function to allow a user to follow another user
  unfollowUser,  // Function to allow a user to unfollow another user
} = require("../controllers/user.controller");

// Route to register a new user
// POST /users/register - Creates a new user account
router.post("/register", register);

// Route to log in an existing user
// POST /users/login - Authenticates and logs in a user
router.post("/login", login);

// Route to read all users
// GET /users - Fetches all users (this is restricted to admin users only)
// The readAll controller handles this request
router.get("/", readAll); // Admin only

// Route to read a single user by ID
// GET /users/:id - Fetches a specific user by their ID (this is restricted to admin users only)
// The readOne controller handles this request
router.get("/:id", readOne); // Admin only

// Route to delete the currently authenticated user's account
// DELETE /users/me - The logged-in user can delete their own account
// The loginRequired middleware ensures the user is logged in before deleting their account
router.delete("/me", loginRequired, deleteUser); // User deletes their own account

// Route to delete a user's account by ID (admin only)
// DELETE /users/:id - The admin can delete another user's account
// The loginRequired middleware ensures the user is logged in, and the adminRequired middleware ensures the user is an admin
router.delete("/:id", loginRequired, adminRequired, deleteData); // Admin deletes a user account

// Route to follow another user
// POST /users/:id/follow - The logged-in user can follow another user
// The loginRequired middleware ensures the user is logged in before following another user
router.post("/:id/follow", loginRequired, followUser); // Follow a user

// Route to unfollow a user
// POST /users/:id/unfollow - The logged-in user can unfollow another user
// The loginRequired middleware ensures the user is logged in before unfollowing another user
router.post("/:id/unfollow", loginRequired, unfollowUser); // Unfollow a user


// Exporting the router to be used in other parts of the application
module.exports = router;