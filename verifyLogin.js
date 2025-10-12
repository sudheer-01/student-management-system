var express = require("express");
var path = require("path");
var app = express();
// console.log(__dirname);
var baseDir = __dirname;
// console.log(baseDir);

//WHEN YOU ARE ADDING STATIC FILES ONCE CHECK YOUR PATH

app.use(express.static(path.join(baseDir,"Home")));
app.use(express.static(path.join(baseDir,"loginpage")));
app.use(express.static(path.join(baseDir,"NewAccountCreate")));

//homepageForFaculty
app.use(express.static(path.join(baseDir,"homepageForFaculty")));
// Serve homepageForFaculty at /homepageForFaculty URL prefix
app.use('/homepageForFaculty', express.static(path.join(baseDir, 'homepageForFaculty')));
app.use(express.static(path.join(baseDir,"homepageForFaculty","Dashboard")));
app.use(express.static(path.join(baseDir,"homepageForFaculty","requestForSubject")));
//HodTask
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
//student
app.use('/studentsMarks', express.static(path.join(baseDir, 'studentsMarks')));
app.use(express.static(path.join(baseDir,"studentsMarks")));
//admin
app.use(express.static(path.join(baseDir,"admin")));
app.use(express.static(path.join(baseDir,"UpdateDatabase")));
//forgot password
app.use(express.static(path.join(baseDir,"ForgotPassword")));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
var mysql = require("mysql2");
const exp = require("constants");
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
//---------------------------------------------------------------
// app.get("/login",(req,res) =>
// {
//     res.sendFile(path.join(baseDir,"loginpage","login.html"));
// }
// );  
// IDHI LEKUNNA LOGIN.HTML VASTHUNDHI GA
//---------------------------------------------------------------

// entering teacher details into database
app.post("/createTeacherAccount", (req, res) => {
    var teacherName = req.body.teacherName;
    var facultyId = req.body.facultyId;
    var emailOfTeacher = req.body.emailOfTeacher;
    var passwordOfTeacher = req.body.passwordOfTeacher;
    var reEnterPasswordTeacher = req.body.reEnterPasswordTeacher;

    //console.log(passwordOfTeacher);
    //console.log(reEnterPasswordTeacher); // Fix: Use correct variable

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
//checking teacher credentials to login to faculty dashboard

app.post("/TeacherLogin", (req, res) => {
    const facultyId = req.body.facultyId;
    const passwordOfTeacher = req.body.passwordOfTeacher;
    console.log(facultyId,passwordOfTeacher);
    con.query(
        "SELECT * FROM faculty WHERE facultyId=? AND password=?",
        [facultyId, passwordOfTeacher],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Server error. Try again later." });
            }
            if (result.length > 0) {
                // ✅ Send facultyId to frontend
                console.log("Login successful for facultyId:", facultyId);
                return res.json({
                    success: true,
                    facultyId: facultyId,
                    redirectUrl: "/homepageForFaculty/requestForSubject/requestForSubject.html"
                });
            } else {
                return res.status(401).json({ success: false, message: "Invalid Faculty ID or Password." });
            }
        }
    );
});

// entering hod details into database
app.post("/createHodAccount", (req, res) => {
    var yearOfHod = parseInt(req.body.yearOfHod);  // Ensure integer conversion
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


//checking hod credentials to login into hod dashboard

app.post("/loginToHodDashBoard", (req, res) => {
    const hodId = req.body.HodId;
    const passwordOfHod = req.body.passwordOfHod;

    con.query(
        "SELECT name, branch, year FROM hod_details WHERE hod_id=? AND password=? AND status = 'Approved'",
        [hodId, passwordOfHod],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.send(
                    `<script>alert('Invalid HOD ID or Password.'); window.location.href='/';</script>`
                );
            }
            if (result.length > 0) {
                // ✅ Send HOD details to the client
                const hodDetails = {
                    hodName: result[0].name,
                    hodBranch: result[0].branch,
                    hodYears: result[0].year.split(",")
                };
                console.log("Hod Details:", hodDetails);
                return res.json({
                    success: true,
                    hodDetails: hodDetails,
                    redirectUrl: "/HodTask/HodDashboard/HodDashboard.html"
                });
                // Store HOD details in global variables
                /*hodName = result[0].name;
                hodBranch = result[0].branch;
                
                // Convert ENUM year value to an array
                hodYears = result[0].year.split(","); 

                res.sendFile(path.join(baseDir, "HodTask", "HodDashboard", "HodDashboard.html"));*/
            } else {
                return res.send(
                    `<script>alert('Invalid HOD ID or Password. '); window.location.href='/';</script>`
                );
            }
        }
    );
});
//this to display hod details like name, years, branch dynmically when the dom content loaded
//this is for above code
/*app.get("/getHodDetails", (req, res) => {
    if (hodName && hodBranch && hodYears) {
        res.json({
            hodName,
            hodBranch,
            hodYears
        });
    } else {
        res.status(400).json({ error: "HOD details not found. Please log in again." });
    }
});*/

