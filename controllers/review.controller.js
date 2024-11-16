// Import required models for Reviews, Books, and Users
const Review = require("../models/review.model"); // Model for handling review data
const Book = require("../models/book.model"); // Model for managing book data
const User = require("../models/user.model"); // Model for managing user data

// Retrieve all reviews
const readAll = (req, res) => {
  Review.find()
    .populate({
      path: 'book', // Populate book details associated with each review
      select: '_id title author', // Include only specific fields from the book
    })
    .then((data) => {
      console.log(data);

      // Check if any reviews were found
      if (data.length > 0) {
        return res.status(200).json(data); // Return the list of reviews
      } else {
        return res.status(404).json("No data found"); // Respond with no reviews found
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json(err); // Handle and return server errors
    });

  // Uncomment the below code for testing without a database
  // res.status(200).json({
  //   message: "Reviews retrieved",
  // });
};

// Retrieve one review by its ID
const readOne = (req, res) => {
  let id = req.params.id; // Extract review ID from request parameters

  Review.findById(id)
    .populate({
      path: 'book', // Populate book details associated with the review
      select: '_id title author', // Include only specific fields
    })
    .then((data) => {
      if (!data) {
        return res.status(404).json({
          message: `Review with id ${id} was not found`, // Review not found
        });
      }

      return res.status(200).json({
        message: `Review with id ${id} retrieved`, // Review found
        data,
      });
    })
    .catch((err) => {
      console.log(err);
      if (err.name === "CastError") {
        return res.status(400).json({
          message: `Invalid review ID: ${id}`, // Handle invalid IDs
        });
      }
      return res.status(500).json(err); // Handle other server errors
    });

  // Uncomment the below code for testing without a database
  // res.status(200).json({
  //   message: `Review with id ${id} retrieved`,
  // });
};

// Create a new review
const createData = async (req, res) => {
  console.log(req.body);
  const { book, ...reviewDetails } = req.body; // Extract book ID and other review details

  try {
    // Verify that the user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found. You cannot create a review.", // User does not exist
      });
    }

    // Validate that the associated book exists
    const existingBook = await Book.findById(book);
    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found. Review cannot be created for a non-existent book.", // Book does not exist
      });
    }

    // Check if the user has already reviewed this book
    const existingReview = await Review.findOne({
      book,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(403).json({
        message: "You have already reviewed this book. Edit or delete your existing review first.", // Duplicate review detected
      });
    }

    // Prepare the review data
    const reviewData = {
      ...reviewDetails, // Include the review details
      book, // Include the associated book ID
      user: req.user._id, // Include the user ID from the request
    };

    // Create the review
    const review = await Review.create(reviewData);
    console.log("New review created", review);

    // Add the review to the book and user
    const updateBook = Book.findByIdAndUpdate(
      review.book,
      { $push: { reviews: review._id } }, // Add review ID to the book's reviews array
      { new: true }
    );
    // find user by id and push review id to reviews array
    const updateUser = User.findByIdAndUpdate(
      review.user,
      { $push: { reviews: review._id } }, // Add review ID to the user's reviews array
      { new: true }
    );

    await Promise.all([updateBook, updateUser]); // Perform updates simultaneously
    // Return the response
    return res.status(201).json({
      message: "Review created and added to book and user",
      review,
    });
  } catch (err) {
    console.error("Error creating review:", err);
    if (err.name === "ValidationError") {
      return res.status(422).json({ error: err }); // Handle validation errors
    }
    return res.status(500).json({
      message: "Error creating review",
      error: err.message,
    });
  }
};

// Update an existing review
const updateData = async (req, res) => {
  const reviewId = req.params.id; // Extract review ID from request parameters
  const userId = req.user._id; // ID of the currently authenticated user
  const updates = req.body; // Fields to update

  // Define allowed fields for updates
  const allowedFields = ["title", "text", "rating"];
  const updateKeys = Object.keys(updates);
  const isValidUpdate = updateKeys.every((key) => allowedFields.includes(key));

  // Validate the update fields
  if (!isValidUpdate) {
    return res.status(400).json({
      message: `Invalid update fields. Allowed fields are: ${allowedFields.join(", ")}.`,
    });
  }

  try {
    // Find the review by ID
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        message: `Review with ID ${reviewId} not found.`,
      });
    }

    // Verify the user is an admin or owns the review
    if (req.user.role !== 'admin' && review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access forbidden: You can only update your own reviews or must be an admin.',
      });
    }

    // Update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updates,
      { new: true, runValidators: true } // Return updated document and validate
    );
    // Return the updated review
    return res.status(200).json({
      message: "Review updated successfully.",
      data: updatedReview,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    // Handle CastError for invalid review ID
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        message: `Invalid review ID: ${reviewId}.`,
      });
    }
    // Handle validation errors
    return res.status(500).json({
      message: "Error updating review.",
      error: err.message,
    });
  }
};

// Delete a review
const deleteData = async (req, res) => {
  const reviewId = req.params.id; // Extract review ID
  const userId = req.user._id; // ID of the authenticated user
  // Attempt to delete the review
  try {
    // Find the review by ID
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        message: `Review with ID ${reviewId} not found.`,
      });
    }

    // Verify the user is an admin or owns the review
    if (req.user.role !== 'admin' && review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access forbidden: You can only delete your own reviews or must be an admin.',
      });
    }

    // Remove the review ID from book and user
    const updateBook = Book.findByIdAndUpdate(
      review.book,
      { $pull: { reviews: reviewId } }, // Remove review from book
      { new: true }
    );
    // find user by id and pull review id from reviews array
    const updateUser = User.findByIdAndUpdate(
      review.user,
      { $pull: { reviews: reviewId } }, // Remove review from user
      { new: true }
    );
    
    const deleteReview = Review.findByIdAndDelete(reviewId); // Delete review from the database
    await Promise.all([updateBook, updateUser, deleteReview]); // Perform operations concurrently

    return res.status(200).json({
      message: `Review with ID ${reviewId} deleted successfully.`,
    });
  } // Handle errors 
  catch (err) {
    console.error("Error deleting review:", err);
    return res.status(500).json({
      message: "Error deleting review.",
      error: err.message,
    });
  }
};

// Export all CRUD functions for use in routes
module.exports = {
  readAll,
  readOne,
  createData,
  updateData,
  deleteData,
};