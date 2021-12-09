# MyFuel - Technical Overview

The technical documentation can be found [here](docs).

This application was created using NodeJS and the Express.js framework, for rapid application development, reduced size of the codebase and the ability to have a common language in the front- and back-end. The database for this application is MongoDB and is combined with the mongoose framework, which together make a great fit for our javascript-based application framework and is a combination used widely in the modern web development world. For the deployment, Docker containers were used to abstract away any complex initialization steps and provide a robust basis for our application. For the front-end, apart from HTML5 and CSS3, Bootstrap4 was also used, in order to speed up the UI implementation and have the ability to choose from a wide variety of ready UI elements - of course, with the necessary customizations, when needed. Lastly, for the back-end, a complete RESTful API was created, providing all CRUD actions for the different entities of our application. All endpoints are displayed below:

|Route|Verb|Functionality|
|-----|----|------|
|/|GET|show landing page|
|/register|GET|show register form|
|/register|POST|register|
|/login|GET|show login form|
|/login|POST|login|
|/logout|GET|logout|
|/faq|GET|show faq section|
|/terms|GET|show terms and conditions|
|/privacy|GET|show privacy notice|
|/about|GET|show information about the app|
|/statistics|GET|show fuel statistics|
|/forgot|GET|show form to send email for new password|
|/forgot|POST|send email for new password|
|/reset/:token|GET|show form to reset password|
|/reset/:token|POST|reset password|
|/posts/|GET|show all posts, with pagination|
|/posts/new|GET|show new post form|
|/posts/|POST|create new post|
|/posts/:id|GET|show a single post|
|/posts/:id/edit|GET|edit a post form|
|/posts/:id|PUT|update a post|
|/posts/:id|DELETE|delete a post|
|/posts/:id/reviews/|GET|show all reviews for a specific post|
|/posts/:id/reviews/new|GET|show new review form|
|/posts/:id/reviews/|POST|create new review|
|/posts/:id/reviews/:review_id/edit|GET|edit review form|
|/posts/:id/reviews/:review_id|PUT|update a review|
|/posts/:id/reviews/:review_id|DELETE|delete a review|
|/stores/|GET|show all stores|
|/stores/new|GET|show new store form|
|/stores/|POST|create new store|
|/stores/:id|GET|show a single store|
|/stores/:id/edit|GET|edit a store form|
|/stores/:id|PUT|update a store|
|/stores/:id|DELETE|delete a store|
|/users/|GET|show all users|
|/users/new|GET|redirect to /register|
|/users/:id|GET|show a single user|
|/users/:id/locations|GET|show a single user's locations|
|/users/:id/locations/new|POST|create a new user location|
|/users/:id/locations/edit|POST|edit a user's location|
|/users/:id/locations|DELETE|delete a single user's location|
|/users/:id/edit|GET|edit user form|
|/users/:id|PUT|update a user|
|/users/:id/block|PUT|block a user|
|/users/:id/unblock|PUT|unblock a user|
|/users/:id|DELETE|delete a user|
|/users/:id/redeem|GET|show redemption form|
|/users/:id/redeem|POST|send email with qrcode|
|/users/:id/redeem/:token|GET|show complete redemption form|
|/users/:id/redeem/:token|POST|complete redemption|

\
To provide some functionality to third-party software, a separate server was created with the following endpoints, which return JSON objects:
|Route|Verb|Functionality|
|-----|----|------|
|/api/posts/|GET|return a list of all posts|
|/api/posts/|POST|create a new post|
|/api/posts/:id|GET|return information about a single post|
|/api/stores/|GET|return a list of all stores|
|/api/stores/:id|GET|return information about a single store|
|/api/stores/|POST|create a new store|
|/api/stores/:id|PUT|update a store|
|/api/stores/:id|DELETE|delete a store|
|/api/login/|POST|login and receive an authentication token|
