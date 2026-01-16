var express = require("express");
var path = require("path");
var app = express();
var baseDir = __dirname;

app.use(express.static(path.join(baseDir,"Home")));
app.use(express.static(path.join(baseDir,"loginpage")));
app.use(express.static(path.join(baseDir,"NewAccountCreate")));

//Faculty
app.use(express.static(path.join(baseDir,"homepageForFaculty")));
// Serve homepageForFaculty at /homepageForFaculty URL prefix
app.use('/homepageForFaculty', express.static(path.join(baseDir, 'homepageForFaculty')));
app.use(express.static(path.join(baseDir,"homepageForFaculty","Dashboard")));
app.use(express.static(path.join(baseDir,"homepageForFaculty","requestForSubject")));
//Hod
app.use('/HodTask', express.static(path.join(baseDir, 'HodTask')));
app.use(express.static(path.join(baseDir,"HodTask")));
app.use(express.static(path.join(baseDir,"HodTask","HodDashboard")));
app.use(express.static(path.join(baseDir,"HodTask","EnterStudentDetails")));
app.use(express.static(path.join(baseDir,"HodTask","addBranchesAndSubjects")));
app.use(express.static(path.join(baseDir,"HodTask","viewFacultyRequests")));
app.use(express.static(path.join(baseDir,"HodTask","addAndChangeExams")));
app.use(express.static(path.join(baseDir,"HodTask","generateStudentReports")));
app.use(express.static(path.join(baseDir,"HodTask","viewMarksUpdateRequests")));
app.use(express.static(path.join(baseDir,"HodTask","GenerateCharts")));
app.use(express.static(path.join(baseDir,"HodTask","studentsDataAndPwd")));
//student
app.use('/studentsMarks', express.static(path.join(baseDir, 'studentsMarks')));
app.use(express.static(path.join(baseDir,"studentsMarks")));
//admin
app.use(express.static(path.join(baseDir,"admin")));
app.use(express.static(path.join(baseDir,"admin","UpdateDatabase")));
app.use(express.static(path.join(baseDir,"admin","academicDataManagement")));
app.use(express.static(path.join(baseDir,"admin","studentMarksAdmin")));
app.use(express.static(path.join(baseDir,"admin","studentProfilesAdmin")));
app.use(express.static(path.join(baseDir,"admin","resetPassword")));
//forgot password
app.use(express.static(path.join(baseDir,"ForgotPassword")));
app.use(express.static(path.join(baseDir,"ForgotPassword","resetSTFPassword")));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
var mysql = require("mysql2");
const exp = require("constants");
const multer = require("multer");
const fs = require("fs");
var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
    port: process.env.DB_PORT 
});

app.get("/",(req,res) =>
{
    res.sendFile(path.join(baseDir,"Home","index.html"));
}
);

// sessionStore.js
const sessionStore = {
  admin: new Map(),
  hod: new Map(),
  faculty: new Map(),
  student: new Map()
};
const crypto = require("crypto");

function generateSessionValue() {
  return crypto.randomBytes(32).toString("hex");
}

function createSession(role, id) {
  const key = `${role}:${id}`;
  const value = generateSessionValue();

  // overwrite old session automatically
  sessionStore[role].set(key, value);

  return {
    sessionValue: value
  };
}
function validateSession(role, id, sessionValue) {
  const key = `${role}:${id}`;
  const storedValue = sessionStore[role].get(key);

  if (!storedValue) return false;
  if (storedValue !== sessionValue) return false;
  
  return true;
}

//API'S
//--------------------------------------------------------------
//--------------------------------------------------------------
//LOGIN 

//1. Faculty Login
app.post("/TeacherLogin", (req, res) => {
    const facultyId = req.body.facultyId;
    const passwordOfTeacher = req.body.passwordOfTeacher;
    con.query(
        "SELECT * FROM faculty WHERE facultyId=? AND password=?",
        [facultyId, passwordOfTeacher],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Server error. Try again later." });
            }
            if (result.length > 0) {
                //Send facultyId to frontend
                const { sessionValue } = createSession("faculty", facultyId);
                console.log("Login successful for facultyId:", facultyId,"pwd:",passwordOfTeacher, "Session Key:", sessionValue);
                return res.json({
                    success: true,
                    facultyId: facultyId,
                    role: "faculty",
                    isLoggedIn: "true",
                    key: sessionValue,
                    redirectUrl: "/homepageForFaculty/requestForSubject/requestForSubject.html"
                });
            } else {
                return res.json({ success: false, message: "Invalid Faculty ID or Password." });
            }
        }
    );
});
//2. HOD Login
app.post("/loginToHodDashBoard", (req, res) => {
    const hodId = req.body.HodId;
    const passwordOfHod = req.body.passwordOfHod;

    con.query(
        "SELECT name, branch, year FROM hod_details WHERE hod_id=? AND password=? AND status = 'Approved'",
        [hodId, passwordOfHod],
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Server error. Try again later." });
            }
            if (result.length > 0) {
                //Send HOD details to the client
                const hodDetails = {
                    hodName: result[0].name,
                    hodBranch: result[0].branch,
                    hodYears: result[0].year.split(",")
                };
                const { sessionValue } = createSession("hod", hodId);
                console.log("Hod successful login:", hodDetails, passwordOfHod, sessionValue);
                return res.json({
                    success: true,
                    hodDetails: hodDetails,
                    role: "hod",
                    isLoggedIn: "true",
                    hodId: hodId,
                    key: sessionValue,
                    redirectUrl: "/HodTask/HodDashboard/HodDashboard.html"
                });
            } else {
                return res.json({ success: false, message: "Invalid HOD ID or Password." });
            }
        }
    );
});
//3. Admin Login
app.post("/adminLogin", (req, res) => {
    const adminId = req.body.idOfAdmin;
    const password = req.body.passwordOfAdmin;

    con.query(
        "SELECT * FROM admin WHERE id=? AND password=?",
        [adminId, password],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Server error. Try again later."
                });
            }

            if (result.length > 0) {
                const { sessionValue } = createSession("admin", adminId);
                console.log("login successful for admin: ", adminId, password, sessionValue);
                return res.json({
                    success: true,
                    isLoggedIn: "true",
                    role: "admin",
                    adminId: adminId,
                    key: sessionValue,
                    redirectUrl: "/admin.html"
                });
            } else {
                return res.json({
                    success: false,
                    message: "Invalid Admin ID or Password"
                });
            }
        }
    );
});
//4. Student Login
app.post("/studentCheckin", (req, res) => {
    const password = req.body.password;
    const stuHtno = req.body.htno;

    con.query(
        "SELECT * FROM student_profiles WHERE htno=? AND password=?",
        [stuHtno, password],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Server error. Try again later."
                });
            }

            if (result.length > 0) {
                const { sessionValue } = createSession("student", stuHtno);
                console.log("login success for student: ", stuHtno, password, sessionValue);
                return res.json({
                    success: true,
                    isLoggedIn: "true",
                    role: "student",
                    key: sessionValue,
                    redirectUrl: "/studentsMarks/studentsMarks.html",
                    studentDetails: {
                        htno: stuHtno
                    }
                });
            } else {
                return res.json({
                    success: false,
                    message: "Invalid HTNO or Year"
                });
            }
        }
    );
});
//-------------------------------------------------------------
//--------------------------------------------------------------
//NEW ACCOUNT CREATE

