// importing all the npm modules
const express = require("express");
const app = express()
const mongoose = require("mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");

// calling in the mongoose schema for the user
const User = require("./models/user");

// importing the mongoose schema model from the post.js file in the models folder
const Post = require('./models/post')

// setting the strategy to provide security using passport local
const LocalStrategy = require("passport-local");

// applying the security strategy to the user defined in the mongoose schema
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

// simplifies the integration between Mongoose and Passport for local authentication
const passportLocalMongoose = require("passport-local-mongoose");
const twig = require("twig");

// set the Twig template engine
app.set('view engine', 'html');
app.engine('html', twig.__express);
app.set('views', 'views');

// defines the mongodb URL and stores it as a variable
const mongourl = "mongodb+srv://test:test123@node-auth.bz5ml.mongodb.net/node-auth?retryWrites=true&w=majority";

mongoose.connect(mongourl, { useUnifiedTopology: true });

app.use(require("express-session")({
  secret: "Any normal Word", //decode or encode session, this is used to compute the hash.
  resave: false, //What this does is tell the session store that a particular session is still active, in the browser
  saveUninitialized: false //the session cookie will not be set on the browser unless the session is modified
}));

// make the public folder accessible to our backend application, so we can use the style.css file
app.use(express.static(__dirname + '/public'));

// add the bodyParser so we can return our information to the database
app.use(bodyParser.urlencoded({ extended:true }))

// turn on the passport dependency 
app.use(passport.initialize());

// start a new passport session for the user
app.use(passport.session());

const port = 3000;

app.listen(port, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server Started At Port " + port);
  }
});

// LOGIN
app.get("/login", (req, res) => {
  // res.sendFile(__dirname + "/views/login.html");
  res.render("login")
});
// REGISTER
app.get("/register", (req, res) => {
  // res.sendFile(__dirname + "/views/register.html");
  res.render("register")
});
// EDIT
app.get("/edit", (req, res) => {
  res.render("edit")
});

// set up the functionality for registering a new user
app.post("/register", (req, res) => {

//passport-local-mongoose function to register a new user
  User.register(new User({ 
    	username: req.body.username,
    	  phone: req.body.phone,
    	}),
    	req.body.password,
    	  function (err, user) {
    	    if (err) {
    	      console.log(err);
          }
          // authenticate the local session and redirect to login page
    	    passport.authenticate("local")(req, res, function () { 
            console.log(req);
    	      res.redirect("/login");
    	    })
    	  })
      });
      
  // set up the functionality for logging in an existing user
  // "Posting" the form data to the Mongo database with a passport.authenticate function as an argument
  // the passport npm module allows you to write a simple function, to achieve something much more complex 
  // such as encryped the password with hash & salt, and then being able to verify it
  app.post("/login", passport.authenticate("local",{
    // on success, redirect to the dashboard, on failure, redirect back to login
    successRedirect: "/dashboard",
    failureRedirect: "/login"
    })
  );

  // logout function
  app.get("/logout", (req, res) => {
    // passport module logout function and then a simple redirect back to the home page
    req.logout();
    res.redirect("/");
  });

  // Check if user is authenticated and logged in, return a next() function to run the next piece of middleware if so, redirect to home page if not
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
      return next();
      res.redirect('/');
  }

  // stop users from seeing the dashboard if they haven't logged in
  app.get("/dashboard", isLoggedIn, (req, res) => {
    res.render('dashboard.html', { user: req.user })
  })

  app.post('/dashboard', (req, res) => {
    console.log("post submitted");

    // using the model created in post.js to post to the request
    new Post({
        title: req.body.title,
        img: req.body.img,
        description: req.body.description,
        name: req.body.name,
        portfolio: req.body.portfolio
      })
      // to save it to the datatbase
      .save()
      // then means, a function to complete once the previous one has completed
      .then(result => {
        // overide the default function and redirect the browser back to the homepage
        res.redirect('/')
      })
      // catching and displaying an error if there is one
      .catch(err => {
        if (err) throw err;
      })
  });

// delete function
app.get('/delete/:id', (req, res) => {
  Post.findByIdAndDelete(req.params.id)
    .then(result => {
      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/');
    })
});

// view the posts on the home page
// Render the quotes to homepage
app.get('/', (req, res) => {
    // FETCH ALL POSTS FROM DATABASE
    Post.find()
    // SET descending ORDER BY createdAt
    .sort({createdAt: 'descending'})
    .then(result => {
        if(result){
            console.log(result);
            // RENDERING HOME VIEW WITH ALL POSTS
            res.render('home',{
                allpost:result
            });
        }
    })
    .catch(err => {
        if (err) throw err;
    }); 
});
// EDIT POST
app.get('/edit/:id', (req, res) => {

  Post.findById(req.params.id)
    .then(result => {
      if (result) {
        res.render('edit', {
          post: result
        });
      } else {
        res.redirect('/');
      }
    })
    .catch(err => {
      res.redirect('/');
    });
});

// UPDATE POST
app.post('/edit/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(result => {
      if (result) {
        console.log('updated')
        result.title = req.body.title;
        result.img = req.body.img;
        result.description = req.body.description;
        result.name = req.body.name;
        result.portfolio = req.body.portfolio;
        return result.save();
      } else {
        console.log(err);
        res.redirect('/');
      }
    })
    .then(update => {
      res.redirect('/');
    })
    .catch(err => {
      res.redirect('/');
    });
});