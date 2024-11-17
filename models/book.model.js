// Destructure `Schema` and `model` from the `mongoose` library for defining and exporting schemas and models
const { Schema, model } = require('mongoose');

// Define the schema for a "Book" collection in MongoDB
const bookSchema = new Schema(
  {
    // Define the "title" field
    title: {
      type: String, // Data type: String
      required: [true, 'Title is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "author" field
    author: {
      type: String, // Data type: String
      required: [true, 'Author is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "publishing_date" field
    publishing_date: {
      type: Date, // Data type: Date
      required: [true, 'Publishing date is required'], // Validation: This field is mandatory with a custom error message
    },
    // Define the "image_path_S" field for small-sized image path
    image_path_S: {
      type: String, // Data type: String
    },
    // Define the "image_path_M" field for medium-sized image path
    image_path_M: {
      type: String, // Data type: String
    },
    // Define the "image_path_L" field for large-sized image path
    image_path_L: {
      type: String, // Data type: String
    },
    // Define the "reviews" field
    reviews: [
      {
        type: Schema.Types.ObjectId, // Each review is referenced by its ObjectId from the "Review" collection
        ref: 'Review', // Reference to the "Review" model
      },
    ],
    collections: [{ 
      type: Schema.Types.ObjectId, // Array of ObjectIds referencing other "User" models
      ref: "Collection", // Reference to the "User" model
    }],
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps to the document
  }
);

// Export the model for use in other parts of the application
module.exports = model('Book', bookSchema);