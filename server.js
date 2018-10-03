// requiring our packages

var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");
var logger = require("morgan");

var cheerio = require("cheerio");

var PORT = 3000;

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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// starting the request on the website

app.delete("/drop", function (req,res) {
    db.Article.remove();
});

app.get("/scrape", function (req, res) {

    request("https://old.reddit.com/r/HeroesofTheStorm", function (error, response, html) {

        // passing the html into cheerio

        var $ = cheerio.load(html);

        var results = {};

        // targeting p elements and cycling through each

        $("p.title").each(function (i, element) {
            var title = $(element).children("a").text();

            //titles were ending with link references in parenthesis.
            //so to remove I'm slicing the string at the start of the parenthesis
            //minus 1 to account for the empty space space

            var sliceEnd = (title.indexOf("(")) - 1;

            var slicedTitle = title.slice(0, sliceEnd)

            var link = $(element).children().attr("href");

            //certain links are nested two children deep if a flair exists.
            //this if statement is catching any links that are nested two layers
            //deep by checking if they come back as undefined after only checking
            //one child

            if (link === undefined) {
                var link = $(element).children().children().attr("href");
            }

            //pushing the sliced title and link into our results array to display 

            results.title = slicedTitle;
            results.link = link;
            
            console.log(results);

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

    app.get("/articles", function(req, res) {
        // Grab every document in the Articles collection
        db.Article.find({})
          .then(function(dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });

      app.get("/articles", function(req, res) {
        // Grab every document in the Articles collection
        db.Article.find({})
          .then(function(dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });
      
      // Route for grabbing a specific Article by id, populate it with it's note
      app.get("/articles/:id", function(req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Article.findOne({ _id: req.params.id })
          // ..and populate all of the notes associated with it
          .populate("note")
          .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });
      
      // Route for saving/updating an Article's associated Note
      app.post("/articles/:id", function(req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
          .then(function(dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
          })
          .then(function(dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});