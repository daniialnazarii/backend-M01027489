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
app.use(cors());
app.use(express.json());

app.get("/", async function(request, response) {
    console.log("In comes a request to: " + request.url);
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
    const spaces = request.body && request.body.spaces;

    if (!ObjectId.isValid(lessonId)) {
        return response.status(400).json({ error: "Invalid lesson ID" });
    }
    if (!Number.isInteger(spaces) || spaces < 0) {
        return response.status(400).json({ error: "Invalid lesson spaces" });
    }

    try {
        const result = await db.collection("lessons").updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: { spaces: spaces } }
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