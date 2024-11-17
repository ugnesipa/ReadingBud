// Import required modules
const Book = require("../models/book.model"); // Book model for interacting with the database
const Review = require("../models/review.model"); // Review model for managing associated reviews
const multer = require('multer'); // Multer for handling file uploads
const fs = require('fs'); // File system module for managing file operations
const path = require('path'); // Path module for handling file paths
const Collection = require("../models/collection.model"); // Book model

// Configure storage for multer
const storage = multer.diskStorage({
  // Define destination directory for uploaded files
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Save uploaded images in the 'uploads' folder
  },
  // Define filename format for uploaded files
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use a timestamp and original filename for uniqueness
  },
});

// Define a file filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept files with MIME type starting with "image/"
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png)"), false); // Reject other file types
  }
};

// Set up multer middleware for handling file uploads
const upload = multer({
  storage, // Use configured storage
  fileFilter, // Use defined file filter
}).fields([
  { name: "image_path_S", maxCount: 1 }, // Handle small image file
  { name: "image_path_M", maxCount: 1 }, // Handle medium image file
  { name: "image_path_L", maxCount: 1 }, // Handle large image file
]);

// Retrieve all books with their associated reviews
const readAll = (req, res) => {
  Book.find()
    .populate({
      path: 'reviews', // Populate associated reviews
      select: '_id rating title user', // Select specific review fields to avoid deep nesting
    })
    .populate({
      path: 'collections', // Populate associated collections
      select: '_id name', // Select specific collection fields
    })
    .then((data) => {
      console.log(data);
      if (data.length > 0) {
        return res.status(200).json(data); // Return all books if found
      } else {
        return res.status(404).json("No data found"); // Return 404 if no books are found
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json(err); // Handle and return server errors
    });
};

// Retrieve a single book by its ID
const readOne = (req, res) => {
  const id = req.params.id;

  Book.findById(id)
    .populate({
      path: 'reviews', // Populate associated reviews
      select: '_id rating title user', // Select specific review fields
    })
    .populate({
      path: 'collections', // Populate associated collections
      select: '_id name', // Select specific collection fields
    })
    .then((data) => {
      if (!data) {
        return res.status(404).json({
          message: `Book with id ${id} was not found`,
        });
      }
      return res.status(200).json({
        message: `Book with id ${id} retrieved`,
        data, // Return the book data
      });
    })
    .catch((err) => {
      console.log(err);
      if (err.name === "CastError") {
        return res.status(400).json({
          message: `Book with id ${id} was not found`,
        });
      }
      return res.status(500).json({ message: "Error retrieving books", error: err.message }); // Handle server errors
    });
};

// Create a new book
const createData = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        message: "Error uploading files",
        error: err.message,
      });
    }

    const { title, author, publishing_date, image_url_S, image_url_M, image_url_L } = req.body;

    // Validate required fields
    if (!title || !author || !publishing_date) {
      // Clean up uploaded files if validation fails
      ["image_path_S", "image_path_M", "image_path_L"].forEach((field) => {
        if (req.files[field]) {
          fs.unlink(req.files[field][0].path, (err) => {
            if (err) console.error(`Failed to delete ${field}:`, err.message);
          });
        }
      });
      return res.status(400).json({
        message: "Validation failed: All required fields must be provided.",
        errors: {
          title: !title ? "Title is required." : undefined,
          author: !author ? "Author is required." : undefined,
          publishing_date: !publishing_date ? "Publishing date is required." : undefined,
        },
      });
    }

    // Build book data with validated fields
    const bookData = {
      title,
      author,
      publishing_date,
      image_path_S: req.files["image_path_S"]
        ? req.files["image_path_S"][0].path // Use uploaded file
        : image_url_S, // Fallback to provided URL
      image_path_M: req.files["image_path_M"]
        ? req.files["image_path_M"][0].path
        : image_url_M,
      image_path_L: req.files["image_path_L"]
        ? req.files["image_path_L"][0].path
        : image_url_L,
    };

    try {
      const book = await Book.create(bookData); // Create a new book in the database
      return res.status(201).json({
        message: "Book created successfully",
        data: book,
      });
    } catch (error) {
      console.error("Error creating book:", error);
      // Clean up uploaded files in case of an error
      ["image_path_S", "image_path_M", "image_path_L"].forEach((field) => {
        if (req.files[field]) {
          fs.unlink(req.files[field][0].path, (err) => {
            if (err) console.error(`Failed to delete ${field}:`, err.message);
          });
        }
      });
      return res.status(500).json({
        message: "Error creating book",
        error: error.message,
      });
    }
  });
};

