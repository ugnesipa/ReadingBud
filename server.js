// Import necessary modules
const express = require('express'); // Import Express framework to handle HTTP requests
const jwt = require('jsonwebtoken'); // Import jsonwebtoken to verify JWT tokens for authentication
const app = express(); // Create an instance of an Express application
const port = 3000; // Define the port number on which the app will listen

// Load environment variables from the .env file
require('dotenv').config();

// Connect to the database using a custom configuration file (assumed to be in the 'config/db.js' file)
require('./config/db.js')();

// Middleware setup: Allow the app to parse JSON request bodies
app.use(express.json());

// Set the view engine to 'html' (optional, not commonly needed for API-only apps)
app.set('view engine', 'html')

// Serve static files from the 'views' directory (likely containing assets like CSS or JavaScript)
app.use(express.static(__dirname + '/views'));

// Middleware function to log the request timestamp
// This middleware logs each incoming request's timestamp and then proceeds to the next middleware or route handler
app.use((req, res, next) => {
    console.log("Request: ", Date.now());
    next(); // Move to the next middleware or route handler
});

//////////////////////////////////////////////////////////////

// Authorization middleware for JWT token verification
// This middleware checks the 'Authorization' header to verify if the request contains a valid JWT token
app.use((req, res, next) => {
    let authHeader = req.headers.authorization?.split(' '); // Split the 'Authorization' header into parts (e.g., 'Bearer <token>')

    // If the authorization header is present and the type is 'Bearer'
    if (req.headers?.authorization && authHeader[0] === 'Bearer') {
        // Verify the JWT token using the secret from environment variables
        jwt.verify(authHeader[1], process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                req.user = undefined; // If token verification fails, set 'user' to undefined
            }
            req.user = decoded; // Attach the decoded JWT payload to the request object
            next(); // Move to the next middleware or route handler
        });
    }
    else {
        req.user = undefined; // If no valid token is provided, set 'user' to undefined
        next(); // Proceed to the next middleware or route handler
    }
    // Note: The commented-out line `// console.log(authHeader);` could be used for debugging to log the Authorization header
    // return res.status(200); // This line appears to be redundant and doesn't affect the flow
});

//////////////////////////////////////////////////////

// Define routes for different API endpoints
app.use('/api/users', require('./routes/users')); // Route for user-related actions (e.g., authentication, registration)
app.use('/api/books', require('./routes/books')); // Route for book-related actions (e.g., listing, adding books)
app.use('/api/reviews', require('./routes/reviews')); // Route for review-related actions (e.g., creating, editing reviews)
app.use('/api/collections', require('./routes/collections')); // Route for collection-related actions (e.g., creating, editing reviews)

// Start the Express server and listen for requests on the specified port
app.listen(port, () => {
    console.log(`Example app is listening on port ${port}`); // Log a message when the server starts successfully
});

// Export the app object so it can be used in tests or other parts of the application
exports.app = app;