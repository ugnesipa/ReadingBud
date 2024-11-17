const Collection = require("../models/collection.model"); // Model for handling review data
const Book = require("../models/book.model"); // Model for managing book data
const User = require("../models/user.model"); // Model for managing user data
const path = require('path'); // Path module for handling file paths

// Retrieve all collections
const readAll = (req, res) => {
    Collection.find()
      .populate({
        path: 'books', // Populate book details associated with each collection
        select: '_id title author', // Include only specific fields from the book
      })
      .populate({
        path: 'user',
        select: '_id full_name', // Include only specific fields from the user
      })
      .then((data) => {
        console.log(data);
  
        // Check if any collections were found
        if (data.length > 0) {
          return res.status(200).json(data); // Return the list of reviews
        } else {
          return res.status(404).json("No collections found"); // Respond with no reviews found
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ message: "Error retrieving collections", error: err.message }); // Handle and return server errors
      });
  };

const readOne = (req, res) => {
    let id = req.params.id; // Extract review ID from request parameters
  
    Collection.findById(id)
    .populate({
        path: 'books', // Populate book details associated with each review
        select: '_id title author', // Include only specific fields from the book
      })
      .populate({
        path: 'user',
        select: '_id full_name', // Include only specific fields from the user
      })
      .then((data) => {
        if (!data) {
          return res.status(404).json({
            message: `Collection with id ${id} was not found`, // Review not found
          });
        }
        return res.status(200).json({
            message: `Collection with id ${id} retrieved`, // Review found
            data,
          });
        })
        .catch((err) => {
            console.log(err);
            if (err.name === "CastError") {
              return res.status(400).json({
                message: `Invalid collection ID: ${id}`, // Handle invalid IDs
              });
            }
            return res.status(500).json(err); // Handle other server errors
          });
};


const createData = async (req, res) => {
    try {
      // Extract the userId from the decoded JWT payload (set by the authorization middleware)
      const userId = req.user._id;
      
      // Get the collection name and bookIds from the request body
      const { name, bookIds } = req.body;
  
      // Validate the user exists
      const user = await User.findById(userId).populate("collections");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the user already has 5 collections
      if (user.collections.length >= 5) {
        return res.status(400).json({ message: "You can only create up to 5 collections." });
      }
  
      // Validate that the provided book IDs exist
      const books = await Book.find({ _id: { $in: bookIds || [] } });
      const validBookIds = books.map((book) => book._id);
  
      // Create the collection with the userId
      const newCollection = await Collection.create({
        user: userId, // Automatically set the user ID
        name,
        books: validBookIds,
      });
  
      // Update the user's collections array to reference the new collection
      user.collections.push(newCollection._id); // Store only the ObjectId
      await user.save();
  
      // Update each book's collections array to reference the new collection
      for (const book of books) {
        book.collections.push(newCollection._id); // Store only the ObjectId
        await book.save();
      }
  
      // Respond with the success message and the new collection data
      return res.status(201).json({
        message: "Collection created successfully",
        data: newCollection,
      });
    } catch (error) {
      console.error("Error creating collection:", error);
      return res.status(500).json({ message: "Error creating collection", error: error.message });
    }
  };
  
  const updateData = async (req, res) => {
    try {
      const collectionId = req.params.id; // Get the collection ID from the request
      const updates = req.body; // Get the update data from the request body
  
      // Find the collection by its ID
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        return res.status(404).json({ message: `Collection with id ${collectionId} not found` });
      }
  
      // Check if the user is authorized to update the collection
      // Ensure the user is either an admin or the owner of the collection
      const userId = req.user._id; // This comes from the validated JWT token
      if (req.user.role !== 'admin' && collection.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You do not have permission to update this collection" });
      }
  
      // Validate the books if being updated
      if (updates.books) {
        const books = await Book.find({ _id: { $in: updates.books } });
        updates.books = books.map((book) => book._id); // Use only valid book IDs
      }
  
      // Update the collection with the new data
      const updatedCollection = await Collection.findByIdAndUpdate(collectionId, updates, {
        new: true, // Return the updated document
        runValidators: true, // Ensure that updates are valid
      });
  
      return res.status(200).json({
        message: `Collection with id ${collectionId} updated successfully`,
        data: updatedCollection,
      });
    } catch (error) {
      console.error("Error updating collection:", error);
      return res.status(500).json({ message: "Error updating collection", error: error.message });
    }
  };
  
  // Delete a collection
  const deleteData = async (req, res) => {
    try {
      const collectionId = req.params.id;
  
      // Find the collection to delete
      const collection = await Collection.findById(collectionId).populate("books");
      if (!collection) {
        return res.status(404).json({ message: `Collection with id ${collectionId} not found` });
      }
  
      // Check if the user is authorized to delete the collection
      if (req.user.role !== 'admin' && req.user._id.toString() !== collection.user.toString()) {
        return res.status(403).json({ message: "You do not have permission to delete this collection" });
      }
  
      const collectionName = collection.name;
  
      // Remove the collection reference from the user's collections array
      const user = await User.findById(collection.user);
      if (user) {
        user.collections = user.collections.filter((col) => col.id.toString() !== collectionId);
        await user.save();
      }
  
      // Remove the collection reference from all associated books' collections arrays
      const bookIds = collection.books.map((book) => book._id);
      const booksToUpdate = await Book.find({ _id: { $in: bookIds } });
      for (const book of booksToUpdate) {
        book.collections = book.collections.filter((col) => col.id.toString() !== collectionId);
        await book.save();
      }
  
      // Delete the collection itself
      await Collection.findByIdAndDelete(collectionId);
  
      return res.status(200).json({
        message: `Collection with id ${collectionId} deleted successfully, and references removed from associated user and books.`,
      });
    } catch (error) {
      console.error("Error deleting collection:", error);
      return res.status(500).json({ message: "Error deleting collection", error: error.message });
    }
  };

