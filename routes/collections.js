// Importing the express module to create the router
const express = require("express");

// Create a new router instance using express.Router()
const router = express.Router();

// Importing controller functions for handling collection-related actions
const {
  readAll,   // Function to read all collections
  readOne,   // Function to read a single collection by its ID
  createData, // Function to create a new collection
  updateData, // Function to update an existing collection
  deleteData, // Function to delete a collection by its ID
  pushBookToCollection,
  removeBookFromCollection, // Function to add a book to a collection
} = require("../controllers/collection.controller");

// Importing the loginRequired middleware function for authentication
const { loginRequired } = require('../controllers/user.controller');

// Route to get all collections
// GET /collections - Fetches a list of all collections
router.get("/", readAll);

// Route to get a single collection by ID
// GET /collections/:id - Fetches a specific collection by its ID
router.get("/:id", readOne);

// Route to create a new collection
// POST /collections - Creates a new collection, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before creating a collection
router.post("/", loginRequired, createData);

// Route to update an existing collection by ID
// PUT /collections/:id - Updates a specific collection, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before updating a collection
router.put("/:id", loginRequired, updateData);

// Route to delete a collection by ID
// DELETE /collections/:id - Deletes a specific collection, but only accessible to logged-in users
// loginRequired ensures the user is authenticated before deleting a collection
router.delete("/:id", loginRequired, deleteData);

// Route to add a book to a collection
// POST /collections/:collectionId/add_book - Adds a book to a collection
router.post('/:collectionId/add_book', loginRequired, pushBookToCollection);
// Route to remove a book from a collection
// Delete /collections/:collectionId/remove_book - Removes a book from a collection
router.delete('/:collectionId/remove_book', loginRequired, removeBookFromCollection);


// Exporting the router to be used in other parts of the application
module.exports = router;