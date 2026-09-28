const express = require("express");
const app = express();

const PORT = 3000;

app.use(express.json());

let students = [
    {
        rollNo: "93",
        name: "Bheeshma",
        gpa: 8.6,
        semester: 3,
        mobileNo: "9876543210"
    },
    {
        rollNo: "99",
        name: "Pranav",
        gpa: 9.1,
        semester: 3,
        mobileNo: "9876543211"
    },
    {
        rollNo: "107",
        name: "Vishal",
        gpa: 7.9,
        semester: 4,
        mobileNo: "9876543212"
    },
    {
        rollNo: "118",
        name: "Bhargav",
        gpa: 8.3,
        semester: 5,
        mobileNo: "9876543213"
    },
    {
        rollNo: "128",
        name: "Sahith",
        gpa: 7.7,
        semester: 3,
        mobileNo: "9876543214"
    }
];

// Home route
app.get("/", (req, res) => {
    res.send("Student Management REST API is running");
});

// GET - All students
app.get("/api/students", (req, res) => {
    res.json(students);
});

// GET - Student by roll number
app.get("/api/students/:rollNo", (req, res) => {
    const student = students.find(
        student => student.rollNo === req.params.rollNo
    );

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    res.json(student);
});

// POST - Add new student
app.post("/api/students", (req, res) => {
    const { name, rollNo, gpa, semester, mobileNo } = req.body;

    if (!name || !rollNo || gpa === undefined || !semester || !mobileNo) {
        return res.status(400).json({
            message: "Name, rollNo, gpa, semester and mobileNo are required"
        });
    }

    const existingStudent = students.find(
        student => student.rollNo === rollNo
    );

    if (existingStudent) {
        return res.status(400).json({
            message: "Student with this roll number already exists"
        });
    }

    const newStudent = {
        name,
        rollNo,
        gpa,
        semester,
        mobileNo
    };

    students.push(newStudent);

    res.status(201).json({
        message: "Student added successfully",
        student: newStudent
    });
});

// PUT - Update / Promote student
// PUT - Update student
app.put("/api/students/:rollNo", (req, res) => {
    const student = students.find(
        student => student.rollNo === req.params.rollNo
    );

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const { name, gpa, semester, mobileNo } = req.body;

    student.name = name || student.name;
    student.gpa = gpa ?? student.gpa;
    student.semester = semester ?? student.semester;
    student.mobileNo = mobileNo || student.mobileNo;

    res.json({
        message: "Student updated successfully",
        student: student
    });
});

// PUT - Promote student
app.put("/api/students/:rollNo/promote", (req, res) => {
    const student = students.find(
        student => student.rollNo === req.params.rollNo
    );

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    student.semester = student.semester + 1;

    res.json({
        message: "Student promoted successfully",
        student: student
    });
});

// DELETE - Delete student
app.delete("/api/students/:rollNo", (req, res) => {
    const index = students.findIndex(
        student => student.rollNo === req.params.rollNo
    );

    if (index === -1) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const deletedStudent = students.splice(index, 1);

    res.json({
        message: "Student deleted successfully",
        student: deletedStudent[0]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});