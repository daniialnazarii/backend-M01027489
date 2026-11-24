const path = require("node:path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({
    path: path.join(__dirname, "sensetive", "config.env")
});
const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI is missing from sensetive/config.env");
}

const client = new MongoClient(uri);
const db = client.db("coursework");

const port = process.env.PORT || 3000;

const app = express();
const imageDirectory = path.join(__dirname, "images");

app.use(function(request, response, next) {
    console.log(`${request.method} ${request.originalUrl}`);
    next();
});
app.use(cors());
app.use(express.json());
app.use("/images", express.static(imageDirectory));
app.use("/images", function(request, response) {
    response.status(404).send("Image not found");
});

app.get("/", function(request, response) {
    response.redirect("/lessons");
});

app.get("/lessons", async function(request, response) {
    try {
        const lessons = await db.collection("lessons").find({}).toArray();
        response.json(lessons);
    } catch (error) {
        console.error("Failed to read lessons from MongoDB:", error.name);
        response.status(500).json({ error: "Unable to load lessons" });
    }
});

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.get("/lessons/search", async function(request, response) {
    const searchTerm = request.query.q;
    if (
        Object.keys(request.query).length !== 1 ||
        typeof searchTerm !== "string" ||
        searchTerm.trim() === ""
    ) {
        return response.status(400).json({ error: "Provide one non-empty q search term" });
    }

    const searchPattern = escapeRegExp(searchTerm.trim());
    const searchableFields = ["subject", "location", "price", "spaces", "tutor"];
    const filter = {
        $or: searchableFields.map(function(field) {
            return {
                $expr: {
                    $regexMatch: {
                        input: {
                            $convert: {
                                input: `$${field}`,
                                to: "string",
                                onError: "",
                                onNull: ""
                            }
                        },
                        regex: searchPattern,
                        options: "i"
                    }
                }
            };
        })
    };

    try {
        const lessons = await db.collection("lessons").find(filter).toArray();
        response.json(lessons);
    } catch (error) {
        console.error("Failed to search lessons in MongoDB:", error.name);
        response.status(500).json({ error: "Unable to search lessons" });
    }
});

app.post("/orders", async function(request, response) {
    const order = request.body;
    if (
        !order ||
        typeof order.name !== "string" ||
        typeof order.telephone !== "string" ||
        !Array.isArray(order.lessonSlots) ||
        order.lessonSlots.length === 0 ||
        !order.lessonSlots.every(function(id) {
            return typeof id === "string";
        }) ||
        !Number.isInteger(order.spaces) ||
        order.spaces !== order.lessonSlots.length
    ) {
        return response.status(400).json({ error: "Invalid order details" });
    }

    try {
        const result = await db.collection("orders").insertOne(order);
        response.status(201).json(result);
    } catch (error) {
        console.error("Failed to save order:", error.name);
        response.status(500).json({ error: "Unable to save order" });
    }
});

app.put("/lessons/:_id", async function(request, response) {
    const lessonId = request.params._id;
    const updates = request.body;

    if (!ObjectId.isValid(lessonId)) {
        return response.status(400).json({ error: "Invalid lesson ID" });
    }
    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates) ||
        Object.keys(updates).length === 0
    ) {
        return response.status(400).json({ error: "Provide lesson fields to update" });
    }

    const invalidField = Object.keys(updates).some(function(field) {
        return field === "_id" || field === "__proto__" || field.includes(".") || field.startsWith("$");
    });
    if (invalidField) {
        return response.status(400).json({ error: "Invalid lesson field" });
    }
    if (
        Object.prototype.hasOwnProperty.call(updates, "spaces") &&
        (!Number.isInteger(updates.spaces) || updates.spaces < 0)
    ) {
        return response.status(400).json({ error: "Invalid lesson spaces" });
    }

    try {
        const result = await db.collection("lessons").updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: updates }
        );
        if (result.matchedCount === 0) {
            return response.status(404).json({ error: "Lesson not found" });
        }
        response.json(result);
    } catch (error) {
        console.error("Failed to update lesson:", error.name);
        response.status(500).json({ error: "Unable to update lesson" });
    }
});

// Challenge: Teachers
// Returns every teacher (firstName, lastName and the IDs of the lessons they teach).
app.get("/teachers", async function(request, response) {
    try {
        const teachers = await db.collection("teachers").find({}).toArray();
        response.json(teachers);
    } catch (error) {
        console.error("Failed to read teachers:", error.name);
        response.status(500).json({ error: "Unable to load teachers" });
    }
});

// Returns all the lessons taught by one teacher.
app.get("/teachers/:id/lessons", async function(request, response) {
    const teacherId = request.params.id;
    if (!ObjectId.isValid(teacherId)) {
        return response.status(400).json({ error: "Invalid teacher ID" });
    }

    try {
        const teacher = await db.collection("teachers").findOne({ _id: new ObjectId(teacherId) });
        if (!teacher) {
            return response.status(404).json({ error: "Teacher not found" });
        }

        // lessonIds holds the _id of every lesson this teacher teaches.
        const lessons = await db.collection("lessons")
            .find({ _id: { $in: teacher.lessonIds } })
            .toArray();
        response.json(lessons);
    } catch (error) {
        console.error("Failed to read teacher lessons:", error.name);
        response.status(500).json({ error: "Unable to load teacher lessons" });
    }
});

// Challenge: Enrolment
// Returns how many slots of one lesson have already been bought in orders.
app.get("/enrolment/:lessonid", async function(request, response) {
    const lessonId = request.params.lessonid;
    if (!ObjectId.isValid(lessonId)) {
        return response.status(400).json({ error: "Invalid lesson ID" });
    }

    try {
        const lesson = await db.collection("lessons").findOne({ _id: new ObjectId(lessonId) });
        if (!lesson) {
            return response.status(404).json({ error: "Lesson not found" });
        }

        // An order's lessonSlots has one lesson _id per space bought, e.g. ["<id>", "<id>", "<other id>"].
        const orders = await db.collection("orders")
            .find({ lessonSlots: lessonId })
            .toArray();

        let enrolment = 0;
        for (const order of orders) {
            for (const slot of order.lessonSlots) {
                if (slot === lessonId) {
                    enrolment++;
                }
            }
        }

        response.json({
            lessonId: lesson._id,
            subject: lesson.subject,
            enrolment: enrolment
        });
    } catch (error) {
        console.error("Failed to calculate enrolment:", error.name);
        response.status(500).json({ error: "Unable to calculate enrolment" });
    }
});

async function startServer() {
    await client.connect();
    console.log("Successfully connected to MongoDB");
    app.listen(port, function() {
    console.log("App started on port " + port);
});

}

startServer().catch(function(error) {
    console.error("MongoDB connection failed:", error.name);
    process.exitCode = 1;
});