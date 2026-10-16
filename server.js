var express = require("express"); // Requires the Express module

// Calls the express function to start a new Express application
var app = express();

app.use(function(request, response) { // middleware
    console.log("In comes a request to: " + request.url);
    response.json(productsArray);
});
let productsArray = [
{
id: 1004,
title: "Scratch Post X-TREME",
description: "The ultimate in high-endscratching posts",
price: 6500,
image: "images/catPost.jpg",
availableInventory:3,
},
{
id: 1005,
title: "Luxury Cat Toy",
description: "A delightful toy that yourcat will adore",
price: 7000,
image: "images/catToy.jpg",
availableInventory:10,
}
];
response.json(productsArray);
app.listen(3000, function() {
    console.log("App started on port 3000");
});