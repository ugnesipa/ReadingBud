const mongoose = require('mongoose'); // Import mongoose to interact with the MongoDB database
const User = require('../models/user.model'); // Import User model for interacting with the users collection
const Book = require('../models/book.model'); // Import Book model for interacting with the books collection
const Review = require('../models/review.model'); // Import Review model for interacting with the reviews collection
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing
require("dotenv").config(); // Load environment variables from .env file

// Test data for testing environment
// These users will be seeded into the database for testing purposes
const users = [
  {
    name: 'Test Admin', // Admin user for testing with a specific role
    email: 'admin@readingbud.com',
    password: 'password123', // Plain text password to be hashed before insertion
    role: 'admin', // Set role to admin
  },
  {
    name: 'Test User', // Regular test user
    email: 'user@readingbud.com',
    password: 'password123', // Plain text password to be hashed before insertion
  },
  {
    name: 'Test User 2', // Another regular test user
    email: 'user2@readingbud.com',
    password: 'password123', // Plain text password to be hashed before insertion
  }
];

// Array of test books to be seeded into the database
const books = [
  {
    title: 'Test Book 1',
    author: 'Author 1',
    publishing_date: 2020, // Year of publication
    image_path_S: 'http://example.com/book1_small.jpg', // Image URL for the small version of the book cover
    image_path_M: 'http://example.com/book1_medium.jpg', // Image URL for the medium version of the book cover
    image_path_L: 'http://example.com/book1_large.jpg', // Image URL for the large version of the book cover
  },
  {
    title: 'Test Book 2',
    author: 'Author 2',
    publishing_date: 2021,
    image_path_S: 'http://example.com/book2_small.jpg',
    image_path_M: 'http://example.com/book2_medium.jpg',
    image_path_L: 'http://example.com/book2_large.jpg',
  },
  {
    title: 'Test Book 3',
    author: 'Author 3',
    publishing_date: 2022,
    image_path_S: 'http://example.com/book3_small.jpg',
    image_path_M: 'http://example.com/book3_medium.jpg',
    image_path_L: 'http://example.com/book3_large.jpg',
  }
];

// Function to seed the test database
let seedTestDB = async () => {
  try {
    // Connect to the testing database using the connection string from environment variables
    console.log('Connecting to testing database...');
    await mongoose.connect(process.env.TEST_DB_ATLAS_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to testing database.');

    // Delete existing data before seeding new test data
    console.log('Deleting existing data...');
    await User.deleteMany(); // Remove all existing users from the collection
    await Book.deleteMany(); // Remove all existing books from the collection
    await Review.deleteMany(); // Remove all existing reviews from the collection
    console.log('Existing data deleted.');

    // Hash passwords for users before inserting them into the database
    console.log('Hashing passwords...');
    for (let i = 0; i < users.length; i++) {
      const salt = bcrypt.genSaltSync(10); // Generate a salt with 10 rounds for secure hashing
      users[i].password = bcrypt.hashSync(users[i].password, salt); // Hash the plain-text password with the salt
    }

    // Insert the test data into the respective collections
    console.log('Seeding test data...');
    await User.insertMany(users); // Insert the hashed users into the User collection
    await Book.insertMany(books); // Insert the test books into the Book collection
    console.log('Test data seeded successfully.');

    // Close the database connection after seeding is complete
    mongoose.connection.close();
    console.log('Disconnected from testing database.');

  } catch (error) {
    // If an error occurs during seeding, log the error message and close the connection
    console.error('Error during seeding:', error.message);
    mongoose.connection.close();
  }
};

// Run the seeding function to populate the test database
seedTestDB().then(() => {
  console.log('Test data seed operation completed successfully!');
});

// node seeding/testing_readingbud.seeder.js
// this will seed the test database with the test data provided in the script.