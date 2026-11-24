// One-off script that fills MongoDB Atlas with the lessons and teachers.
// Run it with:  node seed-data.js
// It is safe to run again: it deletes the old lessons and teachers and inserts
// them fresh, so every lesson goes back to 5 spaces. Orders are not touched.
const path = require("node:path");
require("dotenv").config({
    path: path.join(__dirname, "sensetive", "config.env")
});
const { MongoClient } = require("mongodb");

// After-school clubs for children. Every lesson starts with 5 spaces.
const lessons = [
    { id: "robotics", subject: "Robotics", location: "Hendon", price: 90, alt: "A small robot built in a robotics club" },
    { id: "coding", subject: "Coding for Kids", location: "Colindale", price: 75, alt: "A laptop showing colourful code blocks" },
    { id: "art", subject: "Art & Craft", location: "Wembley", price: 60, alt: "Paint brushes and a colour palette" },
    { id: "drama", subject: "Drama", location: "Finchley", price: 65, alt: "Theatre masks for a drama class" },
    { id: "football", subject: "Football", location: "Brent Cross", price: 50, alt: "A football on a green pitch" },
    { id: "basketball", subject: "Basketball", location: "Edgware", price: 55, alt: "A basketball and hoop" },
    { id: "swimming", subject: "Swimming", location: "Harrow", price: 80, alt: "A swimming pool with lane ropes" },
    { id: "music", subject: "Music", location: "Golders Green", price: 70, alt: "Musical notes and a guitar" },
    { id: "chess", subject: "Chess Club", location: "Hendon", price: 45, alt: "Chess pieces on a board" },
    { id: "maths", subject: "Maths Club", location: "Mill Hill", price: 60, alt: "Numbers and shapes for a maths club" }
];

// Each teacher has a first name, a last name and one or more lessons (by lesson id).
const teachers = [
    { firstName: "Danial", lastName: "Nazari", lessons: ["robotics", "coding"] },
    { firstName: "Akira", lastName: "Smith", lessons: ["art", "drama"] },
    { firstName: "Michael", lastName: "Brown", lessons: ["football", "basketball"] },
    { firstName: "Sarah", lastName: "Davis", lessons: ["swimming"] },
    { firstName: "Emily", lastName: "Johnson", lessons: ["music"] },
    { firstName: "Jamie", lastName: "Patel", lessons: ["chess", "maths"] }
];

async function seed() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("coursework");

    // 1. Replace the lessons.
    const lessonDocuments = lessons.map(function(lesson) {
        const teacher = teachers.find(function(item) {
            return item.lessons.includes(lesson.id);
        });
        return {
            id: lesson.id,
            subject: lesson.subject,
            location: lesson.location,
            price: lesson.price,
            spaces: 5,
            tutor: teacher.firstName + " " + teacher.lastName,
            image: "images/" + lesson.id + ".svg",
            alt: lesson.alt
        };
    });
    await db.collection("lessons").deleteMany({});
    const inserted = await db.collection("lessons").insertMany(lessonDocuments);
    console.log(`Inserted ${inserted.insertedCount} lessons`);

    // insertedIds is { 0: ObjectId, 1: ObjectId, ... } in the same order as lessonDocuments.
    const idByLesson = {};
    lessonDocuments.forEach(function(lesson, index) {
        idByLesson[lesson.id] = inserted.insertedIds[index];
    });

    // 2. Replace the teachers, linking each one to the _id of their lessons.
    await db.collection("teachers").deleteMany({});
    for (const teacher of teachers) {
        await db.collection("teachers").insertOne({
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            lessonIds: teacher.lessons.map(function(lessonId) {
                return idByLesson[lessonId];
            })
        });
        console.log(`${teacher.firstName} ${teacher.lastName}: ${teacher.lessons.join(", ")}`);
    }

    await client.close();
}

seed().catch(function(error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
});