// Add a book to an existing collection
const pushBookToCollection = async (req, res) => {
    try {
      const { collectionId } = req.params; // Extract collectionId from the route parameters
      const { bookId } = req.body; // Extract bookId from the request body
  
      // Find the collection by its ID
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        return res.status(404).json({ message: `Collection with id ${collectionId} not found` });
      }
  
      // Check if the user is the owner of the collection or an admin
      const userId = req.user._id; // The user ID comes from the validated JWT token
  
      // Validate whether the user is an admin or the owner of the collection
      if (req.user.role !== 'admin' && collection.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You are not authorized to add a book to this collection" });
      }
  
      // Check if the book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: `Book with id ${bookId} not found` });
      }
  
      // Check if the book is already in the collection
      if (collection.books.includes(bookId)) {
        return res.status(400).json({ message: `Book with id ${bookId} is already in the collection` });
      }
  
      // Add the book to the collection's books array
      collection.books.push(bookId);
      await collection.save();
  
      // Update the book's collections array with only the collection ID
      if (!book.collections.includes(collectionId)) {
        book.collections.push(collectionId); // Push only the collection's ID
        await book.save();
      }
  
      // Populate and return the updated collection
      const updatedCollection = await Collection.findById(collectionId)
        .populate({
          path: 'books',
          select: '_id title author', // Populate the necessary fields for books
        })
        .populate({
          path: 'user',
          select: '_id full_name', // Populate the user data
        });
  
      // Respond with success
      return res.status(200).json({
        message: `Book with id ${bookId} added to collection ${collectionId} successfully`,
        data: updatedCollection, // Return the updated collection with populated books
      });
  
    } catch (error) {
      console.error("Error adding book to collection:", error);
      return res.status(500).json({ message: "Error adding book to collection", error: error.message });
    }
  };

// Remove a book from an existing collection
const removeBookFromCollection = async (req, res) => {
    try {
      const { collectionId } = req.params; // Extract collectionId from the route parameters
      const { bookId } = req.body; // Extract bookId from the request body
  
      // Find the collection by its ID
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        return res.status(404).json({ message: `Collection with id ${collectionId} not found` });
      }
  
      // Check if the user is the owner or an admin
      const userId = req.user._id; // The user ID comes from the validated JWT token
  
      // Validate whether the user is an admin or the owner of the collection
      if (req.user.role !== 'admin' && collection.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You are not authorized to remove a book from this collection" });
      }
  
      // Check if the book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: `Book with id ${bookId} not found` });
      }
  
      // Check if the book is in the collection
      if (!collection.books.includes(bookId)) {
        return res.status(400).json({ message: `Book with id ${bookId} is not in the collection` });
      }
  
      // Remove the book from the collection's books array
      collection.books = collection.books.filter(book => book.toString() !== bookId.toString());
      await collection.save();
  
      // Remove the collection from the book's collections array
      book.collections = book.collections.filter(collection => collection.toString() !== collectionId.toString());
      await book.save();
  
      // Optionally, update the collection's book list in the response (if needed)
      const updatedCollection = await Collection.findById(collectionId)
        .populate({
          path: 'books',
          select: '_id title author', // Populate the necessary fields
        })
        .populate({
          path: 'user',
          select: '_id full_name', // Populate the user data
        });
  
      // Respond with success
      return res.status(200).json({
        message: `Book with id ${bookId} removed from collection ${collectionId} successfully`,
        data: updatedCollection, // Return the updated collection with populated books
      });
  
    } catch (error) {
      console.error("Error removing book from collection:", error);
      return res.status(500).json({ message: "Error removing book from collection", error: error.message });
    }
  };
  
  
  
  // Export the functions for use in routes
  module.exports = {
    readAll,
    readOne,
    createData,
    updateData,
    deleteData,
    pushBookToCollection,
    removeBookFromCollection
  };