//1.Faculty Account Creation
app.post("/createTeacherAccount", (req, res) => {
    var teacherName = req.body.teacherName;
    var facultyId = req.body.facultyId;
    var emailOfTeacher = req.body.emailOfTeacher;
    var passwordOfTeacher = req.body.passwordOfTeacher;
    var reEnterPasswordTeacher = req.body.reEnterPasswordTeacher;

    // Password match validation
    if (passwordOfTeacher !== reEnterPasswordTeacher) {
        return res.json({ success: false, message: "Passwords do not match." });
    }

    // Check if teacher ID or Email already exists
    con.query(
        "SELECT * FROM faculty WHERE facultyId = ? OR email = ?",
        [facultyId, emailOfTeacher],
        (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.json({ success: false, message: "Database error. Please try again." });
            }

            if (results.length > 0) {
                return res.json({ success: false, message: "Faculty ID or Email already exists." });
            }

            // Insert new teacher account
            con.query(
                "INSERT INTO faculty (facultyId, name, email, password) VALUES (?, ?, ?, ?)",
                [facultyId, teacherName, emailOfTeacher, passwordOfTeacher],
                (err, result) => {
                    if (err) {
                        console.error("Insertion Error:", err);
                        return res.json({ success: false, message: "Error creating account. Please try again." });
                    }
                    return res.json({ success: true, message: "Teacher account created successfully!" });
                }
            );
        }
    );
});
//2.Hod Account Creation
app.post("/createHodAccount", (req, res) => {
    var yearOfHod = parseInt(req.body.yearOfHod);  
    var branchOfHod = req.body.branchOfHod;
    var hodName = req.body.hodName;
    var emailOfHod = req.body.emailOfHod;
    var passwordOfHod = req.body.passwordOfHod;
    var reEnterPassword = req.body.reEnterPassword;
    var hodId = req.body.hodId;

    // Check if yearOfHod is valid
    if (isNaN(yearOfHod)) {
        return res.json({ success: false, message: "Invalid Year. Please select a valid year." });
    }

    if (yearOfHod === 1) {
        branchOfHod = "ALL";  // No specific branch for 1st-year HOD
    }


    if (passwordOfHod !== reEnterPassword) {
        return res.json({ success: false, message: "Passwords do not match." });
    }

    // Check if HOD ID or Email already exists
    con.query(
        "SELECT * FROM hod_details WHERE hod_id = ? OR email = ?",
        [hodId, emailOfHod],
        (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.json({ success: false, message: "Database error. Please try again." });
            }

            if (results.length > 0) {
                return res.json({ success: false, message: "User already exists with this HOD ID or Email." });
            }

            // Insert new HOD record
            con.query(
                "INSERT INTO hod_details (year, branch, hod_id, name, email, password) VALUES (?, ?, ?, ?, ?, ?)",
                [yearOfHod, branchOfHod, hodId, hodName, emailOfHod, passwordOfHod],
                (err, result) => {
                    if (err) {
                        console.error("Database Insert Error:", err);
                        return res.json({ success: false, message: "Database error. Please try again." });
                    }
                    res.json({ success: true, message: "HOD Account Created Successfully.Contact Admin for activation." });
                }
            );
        }
    );
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//STUDENT TASKS

//1. Get student year using Hall Ticket Number.
app.get("/api/studentyear/:htno/:role", (req, res) => {
    const { htno, role } = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
    }
    const sql = `
        SELECT year
        FROM studentmarks
        WHERE htno = ?
        LIMIT 1
    `;

    con.query(sql, [htno], (err, results) => {
        if (err) {
            console.error("Error fetching student year:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No student found with this HTNO"
            });
        }

        res.json({
            success: true,
            year: results[0].year
        });
    });
});
//2. To get student marks
app.post("/studentDashboard/:year/:htno/:role", (req, res) => {
    const { year, htno, role } = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
    }

    if (!year || !htno) {
        return res.status(400).json({ error: "Invalid credentials." });
    }

    // Step 1: Get student's branch
    const getBranchQuery = `SELECT branch, name FROM studentmarks WHERE year = ? AND htno = ? LIMIT 1`;

    con.query(getBranchQuery, [year, htno], (branchErr, branchResults) => {
        if (branchErr) {
            console.error("Error fetching branch:", branchErr);
            return res.status(500).json({ error: "Error retrieving student branch." });
        }

        if (branchResults.length === 0) {
            return res.status(404).json({ error: "Invalid HTNO or Year" });
        }

        const branch = branchResults[0].branch;

        // Step 2: Get allowed exams from examsofspecificyearandbranch
        const getExamsQuery = `SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ? LIMIT 1`;

        con.query(getExamsQuery, [year, branch], (examErr, examResults) => {
            if (examErr) {
                console.error("Error fetching exams:", examErr);
                return res.status(500).json({ error: "Error retrieving exam details." });
            }

            if (examResults.length === 0) {
                return res.status(404).json({ error: "No exam mapping found for this branch/year." });
            }

           let examsJson;
try {
    examsJson = examResults[0].exams;

    // If MySQL returned string, parse it
    if (typeof examsJson === "string") {
        examsJson = JSON.parse(examsJson);
    }
} catch (parseErr) {
    console.error("Error parsing exams JSON:", parseErr);
    return res.status(500).json({ error: "Invalid exam mapping format." });
}


            // Extract exam columns (["Unit_test_1", "Mid_1", ...])
            const examColumns = Object.keys(examsJson).map(exam => `\`${exam}\``);

            if (examColumns.length === 0) {
                return res.status(404).json({ error: "No exam columns found for this branch/year." });
            }

            // Step 3: Fetch student data with only those columns
            const getStudentQuery = `
                SELECT year, branch, htno, name, subject, ${examColumns.join(", ")}
                FROM studentmarks
                WHERE year = ? AND htno = ? AND branch = ?
            `;

            con.query(getStudentQuery, [year, htno, branch], (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Server error. Try again later." });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: "No student records found." });
                }

                const studentInfo = {
                    year: results[0].year,
                    branch: results[0].branch,
                    htno: results[0].htno,
                    name: results[0].name,
                    subjects: results.map(row => {
                        let marks = {};
                        Object.keys(examsJson).forEach(exam => {
                            marks[exam] = row[exam] !== null ? row[exam] : "N/A";
                        });
                        return { subject: row.subject, marks };
                    }),
                };

                res.json(studentInfo);
            });
        });
    });
});
//3. To get student basic details such as name, branch, year using htno
app.get("/studentBasic/:htno/:role", (req, res) => {
    const { htno, role } = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
    }
    if(!htno || !role) {
        return res.status(401).json({ success: false, message: "Invalid credentials"});
    }
    const q = `SELECT htno, name, branch, year FROM studentmarks WHERE htno = ? LIMIT 1`;

    con.query(q, [htno], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ success: false });
        }
        res.json(rows[0]);
    });
});
//4. To get student personal profile details
app.get("/studentProfile/:htno/:role", (req, res) => {
    const {htno, role} = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
    }
    if(!htno || !role) {
        return res.status(401).json({ success: false, message: "Invalid credentials"});
    }
    con.query(
        "SELECT * FROM student_profiles WHERE htno = ? LIMIT 1",
        [htno],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false });
            }

            if (rows.length === 0) {
                return res.json({ exists: false });
            }

            res.json({ exists: true, profile: rows[0] });
        }
    );
});
//5.Store and retrieve student profile photo
const upload = multer({
    storage: multer.memoryStorage(), // store image in memory
    limits: {
        fileSize: 100 * 1024 // max 100 KB
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files are allowed"), false);
        } else {
            cb(null, true);
        }
    }
});
app.post("/studentProfile/photo/:htno/:role",upload.single("profile_photo"),(req, res) => {

        const {htno, role} = req.params;
        const sessionValue = req.headers["x-session-key"];
        if (!sessionStore[role]) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }
        const valid = validateSession(role, htno, sessionValue);
        if (!valid) {
                return res.status(401).json({ success: false, message: "Invalid session" });
        }
        if(!htno || !role) {
            return res.status(401).json({ success: false, message: "Invalid credentials"});
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        if (req.file.size < 20 * 1024 || req.file.size > 100 * 1024) {
            return res.status(400).json({
                success: false,
                message: "Image must be between 20 KB and 100 KB"
            });
        }

        const query = `
            UPDATE student_profiles
            SET profile_photo = ?
            WHERE htno = ?
        `;

        con.query(query, [req.file.buffer, htno], err => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to save image"
                });
            }

            res.json({
                success: true,
                message: "Profile photo saved successfully"
            });
        });
    }
);
app.get("/studentProfile/photo/:htno/:role", (req, res) => {
    const { htno, role } = req.params;
    const sessionValue = req.query.session;
    if (!sessionStore[role]) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
                return res.status(401).json({ success: false, message: "Invalid session" });
    }
    if(!htno || !role) {
            return res.status(401).json({ success: false, message: "Invalid credentials"});
    }

    const query = `
        SELECT profile_photo
        FROM student_profiles
        WHERE htno = ?
        LIMIT 1
    `;

    con.query(query, [htno], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).end();
        }

        if (!results.length || !results[0].profile_photo) {
            // No image → return 404 so frontend can fallback
            return res.status(404).end();
        }

        const imageBuffer = results[0].profile_photo;

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        res.send(imageBuffer);
    });
});
//6. Save student profile details
app.post("/studentProfile/save/:role", (req, res) => {

    const { htno } = req.body;
    const { role} = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    const valid = validateSession(role, htno, sessionValue);
    if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
    }
    if(!htno || !role) {
        return res.status(401).json({ success: false, message: "Invalid credentials"});
    }

    // Remove empty / undefined fields
    const allowedFields = [
        "full_name", "batch", "dob", "gender", "admission_type", "current_status",
        "student_mobile", "email", "current_address", "permanent_address",
        "father_name", "mother_name", "parent_mobile",
        "guardian_name", "guardian_relation", "guardian_mobile",
        "blood_group", "nationality", "religion"
    ];

    const data = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== "") {
            data[field] = req.body[field];
        }
    });

    // If nothing to save
    if (Object.keys(data).length === 0) {
        return res.json({ success: true, message: "Nothing to update" });
    }
    if (!data.current_status) {
        data.current_status = "Active";
    }

    // Check if profile exists
    con.query(
        "SELECT id FROM student_profiles WHERE htno = ?",
        [htno],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false });
            }

            if (rows.length === 0) {
                // INSERT (dynamic)
                const columns = Object.keys(data).join(", ");
                const placeholders = Object.keys(data).map(() => "?").join(", ");
                const values = Object.values(data);

                const insertQuery = `
                    INSERT INTO student_profiles (htno, ${columns})
                    VALUES (?, ${placeholders})
                `;

                con.query(insertQuery, [htno, ...values], err => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false });
                    }
                    res.json({ success: true, message: "Profile saved successfully" });
                });

            } else {
                // UPDATE (dynamic)
                const setClause = Object.keys(data)
                    .map(field => `${field} = ?`)
                    .join(", ");

                const updateQuery = `
                    UPDATE student_profiles
                    SET ${setClause}
                    WHERE htno = ?
                `;

                con.query(updateQuery, [...Object.values(data), htno], err => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false });
                    }
                    res.json({ success: true, message: "Profile updated successfully" });
                });
            }
        }
    );
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//FACULTY TASKS