//Entering sutdent details such as htno and name by hod 
app.post("/saveData", (req, res) => {
    let students = req.body.students;
    
    if (!students || students.length === 0) {
        return res.status(400).send("No student data received.");
    }

    let values = students.map(student => [student.htno, student.name, student.branch, student.year]);

    con.query("INSERT INTO studentmarks (htno, name, branch, year) VALUES ?", [values], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("The student already exists with the same htno.");
        }
        // if (err) {
        // console.error("MySQL Error:", err);
        // return res.status(500).send(err.sqlMessage || "Error saving data."); 
        // }

        res.send("Data saved successfully!");
    });
});
//retriving student details such as htno and name by hod
app.get("/getData", (req, res) => {
    let branch = req.query.branch;
    let year = req.query.year;

    if (!branch || !year) {
        return res.status(400).json({ error: "Please provide both branch and year." });
    }

    con.query(
        "SELECT DISTINCT htno, name FROM studentmarks WHERE branch = ? AND year = ?",
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



//homepageForFaculty:::enterMarks
// Route to fetch student details (year and branch can be added as filters)
app.get("/getStudents", (req, res) => {
     const { year, branch } = req.query;

    con.query("SELECT DISTINCT htno, name FROM studentmarks WHERE branch = ? AND year = ?", [branch, year], (err, results) => {
        if (err) {
            console.error("Error fetching student data:", err);
            res.status(500).json({ success: false, message: "Database error" });
        } else {
            res.json(results);
        }
    });
});


//after getting the marks like year and branch we are entering the marks and saving them
//for more information just uncomment tto understand more clearly
// Route to save student marks
app.post("/saveMarks", (req, res) => {
    let subjectName = req.body.subject; // Ensure this has the correct value //g
   // console.log(subjectName);
    const exam = req.body.exam;

    if (!exam) {
        return res.json({ success: false, message: "Exam not selected" });
    }

    const marksData = Object.keys(req.body)
        .filter(key => key.startsWith("marks_"))
        .map(key => ({
            htno: key.split("_")[1],
            marks: req.body[key]
        }));

    if (marksData.length === 0) {
        return res.json({ success: false, message: "No marks data provided" });
    }

    const queries = marksData.map(({ htno, marks }) => {
        return new Promise((resolve, reject) => {
            // Check if student exists
            const checkQuery = `SELECT * FROM studentmarks WHERE htno = ?`;
            con.query(checkQuery, [htno], (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    return reject(err);
                }

                if (result.length > 0) {
                    // Check if the subject exists for this student
                    const existingSubject = result.find(row => row.subject === subjectName);

                    if (existingSubject) {
                        // Update existing subject marks
                        const updateQuery = `UPDATE studentmarks SET ${exam} = ? WHERE htno = ? AND subject = ?`;
                        con.query(updateQuery, [marks, htno, subjectName], (err, updateResult) => {
                            if (err) {
                                console.error("Error updating marks:", err);
                                return reject(err);
                            }
                            //console.log(`Updated marks for ${htno} in ${subjectName}`);
                            resolve(updateResult);
                        });
                    } else {
                        // Check for TBD subjects and update them
                        const updateSubjectQuery = `UPDATE studentmarks SET subject = ? WHERE htno = ? AND subject LIKE 'TBD_%' LIMIT 1`;
                        con.query(updateSubjectQuery, [subjectName, htno], (err, updateSubjectResult) => {
                            if (err) {
                                console.error("Error updating subject name:", err);
                                return reject(err);
                            }

                            if (updateSubjectResult.affectedRows > 0) {
                                // If a TBD subject was updated, update the marks
                                const updateMarksQuery = `UPDATE studentmarks SET ${exam} = ? WHERE htno = ? AND subject = ?`;
                                con.query(updateMarksQuery, [marks, htno, subjectName], (err, updateMarksResult) => {
                                    if (err) {
                                        console.error("Error updating marks:", err);
                                        return reject(err);
                                    }
                                   // console.log(`Updated marks for ${htno} in ${subjectName}`);
                                    resolve(updateMarksResult);
                                });
                            } else {
                                // Insert new subject if no TBD entry exists
                                const { year, branch, name } = result[0];

                                const insertQuery = `INSERT INTO studentmarks (year, branch, htno, name, subject, ${exam}) VALUES (?, ?, ?, ?, ?, ?)`;
                                con.query(insertQuery, [year, branch, htno, name, subjectName, marks], (err, insertResult) => {
                                    if (err) {
                                        console.error("Error inserting new subject:", err);
                                        return reject(err);
                                    }
                                    //console.log(`Inserted new subject ${subjectName} for ${htno}`);
                                    resolve(insertResult);
                                });
                            }
                        });
                    }
                } else {
                    return reject(new Error("Student details not found"));
                }
            });
        });
    });

    Promise.all(queries)
        .then(() => res.json({ success: true }))
        .catch((error) => {
            console.error("Error processing marks:", error);
            res.status(500).json({ success: false, message: "Database error" });
        });
});


//homepageForFaculty:::ViewMarks
//viewing marks

app.get("/getStudentMarks", (req, res) => {
   
    const examColumn = req.query.exam;  // Get exam name from frontend
    const year = req.query.year;  // Get year from frontend
    const branch = req.query.branch;  // Get branch from frontend
    const subject = req.query.subject;  // Get subject from frontend
    console.log("Exam Column:", examColumn);

    if (!examColumn) {
        return res.status(400).json({ success: false, message: "Exam type is required" });
    }

    // Prevent SQL Injection by validating exam name
    // const validColumns = ["unitTest_1", "mid_1", "assignment_1", "unitTest_2", "mid_2", "assignment_2"];
    // if (!validColumns.includes(examColumn)) {
    //     return res.status(400).json({ success: false, message: "Invalid exam type" });
    // }

    let sqlQuery = `SELECT htno, name, ${examColumn} FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;

    con.query(sqlQuery, [branch, year, subject], (err, results) => {
        if (err) {
            console.error("Error fetching student data:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json(results);
    });
});
//homepageForFaculty:::viewOverallMarks
// API to fetch all students with dynamic exam columns
// app.get("/getOverallMarks", (req, res) => {
//     const branch = req.query.branch;  // Get branch from frontend
//     const year = req.query.year;        // Get year from frontend
//     const subject = req.query.subject;  // Get subject from frontend

//     // Query to get exam columns dynamically
//     con.query("SHOW COLUMNS FROM studentmarks", (err, columns) => {
//         if (err) {
//             console.error("Error fetching column names:", err);
//             return res.status(500).json({ success: false, message: "Database error" });
//         }

//         // Extract column names excluding non-exam fields
//         let examColumns = columns
//             .map(col => col.Field)
//             .filter(col => !["year", "branch", "htno", "name", "subject"].includes(col));

//         // Construct SQL Query to fetch data dynamically
//         let sqlQuery = `SELECT htno, name, ${examColumns.join(", ")} FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;

//         con.query(sqlQuery, [branch, year, subject], (err, results) => {
//             if (err) {
//                 console.error("Error fetching student marks:", err);
//                 return res.status(500).json({ success: false, message: "Database error" });
//             }

//             res.json(results);
//         });
//     });
// });
app.get("/getOverallMarks", (req, res) => {
    const { branch, year, subject } = req.query;

    const examQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(examQuery, [year, branch], (err, examResult) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (examResult.length === 0) {
            return res.status(404).json({ success: false, message: "No exams found for this year and branch" });
        }

        // ✅ Handle both string and object cases
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

        const examColumns = Object.values(examsObj);

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


app.get("/getReportDetails", (req, res) => {
    res.json({
        branch: approvedBranch,
        year: approvedYear,
        subject: approvedSubject
    });
});

//homepageForFaculty:::editMarks
// Get student marks for selected exam
app.get("/getStudentMarksForEditing", (req, res) => {
    const { exam, year, branch, subject } = req.query;
    
    // console.log("Exam:", exam);
    // console.log("Branch:", branch);
    // console.log("Year:", year);
    // console.log("Subject:", subject);

    let query = `SELECT htno, name, ?? FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;
    
    con.query(query, [exam, branch, year, subject], (err, results) => {
        if (err) {
            console.error("Error fetching student marks:", err);
            res.status(500).json({ success: false, message: "Database error" });
        } else {
            //console.log("Fetched Data:", results);
            res.json(results);
        }
    });
});

// Faculty requests HOD approval for marks update
// Faculty requests HOD approval for marks update
app.post("/requestHodToUpdateMarks", (req, res) => {
    let updateRequests = req.body.requests;
    let branch = req.body.selectedBranch; 
    let year = req.body.selectedYear; 
    let subject = req.body.selectedSubject; 
    let facultyName = req.body.facultyId; //facultyId not name

    let query = `INSERT INTO pending_marks_updates 
        (htno, name, year, branch, subject, exam, old_marks, new_marks, requested_by, request_status) 
        VALUES ?`;

    let values = updateRequests
        .filter(({ newMarks }) => newMarks !== "" && newMarks !== null) 
        .map(({ htno, exam, newMarks, name, oldMarks }) => [
            htno, name, year, branch, subject, exam, oldMarks, newMarks, facultyName, 'Pending'
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

//HodTask:::addBranchesAndSubjects
app.post("/saveSubjects", async (req, res) => {
    const { year, branches, subjects } = req.body;

    if (!year || !branches.length || !subjects.length) {
        return res.status(400).json({ error: "Year, branches, and subjects are required!" });
    }

    try {
        const db = con.promise();

        // Insert dynamically generated branches
        await Promise.all(
            branches.map(branch =>
                db.query("INSERT IGNORE INTO branches (year, branch_name) VALUES (?, ?)", [year, branch])
            )
        );

        // Insert subjects for each branch
        await Promise.all(
            branches.flatMap(branch =>
                subjects.map(subject =>
                    db.query("INSERT IGNORE INTO subjects (year, branch_name, subject_name) VALUES (?, ?, ?)", [year, branch, subject])
                )
            )
        );

        res.json({ message: "Branches and subjects saved successfully!" });
    } catch (err) {
        console.error("Database Insert Error:", err);
        res.status(500).json({ error: "Database error while saving subjects." });
    }
});


//homePageForFaculty:::requestForSubject
// Fetch all branches
app.get("/branches", (req, res) => {
    const query = "SELECT DISTINCT branch_name FROM branches";
    con.query(query, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// Fetch branches for a specific year
app.get("/branches/:year", (req, res) => {
    const year = req.params.year;
    const query = "SELECT DISTINCT branch_name FROM branches WHERE year = ?";
    
    con.query(query, [year], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// Fetch all subjects
app.get("/subjects", (req, res) => {
    const query = "SELECT DISTINCT subject_name FROM subjects";
    con.query(query, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// Fetch subjects based on year and branch
app.get("/subjects/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    const query = "SELECT subject_name FROM subjects WHERE year = ? AND branch_name = ?";
    
    con.query(query, [year, branch], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// Store faculty requests in the database
app.post("/sendRequest", (req, res) => {

    const { year, branch, subject, facultyId } = req.body;

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

//homepageForFaculty:::requestForSubject
//to display status of request for faculty
app.get("/getRequests", (req, res) => {
    const facultyId = req.query.facultyId;
    const query = "SELECT facultyName, subject, branch, year, status FROM faculty_requests where faculty_Id = ? ";
    
    con.query(query,[facultyId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

//HodTask:::viewFacultyRequests
// app.get("/getYears", (req, res) => {
//     res.json(hodYears.map(year => ({ year })));
// });
// app.get("/getBranches/:year", (req, res) => {
//     const { year,branch } = req.params;

//     let query;
//     let params;

//     if (year === "1") {
//         // Fetch only 1st-year branches
//         year = parseInt(year);
//         query = "SELECT DISTINCT branch_name FROM branches WHERE year = ?";
//         params = [1];
//     } else {
//         // Fetch only HOD-related branches for other years
//         year = parseInt(year);
//         query = "SELECT branch_name FROM branches WHERE year = ? AND branch_name LIKE ?";
//         params = [year, `%${branch}%`];
//     }

//     con.query(query, params, (err, result) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

app.get("/getbranches/:year/:branch", (req, res) => {
    const { year,branch } = req.params;

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

app.get("/hodRequests/:year/:branch", (req, res) => {
    const { year, branch } = req.params;

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
app.post("/updateRequestStatus", (req, res) => {
    const { facultyId, status, year, branch, subject } = req.body;
    
    //console.log("Received Data:", { facultyId, status, year, branch, subject }); 

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

// to open home page home.html from the requests page of faculty
app.post("/dashboardOfFaculty", (req, res) => {

    var { subject, branch, year, facultyId } = req.body;

    console.log("Received Request:", {subject, branch, year, facultyId });

    if (!facultyId || !year || !branch || !subject) {
        console.log("Missing parameters");
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }
  

    const sqlQuery = "SELECT * FROM faculty_requests WHERE faculty_Id = ? AND year = ? AND branch = ? AND subject = ? AND status = 'Approved'";

    con.query(sqlQuery, [facultyId, year, branch, subject], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        //console.log("Query Result:", result);
        if (result.length > 0) {
            console.log("Redirecting to home page...");
           // res.sendFile(path.join(baseDir, "homepageForFaculty", "Dashboard", "home.html"));
            return res.json({ success: true, redirectUrl: "/homepageForFaculty/Dashboard/home.html" }); 
            //  // Redirect to GET route
        } else {
            console.log("No matching record found");
            return res.status(404).json({ success: false, message: "No approved request found" });
        }
    });
});

// Separate GET route to serve home.html (it is for above dashboardOfFaculty)
app.get("/home", (req, res) => {
    const filePath = path.join(__dirname, "homepageForFaculty", "Dashboard", "home.html");
    // console.log("Serving file:", filePath);
    res.sendFile(filePath);
});

//to display faculty details in the home.html
app.post("/getFacultyDetails", (req, res) => {
    const {year, branch, subject, facultyId} = req.body;
    console.log(year, branch, subject, facultyId);

    if (!facultyId || !year || !branch || !subject) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
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

//to get exam columns from examsofspecificyearandbranch table
app.get("/getExamColumns/:year/:branch", (req, res) => {
    const { year, branch } = req.params;

    const query = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0) {
            return res.json([]); // No exams found
        }

        let examsData = result[0].exams; // Extract exams column
       // console.log("Raw exams data:", examsData);

        try {
            // If examsData is a string, parse it; otherwise, use it directly
            const examsJSON = typeof examsData === "string" ? JSON.parse(examsData) : examsData;
            const exams = Object.values(examsJSON); // Convert object values into array
          //  console.log("Parsed exams:", exams);
            res.json(exams);
        } catch (parseError) {
            console.error("Error parsing exams JSON:", parseError);
            res.status(500).send("Error processing exam data");
        }
    });
});

// Add a New Exam Column to studentMarks
app.post("/addExamToDatabase", (req, res) => {
    const { year, branch, examNameWithSpaces } = req.body;

    if (!year || !branch || !examNameWithSpaces) {
        return res.status(400).send("Year, branch, and exam name are required");
    }
    const examName = examNameWithSpaces.replace(/\s+/g, "_");
    //console.log(examName);

    const getQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(getQuery, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).send("Database error");
        }

        let examsJSON = {};

        if (result.length > 0) {
            let examsData = result[0].exams;

            if (!examsData || examsData === "null" || examsData === "") {
                // If exams is NULL or an empty string, initialize as empty object
                examsJSON = {};
            } else if (typeof examsData === "object") {
                // If already an object, use it directly
                examsJSON = examsData;
            } else {
                try {
                    examsJSON = JSON.parse(examsData);
                } catch (parseError) {
                    console.error("Error parsing exams JSON:", parseError);
                    return res.status(500).send("Error processing exam data");
                }
            }
        }

        // Add new exam with dynamic numbering
        const newExamKey = `exam${Object.keys(examsJSON).length + 1}`;
        examsJSON[newExamKey] = examName;

        if (result.length > 0) {
            // Update existing record
            const updateQuery = "UPDATE examsofspecificyearandbranch SET exams = ? WHERE year = ? AND branch = ?";
            con.query(updateQuery, [JSON.stringify(examsJSON), year, branch], handleExamInsertion);
        } else {
            // Insert new record
            const insertQuery = "INSERT INTO examsofspecificyearandbranch (year, branch, exams) VALUES (?, ?, ?)";
            con.query(insertQuery, [year, branch, JSON.stringify(examsJSON)], handleExamInsertion);
        }

        function handleExamInsertion(dbErr) {
            if (dbErr) {
                console.error("Error updating/inserting exams:", dbErr);
                return res.status(500).send("Error saving exam data");
            }

            // Check if column exists in studentMarks table
            const checkColumnQuery = `
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'studentmarks' AND COLUMN_NAME = ?`;

            con.query(checkColumnQuery, [examName], (columnErr, columnResult) => {
                if (columnErr) {
                    console.error("Error checking exam column:", columnErr);
                    return res.status(500).send("Error checking exam column");
                }

                if (columnResult.length === 0) {
                    // Column does not exist, so add it
                    const alterQuery = `ALTER TABLE studentmarks ADD COLUMN \`${examName}\` TINYINT DEFAULT NULL`;

                    con.query(alterQuery, (alterErr) => {
                        if (alterErr) {
                            console.error("Error adding exam column:", alterErr);
                            return res.status(500).send("Error adding exam column");
                        }
                        //res.send("Exam added successfully and column created in studentMarks!");
                        res.send("Exam added successfully");
                    });
                } else {
                    //res.send("Exam added successfully (column already exists in studentMarks).");
                    res.send("Exam added successfully");
                }
            });
        }
    });
});

// Remove an Exam Column from studentMarks and 
app.post("/removeExamColumn", (req, res) => {
    const { year, branch, examName } = req.body;

    if (!year || !branch || !examName) {
        return res.status(400).send("Year, branch, and exam name are required");
    }

    const getQuery = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(getQuery, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0 || !result[0].exams) {
            return res.status(404).send("No exams found for the given year and branch");
        }

        let examsData = result[0].exams;

        // Ensure examsData is a valid JSON string before parsing
        let examsJSON;
        try {
            examsJSON = typeof examsData === "string" ? JSON.parse(examsData) : examsData;
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return res.status(500).send("Invalid JSON format in database");
        }

        let examKeyToRemove = null;

        // Find the key associated with the exam name
        for (let key in examsJSON) {
            if (examsJSON[key] === examName) {
                examKeyToRemove = key;
                break;
            }
        }

        if (!examKeyToRemove) {
            return res.status(404).send("Exam not found in exams list");
        }

        // Remove the exam from JSON
        delete examsJSON[examKeyToRemove];

        // Reorder exams to maintain proper numbering (exam1, exam2, ...)
        let newExamsJSON = {};
        let counter = 1;
        Object.values(examsJSON).forEach((exam) => {
            newExamsJSON[`exam${counter}`] = exam;
            counter++;
        });

        // Update the exams JSON in the database
        const updateQuery = "UPDATE examsofspecificyearandbranch SET exams = ? WHERE year = ? AND branch = ?";

        con.query(updateQuery, [JSON.stringify(newExamsJSON), year, branch], (updateErr) => {
            if (updateErr) {
                console.error("Error updating exams JSON:", updateErr);
                return res.status(500).send("Error updating exams JSON");
            }

            // Instead of deleting the exam column in studentMarks, set values to NULL
            const updateStudentMarksQuery = `UPDATE studentmarks SET \`${examName}\` = NULL WHERE year = ? AND branch = ?`;

            con.query(updateStudentMarksQuery, [year, branch], (updateMarksErr) => {
                if (updateMarksErr) {
                    console.error("Error updating student marks:", updateMarksErr);
                    return res.status(500).send("Error updating student marks");
                }

                //res.send("Exam removed successfully and numbering adjusted!");
                res.send("Exam removed successfully!");
            });
        });
    });
});

