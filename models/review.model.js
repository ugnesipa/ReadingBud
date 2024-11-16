// Destructure `Schema` and `model` from the `mongoose` library for defining and exporting schemas and models
const { Schema, model } = require('mongoose');

// Define the schema for a "Review" collection in MongoDB
const reviewSchema = new Schema(
  {
    // Define the "title" field
    title: {
      type: String, // Data type: String
      required: [true, 'Title field is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "text" field (description of the review)
    text: {
      type: String, // Data type: String
      required: [true, 'Description field is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "rating" field
    rating: {
      type: String, // Data type: String (consider changing to Number for numeric ratings)
      required: [true, 'Rating field is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "book" field
    book: {
      type: Schema.Types.ObjectId, // Reference to a `Book` document by its ObjectId
      ref: 'Book', // Reference to the "Book" model
      required: [true, 'Book is required'], // Validation: A review must be associated with a book
    },
    // Define the "user" field
    user: {
      type: Schema.Types.ObjectId, // Reference to a `User` document by its ObjectId
      ref: 'User', // Reference to the "User" model
      required: [true, 'User is required'], // Validation: A review must be associated with a user
    },
    // Define the "image_path" field for optional review images
    image_path: {
      type: String, // Data type: String
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps to the document
  }
);

// Export the model for use in other parts of the application
module.exports = model('Review', reviewSchema);