//1. REQUEST FOR SUBJECT
// Fetch all branches
app.get("/branches/:role/:facultyId", (req, res) => {
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = "SELECT DISTINCT branch_name FROM branches";
    con.query(query, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
// Fetch all subjects
app.get("/subjects/:role/:facultyId", (req, res) => {
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = "SELECT DISTINCT subject_name FROM subjects";
    con.query(query, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
//to display status of request for faculty
app.get("/getRequests/:role", (req, res) => {
    const facultyId = req.query.facultyId;
    const { role } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = "SELECT facultyName, subject, branch, year, status FROM faculty_requests where faculty_Id = ? ";
    
    con.query(query,[facultyId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
// Fetch branches for a specific year
app.get("/branches/:year/:role/:facultyId", (req, res) => {
    const year = req.params.year;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];
    if (!facultyId ||  !role || !year) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = "SELECT DISTINCT branch_name FROM branches WHERE year = ?";
    
    con.query(query, [year], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
// Fetch subjects based on year and branch
app.get("/subjects/:year/:branch/:role/:facultyId", (req, res) => {
    const { year, branch } = req.params;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = "SELECT subject_name FROM subjects WHERE year = ? AND branch_name = ?";
    
    con.query(query, [year, branch], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
// Store faculty requests in the database
app.post("/sendRequest/:role", (req, res) => {

    const { year, branch, subject, facultyId } = req.body;
    const { role } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = `
        INSERT INTO faculty_requests (faculty_Id, facultyName, year, branch, subject, status)
        SELECT f.facultyId, f.name, ?, ?, ?, 'Pending'
        FROM faculty f
        WHERE f.facultyId = ?;
    `;

    con.query(query, [year, branch, subject, facultyId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json({ message: "Request sent successfully" });
    });
});
// Separate GET route to serve home page(dashboard)
app.get("/home/:role/:facultyId", (req, res) => {
    const { role, facultyId } = req.params;
    const sessionValue = req.query.sessionValue;
    if (!facultyId ||  !role || !sessionValue) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const filePath = path.join(__dirname, "homepageForFaculty", "Dashboard", "home.html");
    res.sendFile(filePath);
});
//------------------------------------------------------
//2. FACULTY DASHBOARD
//to display faculty details in the dashboard
app.post("/getFacultyDetails/:role", (req, res) => {
    const {year, branch, subject, facultyId} = req.body;
    const { role } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const sqlQuery = "SELECT * FROM faculty_requests WHERE faculty_Id = ? AND year = ? AND branch = ? AND subject = ? AND status = 'Approved'";

    con.query(sqlQuery, [facultyId, year, branch, subject], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.length > 0) {
            const faculty = result[0];
            return res.json({
                success: true,
                facultyName: faculty.facultyName,
                subject: faculty.subject,
                branch: faculty.branch,
                year: faculty.year
            });
        } else {
            return res.status(404).json({ success: false, message: "No faculty details found" });
        }
    });
});

//3. ENTER MARKS
// Route to fetch student details 
app.get("/getStudents/:role/:facultyId", (req, res) => {
    const { year, branch } = req.query;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    con.query("SELECT htno, full_name FROM student_profiles WHERE branch = ? AND year = ?", [branch, year], (err, results) => {
        if (err) {
            console.error("Error fetching student data:", err);
            res.status(500).json({ success: false, message: "Database error" });
        } else {
            res.json(results);
        }
    });
});
// Route to save student marks
app.post("/saveMarks/:role/:facultyId", async (req, res) => {
    const { exam, subject } = req.body;
     const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !exam || !subject ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const marksData = Object.keys(req.body)
        .filter(k => k.startsWith("marks_"))
        .map(k => ({
            htno: k.split("_")[1],
            marks: req.body[k]
        }));

    if (marksData.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No marks provided"
        });
    }

    try {
        for (const { htno, marks } of marksData) {

            /* Get student info from student_profiles */
            const [studentRows] = await con.promise().query(
                `SELECT full_name, year, branch
                 FROM student_profiles
                 WHERE htno = ?`,
                [htno]
            );

            if (studentRows.length === 0) {
                throw new Error(`Student not found: ${htno}`);
            }

            const { full_name, year, branch } = studentRows[0];

            /* Check if subject row exists */
            const [existing] = await con.promise().query(
                `SELECT 1 FROM studentmarks
                 WHERE htno = ? AND year = ? AND branch = ? AND subject = ?
                 LIMIT 1`,
                [htno, year, branch, subject]
            );

            if (existing.length > 0) {
                /* Update exam marks */
                await con.promise().query(
                    `UPDATE studentmarks
                     SET \`${exam}\` = ?
                     WHERE htno = ? AND year = ? AND branch = ? AND subject = ?`,
                    [marks, htno, year, branch, subject]
                );
            } else {
                /* Insert new subject row */
                await con.promise().query(
                    `INSERT INTO studentmarks
                     (year, branch, htno, name, subject, \`${exam}\`)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [year, branch, htno, full_name, subject, marks]
                );
            }
        }

        res.json({ success: true });

    } catch (err) {
        console.error("SAVE MARKS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Error saving marks"
        });
    }
});
//this is to retrive the exams based on the year and branch
app.get("/getExams/:role/:facultyId", (req, res) => {

    const { year, branch } = req.query;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";
    con.query(query, [year, branch], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!result.length || !result[0].exams) return res.json([]);

        try {
            const examsJSON =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            res.json(Object.keys(examsJSON)); 
        } catch (e) {
            res.status(500).json({ error: "Invalid exam data" });
        }
    });
});
//to get max marks for all exams for a given year and branch
app.get("/getExamMaxMarksAll/:role/:facultyId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = `
        SELECT exams
        FROM examsofspecificyearandbranch
        WHERE year = ? AND branch = ?
    `;

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exam max marks:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!result.length || !result[0].exams) {
            return res.json({});
        }

        try {
            const exams =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            // exams = { MID1: 30, QUIZ1: 10 }
            res.json(exams);
        } catch (e) {
            console.error("Error parsing exams JSON:", e);
            res.status(500).json({ error: "Invalid exams format" });
        }
    });
});

//4. VIEW MARKS
//to view marks
app.get("/getStudentMarks/:role/:facultyId", (req, res) => {
   
    const examColumn = req.query.exam;  // Get exam name from frontend
    const year = req.query.year;  // Get year from frontend
    const branch = req.query.branch;  // Get branch from frontend
    const subject = req.query.subject;  // Get subject from frontend

    if (!examColumn) {
        return res.status(400).json({ success: false, message: "Exam type is required" });
    }
      const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    let sqlQuery = `SELECT htno, name, ${examColumn} FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;

    con.query(sqlQuery, [branch, year, subject], (err, results) => {
        if (err) {
            console.error("Error fetching student data:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json(results);
    });
});

//5. EDIT MARKS
// Get student marks for selected exam
app.get("/getStudentMarksForEditing/:role/:facultyId", (req, res) => {
    const { exam, year, branch, subject } = req.query;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !exam) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    let query = `SELECT htno, name, ?? FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;
    
    con.query(query, [exam, branch, year, subject], (err, results) => {
        if (err) {
            console.error("Error fetching student marks:", err);
            res.status(500).json({ success: false, message: "Database error" });
        } else {
            res.json(results);
        }
    });
});
// Faculty requests HOD approval for marks update
app.post("/requestHodToUpdateMarks/:role", (req, res) => {
    let updateRequests = req.body.requests;
    let branch = req.body.selectedBranch; 
    let year = req.body.selectedYear; 
    let subject = req.body.selectedSubject; 
    let facultyId = req.body.facultyId; 
    const { role } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

   let query = `
    INSERT INTO pending_marks_updates
    (htno, name, year, branch, subject, exam, old_marks, new_marks, reason, requested_by, request_status)
    VALUES ?
    `;

    let values = updateRequests.map(r => [
        r.htno,
        r.name,
        year,
        branch,
        subject,
        r.exam,
        r.oldMarks,
        r.newMarks,
        r.reason,
        facultyId,
        'Pending'
    ]);


    if (values.length === 0) {
        return res.status(400).json({ success: false, message: "No valid marks provided." });
    }

    con.query(query, [values], (err, result) => {
        if (err) {
            console.error("Error inserting into pending_marks_updates:", err);
            res.status(500).json({ success: false, message: "Database error" });
        } else {
            res.json({ success: true, message: "Request sent to HOD" });
        }
    });
});

//6. VIEW OVERALL MARKS
// API to fetch all students with dynamic exam columns
app.get("/getOverallMarks/:role/:facultyId", (req, res) => {
    const { branch, year, subject } = req.query;
    const { role, facultyId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!facultyId ||  !role || !year || !branch || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, facultyId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const examQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(examQuery, [year, branch], (err, examResult) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (examResult.length === 0) {
            return res.status(404).json({ success: false, message: "No exams found for this year and branch" });
        }

        //Handle both string and object cases
        let examsData = examResult[0].exams;
        let examsObj;

        if (typeof examsData === "string") {
            try {
                examsObj = JSON.parse(examsData);
            } catch (parseError) {
                console.error("Error parsing exams JSON string:", parseError);
                return res.status(500).json({ success: false, message: "Invalid exams JSON format" });
            }
        } else if (typeof examsData === "object" && examsData !== null) {
            examsObj = examsData;
        } else {
            return res.status(500).json({ success: false, message: "Unexpected exams data format" });
        }

        const examColumns = Object.keys(examsObj);

        if (examColumns.length === 0) {
            return res.status(404).json({ success: false, message: "No exam columns found" });
        }

        // Build SQL dynamically
        const selectedColumns = ["htno", "name", ...examColumns].join(", ");
        const sqlQuery = `SELECT ${selectedColumns} FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;

        con.query(sqlQuery, [branch, year, subject], (err, results) => {
            if (err) {
                console.error("Error fetching student marks:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            res.json(results);
        });
    });
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//ADMIN TASKS

//1. ADMIN HOME PAGE
// Fetch All HOD Requests
app.get("/getHodRequests/:role/:adminId", (req, res) => {
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    con.query("SELECT hod_id, name, email, year, branch, status FROM hod_details", (err, results) => {
        if (err) {
            console.error("Error fetching HOD requests:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json(results);
        }
    });
});
// Update HOD Status (Approve/Reject)
app.post("/updateHodStatus/:role/:adminId", (req, res) => {
    const { hod_id, newStatus } = req.body;
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !hod_id || !newStatus) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    con.query("UPDATE hod_details SET status = ? WHERE hod_id = ?", [newStatus, hod_id], (err, result) => {
        if (err) {
            console.error("Error updating status:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json({ message: `Status updated to ${newStatus}` });
        }
    });
});

//2. UPDATE DATABASE(FACULTY AND HOD MNGMNT)
// Fetch all faculty or hod data (no year/branch filter)
app.get("/api/get-table-data-simple/:role/:adminId", (req, res) => {
    const { table } = req.query;
     const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!["faculty", "hod_details"].includes(table)) {
        return res.status(400).json({ error: "Invalid table" });
    }

    let query = "";

    if (table === "faculty") {
        query = `
            SELECT
                facultyId,
                name,
                email
            FROM faculty
        `;
    }

    if (table === "hod_details") {
        query = `
            SELECT
                hod_id,
                name,
                email,
                year,
                branch,
                status
            FROM hod_details
        `;
    }

    con.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// Update specific record (faculty or HOD)
app.post("/api/update/:role/:adminId/:table", (req, res) => {
  const { table } = req.params;
  const { row } = req.body;
   const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !table) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

  const idField = table === "faculty" ? "facultyId" : "hod_id";
  const id = row[idField];
  delete row[idField];

  const setClause = Object.keys(row).map(k => `${k}=?`).join(", ");
  const values = Object.values(row);

  con.query(`UPDATE ${table} SET ${setClause} WHERE ${idField}=?`, [...values, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Row updated successfully." });
  });
});
// Delete specific record (faculty or HOD)
app.delete("/api/delete-row/:table/:id/:role/:adminId", (req, res) => {
  const { table, id } = req.params;
   const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !table || !id) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

  const idField = table === "faculty" ? "facultyId" : "hod_id";

  con.query(`DELETE FROM ${table} WHERE ${idField}=?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Row deleted successfully." });
  });
});

//3. ACADEMIC DATA MNGMNT
// Fetch branches based on selected year
app.get("/api/branches/:role/:adminId/:year", (req, res) => {
    const year = req.params.year;
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !year) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!year) {
        return res.status(400).json({ error: "Year is required" });
    }

    const sql = "SELECT branch_name FROM branches WHERE year = ?";
    con.query(sql, [year], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const branches = results.map(row => row.branch_name);
        res.json({ branches });
    });
});
//Delete semester data
app.post("/api/delete-semester-data/:role/:adminId", (req, res) => {
  const { year, branch } = req.body;
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

  // Tables from which data will be deleted
  const tables = [
    "branches",
    "examsofspecificyearandbranch",
    "faculty_requests",
    "pending_marks_updates",
    "studentmarks",
    "subjects"
  ];

  // Build delete queries
  const queries = tables.map((table) => {
    return new Promise((resolve, reject) => {
      let sql = "";
      if (table === "branches") {
        sql = `DELETE FROM branches WHERE year = ? AND branch_name = ?`;
      } else if (table === "examsofspecificyearandbranch") {
        sql = `DELETE FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?`;
      } else if (table === "faculty_requests") {
        sql = `DELETE FROM faculty_requests WHERE year = ? AND branch = ?`;
      } else if (table === "pending_marks_updates") {
        sql = `DELETE FROM pending_marks_updates WHERE year = ? AND branch = ?`;
      } else if (table === "studentmarks") {
        sql = `DELETE FROM studentmarks WHERE year = ? AND branch = ?`;
      } else if (table === "subjects") {
        sql = `DELETE FROM subjects WHERE year = ? AND branch_name = ?`;
      }

      con.query(sql, [year, branch], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  Promise.all(queries)
    .then(() => res.json({ message: `Data for year ${year}, branch ${branch} deleted successfully.` }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

//4. RESET PASSWORD FOR FACULTY AND HOD'S
// Fetch password reset requests from faculty and HODs
app.get("/admin/reset-requests/:role/:adminId", async (req, res) => {
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    try {

        const [faculty] = await con.promise().query(`
            SELECT facultyId AS id, name, email, 'faculty' AS role
            FROM faculty
            WHERE reset_password = 'yes'
        `);

        const [hods] = await con.promise().query(`
            SELECT hod_id AS id, name, email, 'hod' AS role
            FROM hod_details
            WHERE reset_password = 'yes'
        `);

        res.json([...faculty, ...hods]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reset requests" });
    }
});
// Reset password for faculty or HOD
app.post("/admin/reset-password/:roleOfUser/:adminId", async (req, res) => {

    const { role, id, newPassword } = req.body;
    const { roleOfUser, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role || !roleOfUser || !id || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[roleOfUser]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(roleOfUser, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    try {

        if (role === "faculty") {
            await con.promise().query(`
                UPDATE faculty
                SET password = ?, reset_password = 'reset_password'
                WHERE facultyId = ?
            `, [newPassword, id]);
        }

        if (role === "hod") {
            await con.promise().query(`
                UPDATE hod_details
                SET password = ?, reset_password = 'reset_password'
                WHERE hod_id = ?
            `, [newPassword, id]);
        }

        res.json({ message: "Password reset enabled successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Reset failed" });
    }
});

//5. STUDENT PROFILES (PERSONAL DATA)
// Fetch student profiles based on year and branch
app.get("/admin/student-profiles/:role/:adminId", async (req, res) => {
    const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    try {
        const { year, branch } = req.query;

        if (!year || !branch) {
            return res.status(400).json({
                success: false,
                message: "Invalid request parameters"
            });
        }

        const [profiles] = await con.promise().query(
            `
            SELECT
                htno,
                full_name,
                year,
                branch,
                batch,
                dob,
                gender,
                admission_type,
                current_status,
                student_mobile,
                email,
                current_address,
                permanent_address,
                father_name,
                mother_name,
                parent_mobile,
                guardian_name,
                guardian_relation,
                guardian_mobile,
                blood_group,
                nationality,
                religion,
                profile_photo
            FROM student_profiles
            WHERE year = ? AND branch = ?
            ORDER BY htno
            `,
            [year, branch]
        );

        res.json(profiles);

    } catch (err) {
        console.error("ADMIN STUDENT PROFILES ERROR:", err);
        res.status(500).json({
            error: "Failed to fetch student profiles"
        });
    }
});
//to get students photos
app.get("/admin/studentProfile/photo/:htno/:role/:adminId", (req, res) => {
    const { htno, role, adminId } = req.params;
    const sessionValue = req.query.sessionValue;
    if(!htno || !role || !adminId) {
            return res.status(401).json({ success: false, message: "Invalid credentials"});
    }
    if (!sessionStore[role]) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }
    const valid = validateSession(role, adminId, sessionValue);
    if (!valid) {
                return res.status(401).json({ success: false, message: "Invalid session" });
    }
    

    const query = `
        SELECT profile_photo
        FROM student_profiles
        WHERE htno = ?
        LIMIT 1
    `;

    con.query(query, [htno], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).end();
        }

        if (!results.length || !results[0].profile_photo) {
            // No image → return 404 so frontend can fallback
            //return res.status(404).end();
            const defaultImagePath = path.join(__dirname, "admin", "studentProfilesAdmin", "default.png");
            return res.sendFile(defaultImagePath);
        }

        const imageBuffer = results[0].profile_photo;

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        res.send(imageBuffer);
    });
});

//6. STUDENT MARKS
// Fetch student marks based on year and branch
app.post("/admin/student-marks/:role/:adminId", async (req, res) => {
    const { branch, year} = req.query;
     const { role, adminId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!adminId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, adminId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const examQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(examQuery, [year, branch], (err, examResult) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (examResult.length === 0) {
            return res.status(404).json({ success: false, message: "No exams found for this year and branch" });
        }

        // Handle both string and object cases
        let examsData = examResult[0].exams;
        let examsObj;

        if (typeof examsData === "string") {
            try {
                examsObj = JSON.parse(examsData);
            } catch (parseError) {
                console.error("Error parsing exams JSON string:", parseError);
                return res.status(500).json({ success: false, message: "Invalid exams JSON format" });
            }
        } else if (typeof examsData === "object" && examsData !== null) {
            examsObj = examsData;
        } else {
            return res.status(500).json({ success: false, message: "Unexpected exams data format" });
        }

        const examColumns = Object.keys(examsObj);

        if (examColumns.length === 0) {
            return res.status(404).json({ success: false, message: "No exam columns found" });
        }

        // Build SQL dynamically
        const selectedColumns = ["htno", "name","subject", ...examColumns].join(", ");
        const sqlQuery = `SELECT ${selectedColumns} FROM studentmarks WHERE branch = ? AND year = ?`;

        con.query(sqlQuery, [branch, year], (err, results) => {
            if (err) {
                console.error("Error fetching student marks:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json(results);
        });
    });
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//FORGOT PASSWORD AND RESET PASSWORD

//1. Verify User
app.post("/auth/verify-user", (req, res) => {
    const { role, id } = req.body;

    let sql, params;

    if (role === "faculty") {
        sql = "SELECT facultyId FROM faculty WHERE facultyId = ?";
        params = [id];
    }
    else if (role === "hod") {
        sql = "SELECT hod_id FROM hod_details WHERE hod_id = ?";
        params = [id];
    }
    else if (role === "student") {
        sql = `
            SELECT htno
            FROM student_profiles
            WHERE htno = ?
        `;
        params = [id];
    }
    else {
        return res.json({ success: false });
    }

    con.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        if (!rows.length) return res.json({ success: false });
        res.json({ success: true });
    });
});
//2. Send Reset Request
app.post("/auth/request-reset", (req, res) => {
    const { role, id } = req.body;

    let sql, params;

    if (role === "faculty") {
        sql = `
            UPDATE faculty
            SET reset_password = 'yes'
            WHERE facultyId = ?
        `;
        params = [id];
    }
    else if (role === "hod") {
        sql = `
            UPDATE hod_details
            SET reset_password = 'yes'
            WHERE hod_id = ?
        `;
        params = [id];
    }
    else if (role === "student") {
        sql = `
            UPDATE student_profiles
            SET reset_password = 'yes'
            WHERE htno = ?
        `;
        params = [id];
    }
    else {
        return res.json({ success: false });
    }

    con.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ success: false });
        if (!result.affectedRows) return res.json({ success: false });
        res.json({ success: true });
    });
});
//3. Verify User for resetting pwd
app.post("/api/reset/verify-user", (req, res) => {
    const { role, userId } = req.body;

    let table, idCol;
    if (role === "faculty") { table = "faculty"; idCol = "facultyId"; }
    else if (role === "hod") { table = "hod_details"; idCol = "hod_id"; }
    else if (role === "student") { table = "student_profiles"; idCol = "htno"; }
    else return res.json({ success: false });

    con.query(
        `SELECT reset_password FROM ${table} WHERE ${idCol}=?`,
        [userId],
        (err, r) => {
            if (err || !r.length)
                return res.json({ success: false, message: "Invalid user" });

            if (r[0].reset_password !== "reset_password")
                return res.json({ success: false, message: "Reset not allowed" });

            res.json({ success: true });
        }
    );
});
//4. Verifying Temporary pwd
app.post("/api/reset/verify-temp-password", (req, res) => {
    const { role, userId, tempPassword } = req.body;

    let table, idCol;
    if (role === "faculty") { table = "faculty"; idCol = "facultyId"; }
    else if (role === "hod") { table = "hod_details"; idCol = "hod_id"; }
    else { table = "student_profiles"; idCol = "htno"; }

    con.query(
        `SELECT password FROM ${table} WHERE ${idCol}=?`,
        [userId],
        (err, r) => {
            if (err || !r.length || r[0].password !== tempPassword)
                return res.json({ success: false, message: "Invalid temporary password" });

            res.json({ success: true });
        }
    );
});
//5. Update Pwd
app.post("/api/reset/update-password", (req, res) => {
    const { role, userId, newPassword } = req.body;

    let table, idCol;
    if (role === "faculty") { table = "faculty"; idCol = "facultyId"; }
    else if (role === "hod") { table = "hod_details"; idCol = "hod_id"; }
    else { table = "student_profiles"; idCol = "htno"; }

    con.query(
        `UPDATE ${table}
         SET password=?, reset_password='no'
         WHERE ${idCol}=?`,
        [newPassword, userId],
        err => {
            if (err)
                return res.json({ success: false, message: "Update failed" });

            res.json({ success: true, message: "Password updated successfully" });
        }
    );
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//HOD TASKS

//1. HOD DASHBOARD - only logout

//2. ADDING BRANCHES AND SUBJECTS
//To get existing branches and subjects
app.get("/hod/branches-subjects/:role/:hodId", async (req, res) => {
    const { year, hodBranch } = req.query;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !hodBranch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const db = con.promise();

    try {
        const [branches] = await db.query(
            `SELECT branch_name
             FROM branches
             WHERE year = ? AND branch_name LIKE ?`,
            [year, `${hodBranch}%`]
        );

        const [subjects] = await db.query(
            `SELECT branch_name, subject_name
             FROM subjects
             WHERE year = ? AND branch_name LIKE ?
             ORDER BY branch_name`,
            [year, `${hodBranch}%`]
        );

        const subjectMap = {};
        subjects.forEach(r => {
            if (!subjectMap[r.branch_name]) {
                subjectMap[r.branch_name] = [];
            }
            subjectMap[r.branch_name].push(r.subject_name);
        });

        res.json({
            sections: branches.map(b => ({
                name: b.branch_name,
                subjects: subjectMap[b.branch_name] || []
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load data" });
    }
});
//Save subjects and sections of a branch
app.post("/saveSubjects/:role/:hodId", async (req, res) => {
    const {
        year,
        newSections = [],
        selectedSections = [],
        newSubjects = []
    } = req.body;
    
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    if (!year) {
        return res.status(400).json({ error: "Year required" });
    }

    if (!selectedSections.length && newSubjects.length) {
        return res.status(400).json({
            error: "Select at least one section to add subjects"
        });
    }

    const db = con.promise();

    try {
        /* Insert new sections safely */
        for (const section of newSections) {
            await db.query(
                `INSERT IGNORE INTO branches (year, branch_name)
                 VALUES (?, ?)`,
                [year, section]
            );
        }

        /* Insert new subjects ONLY into selected sections */
        for (const section of selectedSections) {
            for (const subject of newSubjects) {
                await db.query(
                    `INSERT IGNORE INTO subjects (year, branch_name, subject_name)
                     VALUES (?, ?, ?)`,
                    [year, section, subject]
                );
            }
        }

        res.json({ success: true });

    } catch (err) {
        console.error("SAVE SUBJECTS ERROR:", err);
        res.status(500).json({ error: "Failed to save data" });
    }
});
//To delete a section and its subjects
app.post("/deleteSection/:role/:hodId", async (req, res) => {
    const { year, section } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const db = con.promise();

    try {
        await db.query(
            "DELETE FROM subjects WHERE year = ? AND branch_name = ?",
            [year, section]
        );

        await db.query(
            "DELETE FROM branches WHERE year = ? AND branch_name = ?",
            [year, section]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("DELETE SECTION ERROR:", err);
        res.status(500).json({ error: "Failed to delete section" });
    }
});
//To delete subjects of a section
app.post("/deleteSubjects/:role/:hodId", async (req, res) => {
    const { year, items } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const db = con.promise();

    try {
        for (const { section, subject } of items) {
            await db.query(
                `DELETE FROM subjects
                 WHERE year = ? AND branch_name = ? AND subject_name = ?`,
                [year, section, subject]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error("DELETE SUBJECT ERROR:", err);
        res.status(500).json({ error: "Failed to delete subjects" });
    }
});

//3. FACULTY REQUESTS 
//retrive branches
app.get("/getbranches/:role/:hodId/:year/:branch", (req, res) => {
    const { year,branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    let query;
    let params;

    if (year === "1") {
        // Fetch only 1st-year branches
        
        query = "SELECT DISTINCT branch_name FROM branches WHERE year = ?";
        params = [1];
    } else {
        // Fetch only HOD-related branches for other years
        
        query = "SELECT branch_name FROM branches WHERE year = ? AND branch_name LIKE ?";
        params = [year, `%${branch}%`];
    }

    con.query(query, params, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
//load faculty requests
app.get("/hodRequests/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query = "SELECT * FROM faculty_requests WHERE year = ? AND branch = ?";
    
    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});
//to update status by hod
app.post("/updateRequestStatus/:role/:hodId", (req, res) => {
    const { facultyId, status, year, branch, subject } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!facultyId || !status || !year || !branch || !subject) {
        console.error("Missing required fields:", { facultyId, status, year, branch, subject });
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
        UPDATE faculty_requests 
        SET status = ? 
        WHERE faculty_Id = ? AND year = ? AND branch = ? AND subject = ?`;

    con.query(query, [status, facultyId, year, branch, subject], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.affectedRows === 0) {
            console.warn("No matching record found for:", { facultyId, year, branch, subject });
            return res.status(404).json({ error: "No matching record found" });
        }

        res.json({ message: `Request ${status} successfully!` });
    });
});

//4. STUDENT DETAILS
//Entering sutdent details such as htno and name by hod 
app.post("/saveData/:role/:hodId", (req, res) => {
    const students = req.body.students;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!students || students.length === 0) {
        return res.status(400).send("No student data received.");
    }

    const insertValues = students.map(s => [
        s.htno,
        s.name,
        s.branch,
        s.year,
        "12345",               // default password (first time only)
        "reset_password"       // first login only
    ]);

    const query = `
        INSERT INTO student_profiles
        (htno, full_name, branch, year, password, reset_password)
        VALUES ?
        ON DUPLICATE KEY UPDATE
           year = VALUES(year)
    `;
    //we can also update the branch like year as above
    con.query(query, [insertValues], (err) => {
        if (err) {
            console.error("Student profile save error:", err);
            return res.status(500).send("Failed to save student profiles.");
        }

        res.send("Student profiles saved successfully.");
    });
});
//retriving student details such as htno and name by hod
app.get("/getData/:role/:hodId", (req, res) => {
    let branch = req.query.branch;
    let year = req.query.year;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!branch || !year) {
        return res.status(400).json({ error: "Please provide both branch and year." });
    }

    con.query(
        "SELECT htno, full_name FROM student_profiles WHERE branch = ? AND year = ?",
        [branch, year],
        (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ error: "Error fetching data" });
            }
            res.json(results);
        }
    );
});

//5. ADD AND CHANGE EXAMS
//to get exam columns from examsofspecificyearandbranch table
app.get("/getExamColumns/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    const query =
        "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0 || !result[0].exams) {
            return res.json([]);
        }

        try {
            const examsJSON =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            //  RETURN EXAM NAMES, NOT MARKS
            const examNames = Object.keys(examsJSON);

            res.json(examNames);
        } catch (e) {
            console.error("Error parsing exams JSON:", e);
            res.status(500).send("Error processing exam data");
        }
    });
});
// Add a New Exam Column to studentMarks
app.post("/addExamToDatabase/:role/:hodId", (req, res) => {
    const { year, branch, examNameWithSpaces, maxMarks } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch || !examNameWithSpaces || !maxMarks) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    // CamelCase, no spaces, no underscores
    const examName = examNameWithSpaces.replace(/\s+/g, "");

    const getQuery =
        "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(getQuery, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).send("Database error");
        }

        let examsJSON = {};

        if (result.length > 0 && result[0].exams) {
            try {
                examsJSON = typeof result[0].exams === "object"
                    ? result[0].exams
                    : JSON.parse(result[0].exams);
            } catch (e) {
                console.error("Error parsing exams JSON:", e);
                return res.status(500).send("Invalid exams JSON");
            }
        }

        // 🚫 Prevent duplicate exam
        if (examsJSON[examName]) {
            return res.status(409).send("Exam already exists for this section");
        }

        //Store exam with max marks
        examsJSON[examName] = parseInt(maxMarks);

        const saveQuery =
            result.length > 0
                ? "UPDATE examsofspecificyearandbranch SET exams = ? WHERE year = ? AND branch = ?"
                : "INSERT INTO examsofspecificyearandbranch (exams, year, branch) VALUES (?, ?, ?)";

        const params =
            result.length > 0
                ? [JSON.stringify(examsJSON), year, branch]
                : [JSON.stringify(examsJSON), year, branch];

        con.query(saveQuery, params, (dbErr) => {
            if (dbErr) {
                console.error("Error saving exams:", dbErr);
                return res.status(500).send("Error saving exam data");
            }

            // ---- Student Marks table column creation ----
            const checkColumnQuery = `
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'studentmarks' AND COLUMN_NAME = ?`;

            con.query(checkColumnQuery, [examName], (colErr, colRes) => {
                if (colErr) {
                    console.error("Error checking column:", colErr);
                    return res.status(500).send("Error checking exam column");
                }

                if (colRes.length === 0) {
                    const alterQuery = `
                        ALTER TABLE studentmarks
                        ADD COLUMN \`${examName}\` TINYINT
                        CHECK (\`${examName}\` BETWEEN 0 AND ${maxMarks})
                        DEFAULT NULL`;

                    con.query(alterQuery, (alterErr) => {
                        if (alterErr) {
                            console.error("Error adding column:", alterErr);
                            return res.status(500).send("Error adding exam column");
                        }
                        return res.send("Exam added successfully");
                    });
                } else {
                    return res.send("Exam added successfully");
                }
            });
        });
    });
});
// Remove an Exam Column from studentMarks and 
app.post("/removeExamColumn/:role/:hodId", (req, res) => {
    const { year, branch, examName } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch || !examName) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const getQuery =
        "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(getQuery, [year, branch], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0 || !result[0].exams) {
            return res.status(404).send("No exams found");
        }

        let examsJSON =
            typeof result[0].exams === "string"
                ? JSON.parse(result[0].exams)
                : result[0].exams;

        // REMOVE BY KEY (EXAM NAME)
        if (!examsJSON[examName]) {
            return res.status(404).send("Exam not found");
        }

        delete examsJSON[examName];

        const updateQuery =
            "UPDATE examsofspecificyearandbranch SET exams = ? WHERE year = ? AND branch = ?";

        con.query(
            updateQuery,
            [JSON.stringify(examsJSON), year, branch],
            (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).send("Error updating exams");
                }

                // Nullify marks (do NOT drop column)
                const nullifyQuery =
                    `UPDATE studentmarks SET \`${examName}\` = NULL WHERE year = ? AND branch = ?`;

                con.query(nullifyQuery, [year, branch], () => {
                    res.send("Exam removed successfully");
                });
            }
        );
    });
});