//homepageForFaculty::: this is to retrive the exams based on the year and branch
app.get("/getExams", (req, res) => {
    // const year = approvedYear;
    // const branch = approvedBranch;
     const { year, branch } = req.query;

    const query = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0 || !result[0].exams) {
            return res.json([]); // No exams found
        }

       // console.log("Raw exam data from DB:", result[0].exams);

        let examsData = result[0].exams;

        // If examsData is an object instead of a JSON string, convert it to JSON string
        if (typeof examsData === "object") {
            examsData = JSON.stringify(examsData);
        }

        try {
            const examsJSON = JSON.parse(examsData);
            const examList = Array.isArray(examsJSON) ? examsJSON : Object.values(examsJSON);
            res.json(examList);
        } catch (parseError) {
            console.error("Error parsing exams JSON:", parseError);
            res.status(500).json({ error: "Error processing exam data" });
        }
    });
});

//studentMarks
// var stuYear = 0;
// var stuHtno = "";
// app.post("/studentCheckin", (req, res) => {
//     stuYear = req.body.year;
//     stuHtno = req.body.htno;
//     con.query(
//         "SELECT * FROM studentmarks WHERE year=? AND htno=?",
//         [stuYear, stuHtno],
//         (err, result) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send("Server error. Try again later.");
//             }
//             if (result.length > 0) {
//                 return res.sendFile(path.join(baseDir, "studentsMarks","studentsMarks.html"));
//             } else {
//                 return res.send(
//                     `<script>alert('Invalid HTNO or Year'); window.location.href='/';</script>`
//                 );
//             }
//         }
//     );
// });
// studentMarks
app.post("/studentCheckin", (req, res) => {
    const stuYear = req.body.year;
    const stuHtno = req.body.htno;

    con.query(
        "SELECT * FROM studentmarks WHERE year=? AND htno=?",
        [stuYear, stuHtno],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Server error. Try again later."
                });
            }

            if (result.length > 0) {
                // ✅ If valid, send success + redirect URL
                return res.json({
                    success: true,
                    redirectUrl: "/studentsMarks/studentsMarks.html",
                    studentDetails: {
                        year: stuYear,
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


app.post("/studentDashboard/:year/:htno", (req, res) => {
    const { year, htno } = req.params;

    if (!year || !htno) {
        return res.status(400).json({ error: "Session expired or invalid credentials." });
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
            const examColumns = Object.values(examsJson).map(col => `\`${col}\``);

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
                        Object.values(examsJson).forEach(col => {
                            marks[col] = row[col] !== null ? row[col] : "N/A";
                        });
                        return { subject: row.subject, marks };
                    }),
                };

                res.json(studentInfo);
            });
        });
    });
});


