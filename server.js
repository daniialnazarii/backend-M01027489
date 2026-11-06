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

const app = express();
const imageDirectory = path.join(__dirname, "..", "..", "frontend-fullstack", "images");

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
        })
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

async function startServer() {
    await client.connect();
    console.log("Successfully connected to MongoDB");
    app.listen(3002, function() {
        console.log("App started on port 3002");
    });
}

startServer().catch(function(error) {
    console.error("MongoDB connection failed:", error.name);
    process.exitCode = 1;
});