//6. GENERATE STUDENT REPORTS
//to get subjects based on year and branch
app.get("/getSubjects/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
     const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = "SELECT subject_name FROM subjects WHERE year = ? AND branch_name = ?";
    
    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send(err);
        }
        
        res.json(result); // Ensure this sends an array of objects [{subject_name: 'kk'}, {subject_name: 'r'}]
    });
});
//to get existing exams
app.get("/getExamsForHod/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
     const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0 || !result[0].exams) {
            return res.json([]); // No exams found
        }

       try {
            const examsJSON =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            // RETURN EXAM NAMES, NOT MARKS
            const examNames = Object.keys(examsJSON);

            res.json(examNames);
        } catch (e) {
            console.error("Error parsing exams JSON:", e);
            res.status(500).send("Error processing exam data");
        }
    });
});
// Fetch student reports based on year, branch, subject, and exam
app.get("/getStudentReports/:role/:hodId/:year/:branch/:subject/:exam", (req, res) => {
    const { year, branch, subject, exam } = req.params;
     const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch || !exam || !subject) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    // Corrected query: dynamically selecting the column
    const query = `SELECT htno, name, ${exam} AS marks FROM studentmarks WHERE year = ? AND branch = ? AND subject = ?`;

    con.query(query, [year, branch, subject], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});
