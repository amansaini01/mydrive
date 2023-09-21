const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
require('dotenv').config();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storage_per = multer.diskStorage({
  destination: './personal',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const personal = multer({ storage: storage_per });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/personal', express.static(path.join(__dirname, 'personal')));

// Use EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: process.env.session_key, resave: false, saveUninitialized: true }));

// User data (replace with your actual user data storage)
const users = [
  { username: process.env.user1, password: process.env.pwd1 },
  { username: process.env.user2, password: process.env.pwd2 },
  // Add more users as needed
];

const users2 = [
  { username: process.env.Muser1, password: process.env.Mpwd1 }
  // Add more users as needed
];

function restrictToRoles(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.session.user && req.session.user.role;

    if (userRole && allowedRoles.includes(userRole)) {
      // User has the required role; allow access
      next();
    } else {
      // User does not have the required role; deny access
      res.render("login_error");
    }
  };
}


// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the submitted credentials match any user in the array
  const user1 = users.find((u) => u.username === username && u.password === password);
  const user2 = users2.find((u) => u.username === username && u.password === password);

  if (user1) {
    // Store user information in the session
    req.session.user = {
      username: user1.username, // User-specific data
      role: 'user1',     // Role assignment
    };
    // Redirect to a secure dashboard or home page
    res.redirect('/index');
  } 
  
  else if (user2){
    // Store user information in the session
    req.session.user = {
      username: user2.username, // User-specific data
      role: 'user2',     // Role assignment
    };
    // Redirect to a secure dashboard or home page
    res.redirect('/index2');
  }

  else {
    res.render('login_error');
  }
});



app.get('/logout', (req, res) => {
  // Destroy the session and log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});


app.get('/index', restrictToRoles(['user1']), (req, res) => {
  // Get a list of files in the 'uploads' directory
  if (req.session.user){
    const dirPath = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(dirPath);
    res.render('index', { files });
  }
  else{
    res.render("login_error")
  }
  
});


app.get('/index2', restrictToRoles(['user2']), (req, res) => {
  // Get a list of files in the 'uploads' directory
  if (req.session.user) {
    const dirPath = path.join(__dirname, 'personal');
    const files = fs.readdirSync(dirPath);
  
    res.render('index2', { files });
  }
  else{
    res.render("login_error")
  }
  
});


// File upload page
app.get('/upload', restrictToRoles(['user1']), (req, res) => {
  if (req.session.user){
    res.render('upload');
  }
  else{
    res.render("login_error");
  }
  
});

app.get('/personal', restrictToRoles(['user2']), (req, res) => {
  if (req.session.user){
    res.render('personal');
  }
  else{
    res.render("login_error")
  }
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/index');
});

app.post('/personal', personal.single('file'), (req, res) => {
  res.redirect('/index2');
});


// File download endpoint
app.get('/download/:filename',  (req, res) => {
  if (req.session.user){
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Check if the file exists
    res.download(filePath, (err) => {
      if (err) {
        res.status(404).json({ message: 'File not found' });
      }
    });
  }
  else{
    res.render("login_error");
  }
});

app.get('/download2/:filename', (req, res) => {
  if (req.session.user){
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'personal', filename);

    // Check if the file exists
    res.download(filePath, (err) => {
      if (err) { 
        res.status(404).json({ message: 'File not found' });
      }
    });
  }
  else{
    res.render("login_error");
  }
});

// Start the server
app.listen(port, () => {
  console.log("Server is listening on port 3000");
});