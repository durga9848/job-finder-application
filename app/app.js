// Import express.js
const express = require("express");
const { User } = require("./models/user");
// Create express app
var app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());


const session = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
});
app.use(sessionMiddleware);


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');
app.set('view engine', 'pug');
app.set('views', './app/views');

// // Create a route for root - /
// app.get("/", function(req, res) {
//     res.render("index");
// });


app.get('/signup', function (req, res) {
    res.render('signup');
});

app.get('/login', function (req, res) {
    res.render('login');
});


app.get("/", function (req, res) {
    try {
        if (req.session.uid) {
            res.redirect('/home');
        } else {
            res.render('login');
        }
        res.end();
    } catch (err) {
        console.error("Error accessing root route:", err);
        res.status(500).send('Internal Server Error');
    }
});



// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        var user = new User(email);
        const uId = await user.getIdFromEmail();
        if (!uId) {
            return res.status(401).send('Invalid email');
        }

        const match = await user.authenticate(password);
        if (!match) {
            return res.status(401).send('Invalid password');
        }

        req.session.uid = uId;
        req.session.loggedIn = true;
        console.log(req.session.id);
        res.redirect('/home');
    } catch (err) {
        console.error(`Error while authenticating user:`, err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/set-password', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            // If a valid, existing user is found, set the password and redirect to the users single-student page
            await user.setUserPassword(params.password);
            console.log(req.session.id);
            res.send('Password set successfully');
        }
        else {
            // If no existing user is found, add a new one
            newId = await user.addUser(params.email);
            res.send('Perhaps a page where a new user sets a programme would be good here');
        }
    } catch (err) {
        console.error(`Error while adding password `, err.message);
    }
});

app.get('/logout', function (req, res) {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (err) {
        console.error("Error logging out:", err);
        res.status(500).send('Internal Server Error');
    }
});

// Create a route for testing the db
app.get("/home", function(req, res) {
    sql = 'select * from job_listings';
    db.query(sql).then(results => {
        console.log(results);
        res.render('homepage', {"jobs":results})
    });
});
// Assuming you have already defined `app` and `db` objects

app.get("/view-job/:id", function(req, res) {
    const jobId = req.params.id;
    const sql = 'SELECT * FROM job_listings WHERE job_id = ?';
    db.query(sql, [jobId])
        .then(results => {
            if (results.length > 0) {
                const job = results[0];
                res.render('view-job', { job });
            } else {
                res.status(404).send('Job not found');
            }
        })
        .catch(error => {
            console.error('Error fetching job:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});



// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});