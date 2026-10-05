const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = "studentDB";

async function main() {
    try {
        await client.connect();

        console.log("Connected to MongoDB successfully!");

        const db = client.db(dbName);
        const collection = db.collection("students");

        const students = [
            {
                studentId: 101,
                name: "Anita",
                department: "CSE",
                subjects: [
                    { subject: "DBMS", marks: 85, grade: "A" },
                    { subject: "AI", marks: 90, grade: "A+" },
                    { subject: "Web Development", marks: 78, grade: "B+" }
                ]
            },
            {
                studentId: 102,
                name: "Rahul",
                department: "CSE",
                subjects: [
                    { subject: "DBMS", marks: 75, grade: "B+" },
                    { subject: "AI", marks: 82, grade: "A" },
                    { subject: "Web Development", marks: 88, grade: "A" }
                ]
            },
            {
                studentId: 103,
                name: "Priya",
                department: "AIML",
                subjects: [
                    { subject: "DBMS", marks: 92, grade: "A+" },
                    { subject: "AI", marks: 95, grade: "A+" },
                    { subject: "Web Development", marks: 89, grade: "A" }
                ]
            },
            {
                studentId: 104,
                name: "Kiran",
                department: "AIML",
                subjects: [
                    { subject: "DBMS", marks: 68, grade: "B" },
                    { subject: "AI", marks: 74, grade: "B+" },
                    { subject: "Web Development", marks: 80, grade: "A" }
                ]
            }
        ];

        await collection.deleteMany({});
        await collection.insertMany(students);

        console.log("Student records inserted successfully!");

        const result = await collection.aggregate([
            {
                $unwind: "$subjects"
            },
            {
                $group: {
                    _id: "$studentId",
                    name: { $first: "$name" },
                    averageMarks: {
                        $avg: "$subjects.marks"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    studentId: "$_id",
                    name: 1,
                    averageMarks: {
                        $round: ["$averageMarks", 2]
                    }
                }
            },
            {
                $sort: {
                    averageMarks: -1
                }
            }
        ]).toArray();

        console.log("\nStudent Grade Summary:");
        console.table(result);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

main();