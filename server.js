// requiring our packages

var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");
var logger = require("morgan");

var cheerio = require("cheerio");

var PORT = process.env.PORT || 3000;

var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://kevinerman:test1234@ds121753.mlab.com:21753/heroku_f9rh3wq8";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// starting the request on the website

app.delete("/drop", function (req, res) {
  db.Article.remove();
});

app.get("/scrape", function (req, res) {

  request("https://www.eventhubs.com", function (error, response, html) {

    // passing the html into cheerio

    var $ = cheerio.load(html);

    var results = {};

    // targeting div elements with storyabstract class and cycling through each

    $("div.storyabstract").each(function (i, element) {

      var title = $(element).children("h1").children("a").text();

      var link = "https://www.eventhubs.com" + $(element).children().children().attr("href");

      // since the p elements aren't labeled on this website, I had to take 
      // them all together and slice the part I actually need. I decided to
      // slice on the first sentence for the blurb. starting at 41 cuts out
      // a lot of empty space at the beginning

      var blurb = $(element).children("p").text()
      var sentenceEnd = blurb.indexOf(".");
      var slicedBlurb = blurb.slice(41, sentenceEnd);

      //pushing the title, link, and sliced blurb into our results array to display 

      results._id = title;
      results.title = title;
      results.link = link;
      results.blurb = slicedBlurb;

        db.Article.create(results)
          .then(function (dbArticle) {
            console.log(dbArticle);
          })
          .catch(function (err) {
            return res.json(err);
          })

    });
  });
});

app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});