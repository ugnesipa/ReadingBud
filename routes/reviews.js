// Importing the express module to create the router
const express = require("express");

// Create a new router instance using express.Router()
const router = express.Router();

// Importing controller functions for handling review-related actions
const {
  readAll,   // Function to read all reviews
  readOne,   // Function to read a single review by its ID
  createData, // Function to create a new review
  updateData, // Function to update an existing review
  deleteData, // Function to delete a review by its ID
} = require("../controllers/review.controller");

// Importing the loginRequired middleware function for authentication
const { loginRequired } = require('../controllers/user.controller');

// Route to get all reviews
// GET /reviews - Fetches a list of all reviews
router.get("/", readAll);

// Route to get a single review by ID
// GET /reviews/:id - Fetches a specific review by its ID
router.get("/:id", readOne);

// Route to create a new review
// POST /reviews - Creates a new review, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before creating a review
router.post("/", loginRequired, createData);

// Route to update an existing review by ID
// PUT /reviews/:id - Updates a specific review, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before updating a review
router.put("/:id", loginRequired, updateData);

// Route to delete a review by ID
// DELETE /reviews/:id - Deletes a specific review, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before deleting a review
router.delete("/:id", loginRequired, deleteData);

// Exporting the router to be used in other parts of the application
module.exports = router;