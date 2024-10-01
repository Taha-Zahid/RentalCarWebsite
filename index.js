const http = require('http'); // Import the http module to create a server
const fs = require("fs"); // Import the fs module to handle file system operations

// Function to respond with an invalid email error
function InvalidEmail(res) {
  res.writeHead(401); // Set HTTP status code to 401 Unauthorized
  res.write("Email is not valid"); // Write error message
  res.end(); // End the response
}

// Function to validate email format and structure
function ValidateEmail(res, email) {
  let emailParts = email.split("@"); // Split email into local and domain parts
  if (emailParts.length != 2 || emailParts[1].length < 1) {
    InvalidEmail(res); // Call error function if email is invalid
    return;
  }
  // Check for valid characters in the email
  for (let c of emailParts.join("")) { // Check all characters in the email
    if (!"abcdefghijklmnopqrstuvwxyz0123456789.".includes(c.toLowerCase())) {
      InvalidEmail(res); // Call error function if invalid character is found
      return;
    }
  }
  // Return the file path based on email structure
  return "users/" + emailParts[1] + "/" + emailParts[0];
}

// Create an HTTP server
http.createServer(function (req, res) { 
  let path = req.url.slice(1).split("?")[0]; // Extract path from URL
  let query = new URLSearchParams(req.url.split("?")[1]); // Extract query parameters
  let pw = query.get("pw"); // Get the password from query parameters

  // Handle GET requests
  if (req.method == "GET") {
    if (req.url == "/") { // Home page
      res.writeHead(200, {"Content-Type": "text/html"}); // Set content type to HTML
      res.write(fs.readFileSync("index.html")); // Send the index.html file
    } else if (path == "index.css") { // CSS file request
      res.writeHead(200, {"Content-Type": "text/css"}); // Set content type to CSS
      res.write(fs.readFileSync(path)); // Send the requested CSS file
    } else if (path.startsWith("listings/")) { // Car listings request
      if (fs.existsSync(path)) { // Check if the file exists
        res.writeHead(200);
        res.write(fs.readFileSync(path)); // Send the requested listings file
      } else {
        res.writeHead(404); // File not found
        res.write("404 Not Found");
      }
    } else {
      res.writeHead(404); // File not found
      res.write("404 Not Found");
    }
  }

  // Handle POST requests
  if (req.method == "POST") {
    if (path == "login") { // Login Request
      let lpath = ValidateEmail(res, query.get("email")); // Validate email
      if (!lpath) { return; } // Return if validation fails
      // Check if the email is registered
      if (!fs.existsSync(lpath)) {
        res.writeHead(401);
        res.write("Email is not registered."); // Email not found
        res.end(); 
        return;
      }
      // Validate the password
      if (fs.readFileSync(lpath + "/pw.txt") != pw) {
        res.writeHead(401);
        res.write("Password is incorrect."); // Incorrect password
        res.end(); 
        return;
      }
      res.writeHead(200, {"Set-Cookie": "login=" + query.get("email") + ";"}); // Set login cookie
      res.write("Successfully logged in."); // Success message

    } else if (path == "signup") { // Signup Request
      let pwErr = ""; // Variable to hold password error messages
      let lpath = ValidateEmail(res, query.get("email")); // Validate email
      if (!lpath) { return; } // Return if validation fails
      // Check password validity
      if (pw.length < 1) {
        pwErr = "Password field is empty"; 
      } else if (pw.length < 8) {
        pwErr = "Password is shorter than 8 characters"; // Minimum length check
      }
      if (pwErr != "") {
        res.writeHead(401);
        res.write(pwErr); // Return password error
        res.end(); 
        return;
      }
      // Check if email is already registered
      if (fs.existsSync(lpath)) {
        res.writeHead(401);
        res.write("Email is already registered."); // Email already exists
        res.end(); 
        return;
      }
      // Create user directory and save password
      fs.mkdirSync(lpath, { recursive: true }); 
      fs.writeFileSync(lpath + "/pw.txt", pw); // Save password to file
      res.writeHead(200);
      res.write("Successfully Registered."); // Success message

    } else if (path == "rent") { // Rental Request
      let lpath = ValidateEmail(res, query.get("email")); // Validate email
      if (!lpath) { return; } // Return if validation fails
      fs.writeFileSync(lpath + "/" + query.get("id") + ".txt", "..."); // Record rental
      res.writeHead(200);
      res.write("Successfully Rented."); // Success message

    } else if (path == "unrent") { // Cancel Rental Request
      let lpath = ValidateEmail(res, query.get("email")); // Validate email
      if (!lpath) { return; } // Return if validation fails
      let fpath = lpath + "/" + query.get("id") + ".txt"; // Rental file path
      if (fs.existsSync(fpath)) { // Check if the rental file exists
        fs.unlinkSync(fpath); // Delete rental file
      }
      res.writeHead(200);
      res.write("Successfully Cancelled."); // Success message

    } else if (path == "getrent") { // Get list of all cars rented by the user
      let lpath = ValidateEmail(res, query.get("email")); // Validate email
      if (!lpath) { return; } // Return if validation fails
      let curRentals = []; // Array to hold current rentals
      fs.readdirSync(lpath).forEach((f) => { // Read user's directory
        let a = f.split(".")[0]; // Get file name without extension
        if (a != "pw") { curRentals.push(f.split(".")[0]); } // Exclude password file
      });
      res.writeHead(200);
      res.write(curRentals.join(",")); // Send list of current rentals
    }
  }
  res.end(); // End the response
}).listen(80); // Server listens on port 80
console.log("running"); // Log server status