const updateData = (req, res) => {
  const id = req.params.id;

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        message: "Error uploading files",
        error: err.message,
      });
    }

    const updates = req.body;

    try {
      const book = await Book.findById(id).populate('collections'); // Include associated collections
      if (!book) {
        return res.status(404).json({
          message: `Book with id ${id} not found`,
        });
      }

      // Process image updates (upload or direct URL)
      const imageUpdates = {};
      ["image_path_S", "image_path_M", "image_path_L"].forEach((field) => {
        if (req.files[field]) {
          const newPath = req.files[field][0].path;
          if (book[field]) {
            fs.unlink(book[field], (err) => {
              if (err) console.error(`Failed to delete old ${field}:`, err.message);
            });
          }
          imageUpdates[field] = newPath;
        } else if (updates[field]) {
          if (book[field]) {
            fs.unlink(book[field], (err) => {
              if (err) console.error(`Failed to delete old ${field}:`, err.message);
            });
          }
          imageUpdates[field] = updates[field];
        }
      });

      // Merge image updates and other fields
      const updatedBookData = { ...updates, ...imageUpdates };
      const updatedBook = await Book.findByIdAndUpdate(id, updatedBookData, {
        new: true, // Return the updated book
        runValidators: true, // Validate the updates
      });

      // Update the book details in all associated collections
      const collections = book.collections;
      for (const collection of collections) {
        const bookIndex = collection.books.findIndex((b) => b.toString() === id);
        if (bookIndex !== -1) {
          collection.books[bookIndex] = updatedBook._id; // Update reference
        }
        await collection.save(); // Save updated collection
      }

      return res.status(200).json({
        message: `Book with id ${id} updated successfully`,
        data: updatedBook,
      });
    } catch (error) {
      console.error("Error updating book:", error);
      return res.status(500).json({
        message: "An error occurred while updating the book",
        error: error.message,
      });
    }
  });
};

const deleteData = (req, res) => {
  const id = req.params.id;

  Book.findById(id)
    .populate('collections') // Include associated collections
    .then(async (book) => {
      if (!book) {
        return res.status(404).json({
          message: `Book with id ${id} was not found`,
        });
      }

      // Remove the book from associated collections
      const collections = book.collections;
      for (const collection of collections) {
        collection.books = collection.books.filter((b) => b.toString() !== id);
        await collection.save(); // Save updated collection
      }

      // Delete associated images
      ["image_path_S", "image_path_M", "image_path_L"].forEach((field) => {
        if (book[field]) {
          fs.unlink(book[field], (err) => {
            if (err) console.error(`Failed to delete ${field}:`, err.message);
          });
        }
      });

      // Delete associated reviews
      Review.deleteMany({ book: id })
        .then(() => {
          // Delete the book after reviews are deleted
          Book.findByIdAndDelete(id)
            .then(() => {
              return res.status(200).json({
                message: `Book with id ${id} and all associated reviews deleted successfully`,
              });
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({
                message: "Error deleting book",
                error: err.message,
              });
            });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({
            message: "Error deleting reviews",
            error: err.message,
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        message: "Error finding book",
        error: err.message,
      });
    });
};

// Export the functions for use in routes
module.exports = {
  readAll,
  readOne,
  createData,
  updateData,
  deleteData,
};