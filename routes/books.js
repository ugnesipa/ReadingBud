// Importing the express module to create the router
const express = require("express");

// Create a new router instance using express.Router()
const router = express.Router();

// Importing controller functions for handling book-related actions
const {
  readAll,   // Function to read all books
  readOne,   // Function to read a single book by its ID
  createData, // Function to create a new book
  updateData, // Function to update an existing book
  deleteData, // Function to delete a book by its ID
} = require("../controllers/book.controller");

// Importing authentication and authorization middleware functions
const { loginRequired, adminRequired } = require('../controllers/user.controller');

// Route to get all books
// GET /books - Fetches a list of all books
router.get("/", readAll);

// Route to get a single book by ID
// GET /books/:id - Fetches a specific book by its ID
router.get("/:id", readOne);

// Route to create a new book
// POST /books - Creates a new book, but only accessible to logged-in users with an 'admin' role
// loginRequired ensures the user is authenticated
// adminRequired ensures the user has admin privileges
router.post("/", loginRequired, adminRequired, createData);

// Route to update an existing book by ID
// PUT /books/:id - Updates a specific book, but only accessible to logged-in users with an 'admin' role
// loginRequired ensures the user is authenticated
// adminRequired ensures the user has admin privileges
router.put("/:id", loginRequired, adminRequired, updateData);

// Route to delete a book by ID
// DELETE /books/:id - Deletes a specific book, but only accessible to logged-in users with an 'admin' role
// loginRequired ensures the user is authenticated
// adminRequired ensures the user has admin privileges
router.delete("/:id", loginRequired, adminRequired, deleteData);

// Exporting the router to be used in other parts of the application
module.exports = router;