//admin login
app.post("/adminLogin", (req, res) => {
    var adminId = req.body.idOfAdmin;
    var password = req.body.passwordOfAdmin;

    con.query(
        "SELECT * FROM admin WHERE id=? AND password=?",
        [adminId, password],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server error. Try again later.");
            }
            if (result.length > 0) {
                return res.sendFile(path.join(baseDir, "admin", "admin.html"));
            } else {
                return res.send(
                    `<script>alert('Invalid Admin ID or Password'); window.location.href='/';</script>`
                );
            }
        }
    );
});

// Fetch All HOD Requests
app.get("/getHodRequests", (req, res) => {
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
app.post("/updateHodStatus", (req, res) => {
    const { hod_id, newStatus } = req.body;

    con.query("UPDATE hod_details SET status = ? WHERE hod_id = ?", [newStatus, hod_id], (err, result) => {
        if (err) {
            console.error("Error updating status:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json({ message: `Status updated to ${newStatus}` });
        }
    });
});

//HodTask:::generateStudentReports
// Fetch subjects based on year & branch
app.get("/getSubjects/:year/:branch", (req, res) => {
    const { year, branch } = req.params;
    //console.log("Received:", year, branch);

    const query = "SELECT subject_name FROM subjects WHERE year = ? AND branch_name = ?";
    
    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send(err);
        }
        
        //console.log("Query Result:", result);
        res.json(result); // Ensure this sends an array of objects [{subject_name: 'kk'}, {subject_name: 'r'}]
    });
});

