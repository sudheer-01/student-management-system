var express = require("express");
var path = require("path");
var app = express();

// Print the directory to debug issues
console.log("Current directory:", __dirname);

// Define the correct base directory
var baseDir = path.join(__dirname, "NodeJsWithTwoWebPages");  // Make sure "NodeJsWithTwoWebPages" is correct

// Check if 'NodeJsWithTwoWebPages' is already in __dirname
if (__dirname.includes("NodeJsWithTwoWebPages")) {
    baseDir = __dirname; // Avoid adding 'NodeJsWithTwoWebPages' again if already included
}

// Serve static files from the correct paths
app.use(express.static(path.join(baseDir, "loginpage")));
app.use(express.static(path.join(baseDir, "registrationpage")));

// Middleware to parse URL-encoded data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route to serve the login page
app.get("/", (req, res) => {
    res.sendFile(path.join(baseDir, "loginpage", "index.html"));
});

// Route to serve the registration page
app.get("/index1.html", (req, res) => {
    res.sendFile(path.join(baseDir, "registrationpage", "index1.html"));
});

// Start the server on port 8082
app.listen(8082, () => {
    console.log("Server running at http://localhost:8082");
});