// Fetch max marks for a specific exam
app.get("/getExamMaxMarks/:role/:hodId/:year/:branch/:exam", (req, res) => {
    const { year, branch, exam } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch || !exam) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query =
        "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exam max marks:", err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0 || !result[0].exams) {
            return res.json({ maxMarks: null });
        }

        try {
            const examsJSON =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            const maxMarks = examsJSON[exam] ?? null;

            res.json({ maxMarks });
        } catch (e) {
            console.error("Error parsing exams JSON:", e);
            res.status(500).send("Invalid exams data");
        }
    });
});

//7. VIEW MARKS UPDATE REQUESTS
app.get("/getRequests/:role/:hodId/:year/:branch", (req, res) => {
     const { role, hodId,year, branch } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = `SELECT DISTINCT 
        requested_by,
        subject,
        exam,
        DATE(requested_at) AS requested_date,
        request_status
    FROM pending_marks_updates
    WHERE year = ? AND branch = ? AND request_status = 'Pending'
    `;
    con.query(query, [req.params.year, req.params.branch], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});
app.post("/updateStatus/:role/:hodId/:faculty/:subject/:exam/:status", (req, res) => {
    const { faculty, subject, exam, status } = req.params;
     const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !faculty || !subject || !exam || !status) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    // If Approved, update marks in studentMarks
    if (status === "Approved") {
        // Fetch marks from pending_marks_updates
        const fetchQuery = `SELECT year, branch, htno, new_marks FROM pending_marks_updates WHERE requested_by = ? AND subject = ? AND exam = ?`;

        con.query(fetchQuery, [faculty, subject, exam], (err, results) => {
            if (err || results.length === 0) {
                console.error("Error fetching marks:", err);
                return res.status(500).json({ error: "Failed to fetch marks" });
            }

            // Determine column (Unit_test_1 or mid_1)
            let column = exam;
            // Update marks for each student
            let updatePromises = results.map(({ year, branch, htno, new_marks }) => {
                return new Promise((resolve, reject) => {
                    const updateQuery = `UPDATE studentmarks SET ${column} = ? WHERE year = ? AND branch = ? AND htno = ? AND subject = ?`;
                    con.query(updateQuery, [new_marks, year, branch, htno, subject], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            // Execute updates
            Promise.all(updatePromises)
                .then(() => {
                    // Update request status
                    const statusQuery = `UPDATE pending_marks_updates SET request_status = ? WHERE requested_by = ? AND subject = ? AND exam = ?`;
                    con.query(statusQuery, [status, faculty, subject, exam], (err) => {
                        if (err) {
                            console.error("Error updating status:", err);
                            return res.status(500).json({ error: "Failed to update status" });
                        }
                        res.sendStatus(200);
                    });
                })
                .catch((err) => {
                    console.error("Error updating student marks:", err);
                    res.status(500).json({ error: "Failed to update student marks" });
                });
        });
    } else {
        // Just update request status if Rejected
        const statusQuery = `UPDATE pending_marks_updates SET request_status = ? WHERE requested_by = ? AND subject = ? AND exam = ?`;
        con.query(statusQuery, [status, faculty, subject, exam], (err) => {
            if (err) {
                console.error("Error updating status:", err);
                return res.status(500).json({ error: "Failed to update status" });
            }
            res.sendStatus(200);
        });
    }
});
app.get("/getUpdate/:role/:hodId/:faculty/:subject/:exam", (req, res) => {
     const { role, hodId, faculty, subject, exam } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !faculty || !subject|| !exam) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = `SELECT 
        htno,
        name,
        old_marks,
        new_marks,
        reason
    FROM pending_marks_updates
    WHERE requested_by = ?
    AND subject = ?
    AND exam = ?
    `;
    con.query(query, [req.params.faculty, req.params.subject, req.params.exam], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

//8. STUDENTS DATA AND PWD
app.get("/hod/student-profiles/:role/:hodId", (req, res) => {
    const { year, branch } = req.query;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const sql = `
        SELECT
            htno, full_name, year, branch, batch, dob, gender,
            admission_type, current_status, student_mobile, email,
            current_address, permanent_address, father_name, mother_name,
            parent_mobile, guardian_name, guardian_relation,
            guardian_mobile, blood_group, nationality, religion
        FROM student_profiles
        WHERE year = ? AND branch = ?
    `;

    con.query(sql, [year, branch], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }
        res.json(rows);
    });
});
app.get("/hod/reset-password-students/:role/:hodId/:year/:branch", (req, res) => {
    const { role, hodId, year, branch } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    con.query(
        `SELECT htno, full_name, year, branch
         FROM student_profiles
         WHERE reset_password='yes' AND year = ? AND branch = ?`, [year, branch],
        (err, rows) => {
            if (err) return res.status(500).json([]);
            res.json(rows);
        }
    );
});
app.get("/hod/branches/:role/:hodId", (req, res) => {
    const { year, hodBranch } = req.query;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !hodBranch) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    con.query(
        "SELECT DISTINCT branch_name FROM branches WHERE year=? AND branch_name LIKE ?",
        [year, `${hodBranch}%`],
        (err, rows) => {
            if (err) return res.status(500).json([]);
            res.json({ branches: rows.map(r => r.branch_name) });
        }
    );
});
app.post("/hod/update-student-password/:role/:hodId", (req, res) => {
    const { htno, tempPassword } = req.body;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    if (!htno || !tempPassword) {
        return res.status(400).json({
            success: false,
            message: "Invalid input"
        });
    }

    const sql = `
        UPDATE student_profiles
        SET password = ?,
            reset_password = 'reset_password'
        WHERE htno = ?
    `;

    con.query(sql, [tempPassword, htno], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        res.json({ success: true });
    });
});
app.get("/hod/studentProfile/photo/:htno/:role/:hodId", (req, res) => {
    const { htno, role, hodId } = req.params;
    const sessionValue = req.query.sessionValue;
    if(!htno || !role || !hodId) {
            return res.status(401).json({ success: false, message: "Invalid credentials"});
    }
    if (!sessionStore[role]) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }
    const valid = validateSession(role, hodId, sessionValue);
    if (!valid) {
                return res.status(401).json({ success: false, message: "Invalid session" });
    }
    

    const query = `
        SELECT profile_photo
        FROM student_profiles
        WHERE htno = ?
        LIMIT 1
    `;

    con.query(query, [htno], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).end();
        }

        if (!results.length || !results[0].profile_photo) {
            // No image → return 404 so frontend can fallback
            // return res.status(404).end();
            const defaultImagePath = path.join(__dirname, "HodTask", "studentsDataAndPwd", "default.png");
            return res.sendFile(defaultImagePath);
        }

        const imageBuffer = results[0].profile_photo;

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        res.send(imageBuffer);
    });
});

