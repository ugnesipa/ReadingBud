// Importing necessary modules from Mongoose for schema creation and model definition
const { Schema, model } = require("mongoose");

// Importing bcryptjs to hash and compare passwords securely
const bcrypt = require('bcryptjs');

// User schema definition using Mongoose Schema
const userSchema = new Schema(
  {
    // Define the "full_name" field for storing user's full name
    full_name: {
      type: String, // Data type: String
      required: true, // Validation: Full name is required
      trim: true, // Validation: Remove any leading/trailing spaces
    },

    // Define the "email" field for storing user's email
    email: {
      type: String, // Data type: String
      unique: true, // Validation: Email must be unique
      lowercase: true, // Validation: Convert email to lowercase
      trim: true, // Validation: Remove leading/trailing spaces
      required: true, // Validation: Email is required
      // Regular expression pattern to validate email format
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address", // Error message if the email does not match the pattern
      ],
    },

    // Define the "password" field for storing user's password (hashed)
    password: {
      type: String, // Data type: String
      required: true, // Validation: Password is required
    },

    // Define the "role" field for setting the user's role
    role: {
      type: String, // Data type: String
      enum: ["user", "admin"], // Validation: Role must be either 'user' or 'admin'
      default: "user", // Default role is 'user'
    },

    // Define the "reviews" field to store references to reviews written by the user
    reviews: [{ // Array of ObjectIds referencing the 'Review' model
      type: Schema.Types.ObjectId,
      ref: 'Review', // Reference to the "Review" model
    }],

    // Define the "followers" field for tracking the users following this user
    followers: [{ 
      type: Schema.Types.ObjectId, // Array of ObjectIds referencing other "User" models
      ref: "User", // Reference to the "User" model
    }],

    // Define the "following" field for tracking users that this user is following
    following: [{ 
      type: Schema.Types.ObjectId, // Array of ObjectIds referencing other "User" models
      ref: "User", // Reference to the "User" model
    }],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields to the document
);

// Define a custom method on the User schema to compare the entered password with the stored hashed password
userSchema.methods.comparePassword = function (password) {
  // Compare the password entered by the user with the hashed password stored in the database
  return bcrypt.compareSync(password, this.password, function(result) {
    return result; // Return whether the comparison was successful or not
  });
}

// Export the "User" model created using the userSchema
module.exports = model("User", userSchema);