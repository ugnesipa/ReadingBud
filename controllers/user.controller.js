// Import necessary dependencies
const jwt = require("jsonwebtoken"); // For generating and verifying JSON Web Tokens
const bcrypt = require("bcryptjs"); // For hashing passwords
const User = require("../models/user.model"); // User model
const Review = require("../models/review.model"); // Review model
const Book = require("../models/book.model"); // Book model
const Collection = require("../models/collection.model"); // Book model

// Function to retrieve all users
const readAll = async (req, res) => {
  try {
    // Retrieve all users and populate associated fields
    const users = await User.find()
      .populate({
        path: 'reviews',
        populate: { path: 'book', select: '_id title author' }, // Populate book details for each review
        select: '_id rating title', // Select specific fields to avoid deep nesting
      })
      .populate({
        path: 'following', // Populate following list
        select: '_id full_name' // Select specific fields
      })
      .populate({
        path: 'followers', // Populate followers list
        select: '_id full_name' // Select specific fields
      })
      .populate({
        path: 'collections', // Populate associated collections
        select: '_id name', // Select specific collection fields
      });

    // Check if any users exist and return response
    if (users.length > 0) {
      return res.status(200).json(users);
    } else {
      return res.status(404).json({ message: "No users found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error retrieving users", error: err.message });
  }
};

// Function to retrieve a single user by ID
const readOne = async (req, res) => {
  let id = req.params.id; // Retrieve user ID from route parameters

  try {
    // Find the user and populate associated fields
    const user = await User.findById(id)
      .populate({
        path: 'reviews',
        populate: { path: 'book', select: '_id title author' }, // Populate book details for each review
        select: '_id rating title' // Select specific fields
      })
      .populate({
        path: 'following', // Populate following list
        select: '_id full_name' // Select specific fields
      })
      .populate({
        path: 'followers', // Populate followers list
        select: '_id full_name' // Select specific fields
      })
      .populate({
        path: 'collections', // Populate associated collections
        select: '_id name', // Select specific collection fields
      });
      

    // Check if user exists and return response
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User retrieved successfully.",
      data: user,
    });
  } catch (err) {
    console.error("Error retrieving user:", err);
    return res.status(500).json({ message: "An error occurred.", error: err.message });
  }
};

// Function to register a new user
const register = (req, res) => {
  console.log(req.body); // Log request body for debugging

  let newUser = new User(req.body); // Create a new user object
  newUser.password = bcrypt.hashSync(req.body.password, 10); // Hash the password before saving

  newUser
    .save() // Save the user to the database
    .then((data) => {
      data.password = undefined; // Remove password from response
      return res.status(201).json(data); // Return success response
    })
    .catch((err) => {
      if (err.code === 11000) { // Handle duplicate key error (e.g., email already exists)
        return res.status(400).json({ message: "Email already in use" });
      }
      return res.status(400).json({ message: err.message }); // Return other validation errors
    });
};

// Function to log in a user
const login = (req, res) => {
  User.findOne({ email: req.body.email }) // Find user by email
    .then((user) => {
      // Validate password and return error if invalid
      if (!user || !user.comparePassword(req.body.password)) {
        return res.status(401).json({
          message: "Authentication failed. Invalid email or password",
        });
      }
      // Generate a JWT token and return it
      return res.status(200).json({
        token: jwt.sign(
          {
            email: user.email,
            full_name: user.full_name,
            _id: user._id,
            role: user.role, // Include user role in token
          },
          process.env.JWT_SECRET, // Use secret key from environment variables
          { expiresIn: "168h" } // Set token expiration to 1 week
        ),
      });
    })
    .catch((err) => {
      return res.status(500).json(err); // Return server error
    });
};

// Middleware to check if a user is logged in
const loginRequired = (req, res, next) => {
  if (req.user) {
    next(); // Proceed to the next middleware or route handler
  } else {
    return res.status(401).json({ message: "Unauthorised user" });
  }
};

// Middleware to check if the user is an admin
const adminRequired = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access forbidden: You do not have the required permissions",
    });
  }
  next(); // Proceed to the next middleware or route handler
};

// Function to follow another user
const followUser = async (req, res) => {
  const userId = req.user._id; // Currently authenticated user
  const targetUserId = req.params.id; // User to be followed

  try {
    // Prevent users from following themselves
    if (userId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const user = await User.findById(userId); // Find authenticated user
    const targetUser = await User.findById(targetUserId); // Find target user

    // Check if both users exist
    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already following
    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ message: "You are already following this user." });
    }

    // Update following and followers lists
    user.following.push(targetUserId);
    targetUser.followers.push(userId);

    await user.save(); // Save updates to authenticated user
    await targetUser.save(); // Save updates to target user

    return res.status(200).json({ 
      message: `You are now following ${targetUser.full_name}.`,
      user,
    });
  } catch (err) {
    console.error("Error following user:", err);
    return res.status(500).json({ message: "An error occurred.", error: err.message });
  }
};

