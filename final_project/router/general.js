const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

// Every internal Axios call carries this header. When a data route sees it,
// it answers straight from booksdb.js instead of making another Axios call,
// which is what stops the routes from calling themselves forever.
const INTERNAL_REQUEST = { 'x-internal-request': 'true' };
const isInternalRequest = (req) => req.headers['x-internal-request'] === 'true';

// Turn an Axios error into the same status/body the data route produced
const sendAxiosError = (res, error, fallbackMessage) => {
  if (error.response) {
    return res.status(error.response.status).send(error.response.data);
  }
  return res.status(500).json({ message: fallbackMessage, error: error.message });
};


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!isValid(username)) {
      users.push({ "username": username, "password": password });
      return res.status(200).json({message: "Registration was successful!"})
    } else {
      return res.status(404).json({message: "User already exists!"})
    }
  }
  return res.status(404).json({message: "Unable to register user!"});
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  if (isInternalRequest(req)) {
    return res.status(200).send(JSON.stringify(books, null, 4));
  }

  try {
    const response = await axios.get(`${BASE_URL}/`, { headers: INTERNAL_REQUEST });
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return sendAxiosError(res, error, "Unable to retrieve books");
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;

  if (isInternalRequest(req)) {
    if (!books[isbn]) {
      return res.status(404).json({message: "Book not found"});
    }
    return res.status(200).send(books[isbn]);
  }

  try {
    const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`, { headers: INTERNAL_REQUEST });
    return res.status(200).send(response.data);
  } catch (error) {
    return sendAxiosError(res, error, "Unable to retrieve book");
  }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;

  if (isInternalRequest(req)) {
    const booksByAuthor = Object.values(books).filter(book => book.author === author);
    return res.status(200).send(booksByAuthor);
  }

  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`, { headers: INTERNAL_REQUEST });
    return res.status(200).send(response.data);
  } catch (error) {
    return sendAxiosError(res, error, "Unable to retrieve books by author");
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;

  if (isInternalRequest(req)) {
    const booksByTitle = Object.values(books).filter(book => book.title === title);
    return res.status(200).send(booksByTitle);
  }

  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`, { headers: INTERNAL_REQUEST });
    return res.status(200).send(response.data);
  } catch (error) {
    return sendAxiosError(res, error, "Unable to retrieve books by title");
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }
  res.status(200).send(books[isbn].reviews)
});

module.exports.general = public_users;
