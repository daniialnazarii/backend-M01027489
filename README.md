# backend-M01027489

## Run the backend

From this directory, install dependencies and start the server:

```sh
npm install
npm start
```

The server reads lessons from the `coursework` database's `lessons` collection.
Checkout saves the customer's name, telephone number, and an array of lesson
IDs to the `orders` collection, then updates each ordered lesson's `spaces`
count in MongoDB.

The backend exposes `GET /` to list lessons, `POST /orders` to save an order,
and `PUT /lessons/:_id` to update a lesson's available spaces.

MongoDB credentials belong in `sensetive/config.env` as a complete connection
URI:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
```

The `sensetive/` directory is ignored by Git. Keep the URI private, URL-encode
special characters in its username or password, and ensure the database
provider allows connections from your current network.