// Fetch student reports based on year, branch, subject, and exam
app.get("/getStudentReports/:year/:branch/:subject/:exam", (req, res) => {
    const { year, branch, subject, exam } = req.params;

    // Corrected query: dynamically selecting the column
    const query = `SELECT htno, name, ${exam} AS marks FROM studentmarks WHERE year = ? AND branch = ? AND subject = ?`;

    con.query(query, [year, branch, subject], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.get("/getExamsForHod/:year/:branch", (req, res) => {
    const { year, branch } = req.params;

    const query = "SELECT exams FROM examsofspecificyearandbranch WHERE year = ? AND branch = ?";

    con.query(query, [year, branch], (err, result) => {
        if (err) {
            console.error("Error fetching exams:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0 || !result[0].exams) {
            return res.json([]); // No exams found
        }

       // console.log("Raw exam data from DB:", result[0].exams);

        let examsData = result[0].exams;

        // If examsData is an object instead of a JSON string, convert it to JSON string
        if (typeof examsData === "object") {
            examsData = JSON.stringify(examsData);
        }

        try {
            const examsJSON = JSON.parse(examsData);
            const examList = Array.isArray(examsJSON) ? examsJSON : Object.values(examsJSON);
            res.json(examList);
        } catch (parseError) {
            console.error("Error parsing exams JSON:", parseError);
            res.status(500).json({ error: "Error processing exam data" });
        }
    });
});

//HodTask:::viewMarksUpdateRequests
app.get("/getRequests/:year/:branch", (req, res) => {
    const query = `SELECT DISTINCT requested_by, subject, exam, requested_at, request_status FROM pending_marks_updates WHERE year = ? AND branch = ? AND request_status = 'Pending'`;
    con.query(query, [req.params.year, req.params.branch], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.get("/getUpdate/:faculty/:subject/:exam", (req, res) => {
    const query = `SELECT htno, name, old_marks, new_marks FROM pending_marks_updates WHERE requested_by = ? AND subject = ? AND exam = ? AND request_status='Pending'`;
    con.query(query, [req.params.faculty, req.params.subject, req.params.exam], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.post("/updateStatus/:faculty/:subject/:exam/:status", (req, res) => {
    const { faculty, subject, exam, status } = req.params;

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
            console.log("Updating column:", column);
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
// app.get("/comparativemarks", (req, res) => {
//   const { year, branch } = req.query;
//   const sql = `
//     SELECT *
//     FROM studentmarks
//     WHERE year = ? AND branch = ?`;

//   con.query(sql, [year, branch], (err, results) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send("Error fetching data");
//     } else {
//       res.json(results);
//     }
//   });
// });
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

        // If stored as JSON string, parse it
        if (typeof exams === "string") {
            try {
                exams = JSON.parse(exams);
            } catch (parseErr) {
                console.error("Error parsing exams JSON:", parseErr);
                return res.status(500).json({ error: "Error processing exam data" });
            }
        }

        const examColumns = Array.isArray(exams) ? exams : Object.values(exams);

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


app.get("/getStudentsData/:year/:branch", (req, res) => {
    const { year, branch } = req.params;

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

// app.get("/getIndividualStudentData/:htno/:year/:branch", (req, res) => {
//     const { htno, year, branch } = req.params;
//     const query = `SELECT * 
//                     FROM studentmarks 
//                     WHERE year = ? AND branch = ? AND htno = ?;
//                     `;
//     con.query(query, [year, branch, htno], (err, result) => {
//         if (err) return res.status(500).send(err);
//         res.json(result);
//     });
// });

app.get("/getIndividualStudentData/:htno/:year/:branch", (req, res) => {
  const { htno, year, branch } = req.params;

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
      exams = Array.isArray(parsed) ? parsed : Object.values(parsed);
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



//------------------------------------------------------
//forgot password

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOtpEmail(toEmail, otp) {
  const msg = {
    to: toEmail,
    from: 'student.info.mgmnt.system@gmail.com', // use the email you verified in SendGrid Single Sender
    subject: 'Your OTP for Password Reset',
    html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ OTP sent:', response[0].statusCode);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP:', error.response ? error.response.body : error.message);
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
}

// Example usage:
(async () => {
  const testEmail = 'recipient@example.com';  // Replace with recipient email
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await sendOtpEmail(testEmail, otp);
})();



// ================= OTP Handling =================
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Temporary in-memory OTP store
let otpStore = {};

// ================= Forgot Password =================
app.post("/forgotpassword", (req, res) => {
  const { role, userId } = req.body;
  console.log("Forgot password request for:", role, userId);
  let query = "";

  if (role === "faculty") {
    query = "SELECT email FROM faculty WHERE facultyId = ?";
  } else if (role === "hod") {
    query = "SELECT email FROM hod_details WHERE hod_id = ?";
  } else {
    return res.json({ success: false, message: "Invalid role selected" });
  }
   
  con.query(query, [userId], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (result.length === 0) {
      return res.json({ success: false, message: "ID not found" });
    }

    const email = result[0].email;
    console.log("User email found:", email);

    const otp = generateOtp();
    otpStore[userId] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    console.log("Generated OTP:", otp);

    const sent = await sendOtpEmail(email, otp);

if (sent.success) {
  return res.json({ success: true, email });
} else {
  return res
    .status(500)
    .json({ success: false, message: sent.message || "Failed to send OTP email" });
}

  });
});

// ================= Verify OTP =================
app.post("/verifyOtp", (req, res) => {
  const { userId, otp } = req.body;
  console.log("Verifying OTP for:", userId, otp);

  if (!otpStore[userId]) {
    return res.json({ success: false, message: "OTP expired or invalid" });
  }

  const record = otpStore[userId];
  if (Date.now() > record.expires) {
    delete otpStore[userId];
    return res.json({ success: false, message: "OTP expired" });
  }

  if (otp === record.otp) {
    delete otpStore[userId]; // OTP used
    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: "Invalid OTP" });
  }
});

// ================= Reset Password =================
app.post("/resetPassword", (req, res) => {
  const { role, userId, newPassword } = req.body;
  let query = "";

  if (role === "faculty") {
    query = "UPDATE faculty SET password=? WHERE facultyId=?";
  } else if (role === "hod") {
    query = "UPDATE hod_details SET password=? WHERE hod_id=?";
  } else {
    return res.json({ success: false, message: "Invalid role selected" });
  }

  con.query(query, [newPassword, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    return res.json({ success: true, message: "Password updated successfully" });
  });
});

//------------------------------------------------------

//code for admin to delete all data of specific year and branch
app.post("/api/delete-semester-data", (req, res) => {
  const { year, branch } = req.body;

  if (!year || !branch) {
    return res.status(400).json({ error: "Year and branch are required" });
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

// Fetch branches based on selected year
app.get("/api/branches/:year", (req, res) => {
    const year = req.params.year;

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
// app.get("/api/export-csv", async (req, res) => {
//     const { table, year, branch } = req.query;
//     if (!table || !year || !branch) return res.status(400).send("Missing params");

//     const sql = table === "subjects" || table === "branches"
//         ? `SELECT * FROM ${table} WHERE year=? AND branch_name=?`
//         : `SELECT * FROM ${table} WHERE year=? AND branch=?`;

//     con.query(sql, [year, branch], (err, results) => {
//         if (err) return res.status(500).send(err.message);

//         const header = Object.keys(results[0] || {}).join(",");
//         const rows = results.map(r => Object.values(r).join(",")).join("\n");
//         const csv = header + "\n" + rows;

//         res.setHeader("Content-disposition", `attachment; filename=${table}-${year}-${branch}.csv`);
//         res.set("Content-Type", "text/csv");
//         res.send(csv);
//     });
// });

app.get("/api/export-csv", async (req, res) => {
    const { table, year, branch } = req.query;
    if (!table || !year || !branch)
        return res.status(400).send("Missing params");

    const sql =
        table === "subjects" || table === "branches"
            ? `SELECT * FROM ${table} WHERE year=? AND branch_name=?`
            : `SELECT * FROM ${table} WHERE year=? AND branch=?`;

    con.query(sql, [year, branch], (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (!results.length) return res.status(404).send("No data found");

        // Convert each row properly (handle JSON fields)
        const processedResults = results.map(row => {
            const newRow = {};
            for (let key in row) {
                const val = row[key];
                // If it's an object (e.g. JSON column), stringify it
                if (typeof val === "object" && val !== null) {
                    newRow[key] = JSON.stringify(val).replace(/,/g, ";"); // Avoid breaking CSV commas
                } else {
                    newRow[key] = val;
                }
            }
            return newRow;
        });

        const header = Object.keys(processedResults[0]).join(",");
        const rows = processedResults.map(r => Object.values(r).join(",")).join("\n");
        const csv = header + "\n" + rows;

        res.setHeader("Content-disposition", `attachment; filename=${table}-${year}-${branch}.csv`);
        res.set("Content-Type", "text/csv");
        res.send(csv);
    });
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


// ✅ Fetch all faculty or hod data (no year/branch filter)
app.get("/api/get-table-data-simple", (req, res) => {
  const { table } = req.query;
  if (!["faculty", "hod_details"].includes(table))
    return res.status(400).json({ error: "Invalid table" });

  con.query(`SELECT * FROM ${table}`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ Update specific record (faculty or HOD)
app.post("/api/update/:table", (req, res) => {
  const { table } = req.params;
  const { row } = req.body;

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

// ✅ Delete specific record (faculty or HOD)
app.delete("/api/delete-row/:table/:id", (req, res) => {
  const { table, id } = req.params;
  const idField = table === "faculty" ? "facultyId" : "hod_id";

  con.query(`DELETE FROM ${table} WHERE ${idField}=?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Row deleted successfully." });
  });
});


//------------------




const PORT = process.env.PORT || 9812;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


