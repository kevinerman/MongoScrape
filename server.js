// requiring our packages

var cheerio = require("cheerio");
var request = require("request");

// starting the request on the website

request("https://old.reddit.com/r/HeroesofTheStorm", function (error, response, html) {

// passing the html into cheerio

    var $ = cheerio.load(html);

    var results = [];

// targeting p elements and cycling through each

    $("p.title").each(function(i, element) {
        var title = $(element).text();

//titles were ending with link references in parenthesis.
//so to remove I'm slicing the string at the start of the parenthesis
//minus 1 to account for the empty space space

        var sliceEnd = (title.indexOf("("))-1;

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

        results.push({
            title: slicedTitle,
            link: link
        });
    });
    console.log(results);
})