// Function to unfollow a user
const unfollowUser = async (req, res) => {
  const userId = req.user._id; // Currently authenticated user
  const targetUserId = req.params.id; // User to be unfollowed

  try {
    // Prevent users from unfollowing themselves
    if (userId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot unfollow yourself." });
    }

    const user = await User.findById(userId); // Find authenticated user
    const targetUser = await User.findById(targetUserId); // Find target user

    // Check if both users exist
    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already not following
    if (!user.following.includes(targetUserId)) {
      return res.status(400).json({ message: "You are not following this user." });
    }

    // Update following and followers lists
    user.following = user.following.filter((id) => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== userId);

    await user.save(); // Save updates to authenticated user
    await targetUser.save(); // Save updates to target user

    return res.status(200).json({ 
      message: `You have unfollowed ${targetUser.full_name}.`,
      user,
    });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    return res.status(500).json({ message: "An error occurred.", error: err.message });
  }
};

// Function to delete the authenticated user
const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id; // Get authenticated user's ID

    const user = await User.findById(userId).populate('collections'); // Find user with populated collections
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user's reviews and update books
    const userReviews = await Review.find({ user: userId });
    const reviewIds = userReviews.map((review) => review._id);

    await Promise.all(
      userReviews.map((review) =>
        Book.findByIdAndUpdate(
          review.book,
          { $pull: { reviews: review._id } }, // Remove reviews from associated books
          { new: true }
        )
      )
    );

    await Review.deleteMany({ user: userId }); // Delete user's reviews

    // Delete user's collections and update books
    const userCollections = user.collections;
    await Promise.all(
      userCollections.map(async (collection) => {
        await Book.updateMany(
          { collections: collection._id },
          { $pull: { collections: collection._id } } // Remove collection from books
        );
      })
    );

    // Delete collections themselves
    await Collection.deleteMany({ _id: { $in: userCollections.map(c => c._id) } });

    // Remove user from other users' following/followers lists
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );

    await User.findByIdAndDelete(userId); // Delete the user

    return res.status(200).json({
      message: "User account, collections, and associated data deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({
      message: "An error occurred while deleting the user.",
      error: err.message,
    });
  }
};

// Function to delete another user's account and data
const deleteData = async (req, res) => {
  try {
    const userIdToDelete = req.params.id; // User ID to delete

    const userToDelete = await User.findById(userIdToDelete).populate('collections'); // Find user with populated collections
    if (!userToDelete) {
      return res.status(404).json({ message: `User with ID ${userIdToDelete} not found` });
    }

    // Delete user's reviews and update books
    const userReviews = await Review.find({ user: userIdToDelete });
    const reviewIds = userReviews.map((review) => review._id);

    await Promise.all(
      userReviews.map((review) =>
        Book.findByIdAndUpdate(
          review.book,
          { $pull: { reviews: review._id } }, // Remove reviews from associated books
          { new: true }
        )
      )
    );

    await Review.deleteMany({ user: userIdToDelete }); // Delete user's reviews

    // Delete user's collections and update books
    const userCollections = userToDelete.collections;
    await Promise.all(
      userCollections.map(async (collection) => {
        await Book.updateMany(
          { collections: collection._id },
          { $pull: { collections: collection._id } } // Remove collection from books
        );
      })
    );

    // Delete collections themselves
    await Collection.deleteMany({ _id: { $in: userCollections.map(c => c._id) } });

    // Remove user from other users' following/followers lists
    await User.updateMany(
      { following: userIdToDelete },
      { $pull: { following: userIdToDelete } }
    );
    await User.updateMany(
      { followers: userIdToDelete },
      { $pull: { followers: userIdToDelete } }
    );

    await User.findByIdAndDelete(userIdToDelete); // Delete the user

    return res.status(200).json({
      message: `User with ID ${userIdToDelete}, their collections, and associated data deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({
      message: "An error occurred while deleting the user.",
      error: err.message,
    });
  }
};

// Export all controller functions
module.exports = {
  readAll,
  readOne,
  register,
  login,
  loginRequired,
  adminRequired,
  deleteUser,
  deleteData,
  followUser,
  unfollowUser,
};