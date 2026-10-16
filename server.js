var express = require("express"); // Requires the Express module
var cors = require("cors"); // Requires the CORS module
// Calls the express function to start a new Express application
var app = express();
var cors=require("cors");
app.use(cors());
app.use(function(request, response) { // middleware
    console.log("In comes a request to: " + request.url);
    response.json(lessons);
});
let lessons = [
            {
							id: 'computer-science',
							subject: 'Computer Science',
							location: 'Hendon',
							price: '17,000 ',
                            tutor: 'John Doe',
							image: 'images/computer-science.jpg',
                            alt: 'A student learning computer science at a laptop',
                            spaces: 5
						},
						{
							id: 'art',
							subject: 'Art',
							location: 'Wembley',
							price: '11,000',
                            tutor: 'Akira Smith',
							image: 'images/art.jpg',
                            alt: 'Colourful art supplies ready for a creative lesson',
                            spaces: 12
						},
						{
							id: 'engineering',
							subject: 'Engineering',
							location: 'Harrow',
							price: '20,000',
                            tutor: 'Emily Johnson',
							image: 'images/engineering.jpg',
                            alt: 'A student building a small engineering project',
                            spaces: 10
						},
						{
							id: 'business',
							subject: 'Business',
							location: 'Edgware',
							price: '17,000',
                            tutor: 'Michael Brown',
							image: 'images/business.jpg',
                            alt: 'Students collaborating around a table during a business lesson',
                            spaces: 7
						},
						{
							id: 'cybersecurity',
							subject: 'Cybersecurity',
							location: 'Finchley',
							price: '22,000',
                            tutor: 'Sarah Davis',
							image: 'images/cybersecurity.jpg',
                            alt: 'A secure digital network represented on a computer screen',
                            spaces: 8
						}
]

app.listen(3002, function() {
    console.log("App started on port 3002");
});