//9. CHARTS
app.get("/hod/getExamMaxMarksAll/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }

    const query = `
        SELECT exams
        FROM examsofspecificyearandbranch
        WHERE year = ? AND branch = ?
    `;

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exam max marks:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!result.length || !result[0].exams) {
            return res.json({});
        }

        try {
            const exams =
                typeof result[0].exams === "string"
                    ? JSON.parse(result[0].exams)
                    : result[0].exams;

            // exams = { MID1: 30, QUIZ1: 10 }
            res.json(exams);
        } catch (e) {
            console.error("Error parsing exams JSON:", e);
            res.status(500).json({ error: "Invalid exams format" });
        }
    });
});
app.get("/getIndividualStudentData/:role/:hodId/:htno/:year/:branch", (req, res) => {
  const { htno, year, branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch || !htno) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
  // Step 1: Get exam list dynamically
  const examQuery = `
    SELECT exams 
    FROM examsofspecificyearandbranch 
    WHERE year = ? AND branch = ?;
  `;

  con.query(examQuery, [year, branch], (err, examResult) => {
    if (err)
      return res.status(500).json({ error: "Error fetching exams", details: err });

    if (!examResult.length || !examResult[0].exams)
      return res.json({ message: "No exams configured for this year and branch" });

    // Parse exams JSON safely
    let examsData = examResult[0].exams;
    if (typeof examsData === "object") examsData = JSON.stringify(examsData);

    let exams = [];
    try {
      const parsed = JSON.parse(examsData);
      exams = Object.keys(parsed); 
    } catch (parseError) {
      console.error("Error parsing exams JSON:", parseError);
      return res.status(500).json({ error: "Invalid exams format in DB" });
    }

    if (exams.length === 0)
      return res.json({ message: "No exams found" });

    // Step 2: Build dynamic SQL to select only required exam columns
    const columnsToSelect = exams.map(e => `\`${e}\``).join(", ");
    const marksQuery = `
      SELECT subject, ${columnsToSelect}, name, htno
      FROM studentmarks
      WHERE year = ? AND branch = ? AND htno = ?;
    `;

    // Step 3: Execute query
    con.query(marksQuery, [year, branch, htno], (err, result) => {
      if (err) {
        console.error("Error fetching marks:", err);
        return res.status(500).json({ error: "Error fetching marks", details: err });
      }
      res.json({ exams, data: result });
    });
  });
});
app.get("/getStudentsData/:role/:hodId/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const { role, hodId } = req.params;
    const sessionValue = req.headers["x-session-key"];

    if (!hodId ||  !role || !year || !branch ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request parameters"
        });
    }
    if (!sessionStore[role]) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }
    if (!sessionValue) {
        return res.status(401).json({
            success: false,
            message: "Invalid user"
        });
    }

    const valid = validateSession(role, hodId, sessionValue);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid session"
        });
    }
    // Corrected query: dynamically selecting the column
    const query = `SELECT DISTINCT htno, name 
                    FROM studentmarks 
                    WHERE year = ? AND branch = ?;
                    `;
    con.query(query, [year, branch], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});
