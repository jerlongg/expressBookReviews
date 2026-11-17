const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!password || !username) {
    return res.status(400).json({
      message: "Username or Password is required"
    });
  }

  // is user is authenticated
  if (authenticatedUser(username, password)) {
    const accessToken = jwt.sign(
      {username: username},
      "access",
      {expiresIn: "1h"}
    );

    req.session.authorization = {
      accessToken: accessToken,
      username: username
    };
    return res.status(200).json({message: "User successfully logged in.",
      accessToken: accessToken
    });
  }

  return res.status(401).json({message: "Invalid username or password"});
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review || req.body.review;
  const username = req.user && req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }
  if (!review) {
    return res.status(400).json({message: "Review is required"});
  }

  // Same user reviewing the same book again overwrites the old review
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated.`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user && req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }
  if (!username || !books[isbn].reviews[username]) {
    return res.status(404).json({message: "No review found for this user"});
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been deleted.`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
