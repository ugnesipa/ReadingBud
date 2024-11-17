// Importing necessary modules
const mongoose = require("mongoose"); // Importing mongoose to interact with MongoDB
const fs = require("fs"); // Importing fs (file system) module to read files
const path = require("path"); // Importing path module to handle file paths
const csv = require("csv-parser"); // Importing csv-parser to parse CSV files
const User = require("../models/user.model"); // Importing the User model
const Book = require("../models/book.model"); // Importing the Book model
const Review = require("../models/review.model"); // Importing the Review model
const Collection = require("../models/collection.model"); // Importing the Collection model
const bcrypt = require("bcryptjs"); // Importing bcryptjs for password hashing
require("dotenv").config(); // Loading environment variables from .env file

// Admin user to seed
const users = [
  {
    full_name: "Admin User", // The name of the admin user to seed
    email: "admin@readingbud.com", // The admin user's email
    password: "password", // The admin user's password (this will be hashed)
    role: "admin", // The admin user's role
  },
];

// Books array to be populated from CSV
const books = [];

// Path to the CSV file containing book data
const csvFilePath = path.join(__dirname, "../data/books.csv"); // The path to the CSV file

// Function to load books from the CSV file into the books array
const loadBooksFromCSV = async () => {
  return new Promise((resolve, reject) => {
    // Read the CSV file and parse its contents
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ";" })) // Using a semicolon as the separator for the CSV file
      .on("data", (row) => {
        // For each row in the CSV, push a book object to the books array
        books.push({
          title: row["Book-Title"], // Title of the book
          author: row["Book-Author"], // Author of the book
          publishing_date: Number(row["Year-Of-Publication"]), // Publishing year of the book
          image_path_S: row["Image-URL-S"], // URL for small book image
          image_path_M: row["Image-URL-M"], // URL for medium book image
          image_path_L: row["Image-URL-L"], // URL for large book image
        });
      })
      .on("end", () => {
        // Once the CSV has been processed, log the number of books loaded
        console.log(`Loaded ${books.length} books from the CSV.`);
        resolve(); // Resolve the promise when CSV reading is done
      })
      .on("error", (error) => {
        // If an error occurs while reading the CSV, log the error message
        console.error("Error reading the CSV file:", error.message);
        reject(error); // Reject the promise in case of an error
      });
  });
};

// Function to seed the database with users and books
const seedDB = async () => {
  try {
    console.log("Connecting to development database...");
    // Connect to the MongoDB database using the connection URL from the environment variables
    await mongoose.connect(process.env.DB_ATLAS_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to development database.");

    console.log("Deleting existing data...");
    // Delete all existing users, books, reviews, and collections from the database before seeding new data
    await User.deleteMany();
    await Book.deleteMany();
    await Review.deleteMany();
    await Collection.deleteMany();
    console.log("All existing data deleted.");

    console.log("Seeding users...");
    // Hash the password for the admin user before storing it
    const hashedPassword = bcrypt.hashSync(users[0].password, 10); // Hash the password using bcrypt
    users[0].password = hashedPassword; // Update the user object with the hashed password
    await User.insertMany(users); // Insert the admin user into the database
    console.log("Users seeded.");

    console.log("Loading books from CSV...");
    // Load books from the CSV file and populate the books array
    await loadBooksFromCSV();

    console.log("Seeding books...");
    // Insert the books from the books array into the database
    await Book.insertMany(books);
    console.log("Books seeded.");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    // If an error occurs during the seeding process, log the error message
    console.error("Error during the seeding process:", error.message);
  } finally {
    // Disconnect from the database once seeding is complete or if there is an error
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

// Run the seeding function
seedDB(); // Invoke the seedDB function to start the seeding process

// node seeding/readingbud.seeder.js
// This will connect to the database, delete any existing data, seed the users and books, 
// and then disconnect from the database.