//--------------------------------------------------------------
//--------------------------------------------------------------
//Pending...

app.get("/getReportDetails", (req, res) => {
    res.json({
        branch: approvedBranch,
        year: approvedYear,
        subject: approvedSubject
    });
});

//generating charts
// API to get student marks for a subject
app.get("/marks", (req, res) => {
  const { subject, year, branch } = req.query;
  const sql = `
    SELECT *
    FROM studentmarks
    WHERE subject = ? AND year = ? AND branch = ?`;

  con.query(sql, [subject, year, branch], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error fetching data");
    } else {
      res.json(results);
    }
  });
});

// API to get marks for all subjects for a given year and branch
// Fetch comparative marks for a year and branch (only exams from examsofspecificyearandbranch)
app.get("/comparativemarks", (req, res) => {
    const { year, branch } = req.query;

    if (!year || !branch) {
        return res.status(400).json({ error: "Year and branch are required" });
    }

    // Step 1: Get exams for this year & branch
    const examQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";
    con.query(examQuery, [year, branch], (err, examResult) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!examResult.length || !examResult[0].exams) {
            return res.json([]); // no exams
        }

        let exams = examResult[0].exams;
        if (typeof exams === "string") exams = JSON.parse(exams);
        const examColumns = Object.keys(exams); 

        // Step 2: Select only relevant columns from studentmarks
        const columns = ["htno", "name", "subject", ...examColumns].map(col => `\`${col}\``).join(", ");
        const studentQuery = `SELECT ${columns} FROM studentmarks WHERE year = ? AND branch = ?`;

        con.query(studentQuery, [year, branch], (err2, studentResults) => {
            if (err2) {
                console.error("Error fetching student marks:", err2);
                return res.status(500).json({ error: "Database error" });
            }

            res.json(studentResults);
        });
    });
});

