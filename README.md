# backend-M01027489

## Run the backend

From this directory, install dependencies and start the server:

```sh
npm install
npm start
```

The server reads lessons from the `coursework` database's `lessons` collection.
Checkout saves the customer's name, telephone number, an array of lesson IDs,
and the total number of ordered spaces to the `orders` collection, then updates
each ordered lesson's `spaces` count in MongoDB.

The backend exposes `GET /lessons` to list lessons,
`GET /lessons/search?q=<term>` to search across lesson subjects,
locations, prices, spaces and tutors, `POST /orders` to
save an order, and `PUT /lessons/:_id` to update lesson fields. Search is
case-insensitive and matches a partial term in any of those fields; for example,
`/lessons/search?q=art`. Requests are logged in the server console. Lesson
images in this project's `images` folder are served at `/images/<filename>`
(for example `/images/robotics.svg`); a missing image returns a 404 "Image not found".

## Teachers (challenge)

The `teachers` collection stores one document per teacher:

```json
{ "firstName": "Emily", "lastName": "Johnson", "lessonIds": [ObjectId("..."), ObjectId("...")] }
```

- `GET /teachers` returns all teachers.
- `GET /teachers/:id/lessons` finds the teacher and returns every lesson whose
  `_id` is in that teacher's `lessonIds` (a `$in` query).
- `node seed-data.js` creates the 10 lessons (children's after-school clubs,
  5 spaces each) and the 6 teachers, and links each teacher to the `_id` of
  their lessons. It can be run again safely: it deletes the old lessons and
  teachers and inserts them fresh. Orders are not touched.

## Enrolment (challenge)

`GET /enrolment/:lessonid` returns how many spaces of a lesson have already been
bought, for example `{ "lessonId": "...", "subject": "Art", "enrolment": 3 }`.
It finds every order whose `lessonSlots` contains the lesson, then counts how
many times the lesson's `_id` appears in each order (one entry per space bought).

## Postman

Import `postman/after-school-lessons.postman_collection.json` into Postman. It
has requests for every route. The `lessonId` and `teacherId` collection
variables must hold real `_id` values.

MongoDB credentials belong in `sensetive/config.env` as a complete connection
URI:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
```

The `sensetive/` directory is ignored by Git. Keep the URI private, URL-encode
special characters in its username or password, and ensure the database
provider allows connections from your current network.