// Fetch table data for year/branch
app.get("/api/get-table-data", (req, res) => {
    const { table, year, branch } = req.query;
    if (!table || !year || !branch) return res.status(400).json({ error: "Missing params" });

    let sql = "";
    const params = [year, branch];

    if (table === "branches") sql = "SELECT * FROM branches WHERE year=? AND branch_name=?";
    else if (table === "examsofspecificyearandbranch") sql = "SELECT * FROM examsofspecificyearandbranch WHERE year=? AND branch=?";
    else if (table === "faculty_requests") sql = "SELECT * FROM faculty_requests WHERE year=? AND branch=?";
    else if (table === "pending_marks_updates") sql = "SELECT * FROM pending_marks_updates WHERE year=? AND branch=?";
    else if (table === "studentmarks") sql = "SELECT * FROM studentmarks WHERE year=? AND branch=?";
    else if (table === "subjects") sql = "SELECT * FROM subjects WHERE year=? AND branch_name=?";
    else return res.status(400).json({ error: "Invalid table" });

    con.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Delete single row
app.delete("/api/delete-row", (req, res) => {
    const { table, id } = req.query;
    if (!table || !id) return res.status(400).json({ error: "Missing params" });

    const sql = `DELETE FROM ${table} WHERE id=?`;
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Row deleted successfully from ${table}` });
    });
});

// Export CSV
app.get("/api/export-csv", async (req, res) => {
    const { tables, year, branch } = req.query; // 'tables' can be comma-separated
    if (!tables || !year || !branch)
        return res.status(400).send("Missing params");

    const tableList = tables.split(",");
    let finalCSV = "";

    const runQuery = (sql, params) =>
        new Promise((resolve, reject) => {
            con.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

    try {
        for (const table of tableList) {
            const sql =
                table === "subjects" || table === "branches"
                    ? `SELECT * FROM ${table} WHERE year=? AND branch_name=?`
                    : `SELECT * FROM ${table} WHERE year=? AND branch=?`;

            const results = await runQuery(sql, [year, branch]);
            if (!results.length) continue;

            // Process rows to handle JSON columns
            const processedResults = results.map(row => {
                const newRow = {};
                for (let key in row) {
                    const val = row[key];
                    if (typeof val === "object" && val !== null) {
                        newRow[key] = JSON.stringify(val).replace(/,/g, ";");
                    } else {
                        newRow[key] = val;
                    }
                }
                return newRow;
            });

            const header = Object.keys(processedResults[0]).join(",");
            const rows = processedResults.map(r => Object.values(r).join(",")).join("\n");
            const csv = `${header}\n${rows}`;

            finalCSV += `\n\n===== ${table.toUpperCase()} =====\n${csv}\n`;
        }

        if (!finalCSV.trim()) return res.status(404).send("No data found for selected tables");

        res.setHeader("Content-disposition", `attachment; filename=${year}-${branch}.csv`);
        res.set("Content-Type", "text/csv");
        res.send(finalCSV);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating CSV");
    }
});
app.post("/api/update-row", (req, res) => {
    const { table, data } = req.body;

    if (!table || !data || !data.id) {
        return res.status(400).json({ error: "Invalid request" });
    }

    const id = data.id;
    delete data.id;

    const columns = Object.keys(data);
    const values = Object.values(data);

    const setString = columns.map(col => `${col} = ?`).join(", ");
    const sql = `UPDATE ${table} SET ${setString} WHERE id = ?`;

    con.query(sql, [...values, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

//-----------------------------------------------------
//-----------------------------------------------------
//COMMON FOR ALL ROLES
//Authenticate based on role and userId
app.post("/verify-session", (req, res) => {
    const { role, userId } = req.body;

    if (!role || !userId) {
        return res.status(401).json({ valid: false });
    }

    let query = "";
    let params = [userId];

    switch (role) {
        case "admin":
            query = "SELECT id FROM admin WHERE id = ?";
            break;

        case "hod":
            query = "SELECT hod_id FROM hod_details WHERE hod_id = ?";
            break;

        case "faculty":
            query = "SELECT facultyId FROM faculty WHERE facultyId = ?";
            break;

        case "student":
            query = "SELECT htno FROM student_profiles WHERE htno = ?";
            break;

        default:
            return res.status(401).json({ valid: false });
    }

    con.query(query, params, (err, rows) => {
        if (err) {
            console.error("Session verification error:", err);
            return res.status(500).json({ valid: false });
        }

        if (rows.length === 0) {
            return res.status(401).json({ valid: false });
        }
        return res.json({ valid: true });
    });
});
// LOGOUT API
app.post("/logout", (req, res) => {
    const { role, userId, sessionValue } = req.body;
    // console.log("Logout request for:", role, userId, sessionValue);
    try {
         if (!sessionStore[role]) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }
       
        const valid = validateSession(role, userId, sessionValue);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid session" });
        }

        const key = `${role}:${userId}`;
        sessionStore[role].delete(key);
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = process.env.PORT || 9812;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});