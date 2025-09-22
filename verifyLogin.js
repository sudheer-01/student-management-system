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
app.use(express.static(path.join(baseDir,"HodTask")));
app.use(express.static(path.join(baseDir,"HodTask","HodDashboard")));
app.use(express.static(path.join(baseDir,"HodTask","EnterStudentDetails")));
app.use(express.static(path.join(baseDir,"HodTask","addBranchesAndSubjects")));
app.use(express.static(path.join(baseDir,"HodTask","viewFacultyRequests")));
app.use(express.static(path.join(baseDir,"HodTask","addAndChangeExams")));
app.use(express.static(path.join(baseDir,"HodTask","generateStudentReports")));
app.use(express.static(path.join(baseDir,"HodTask","viewMarksUpdateRequests")));
//student
app.use(express.static(path.join(baseDir,"studentsMarks")));
//admin
app.use(express.static(path.join(baseDir,"admin")));

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
                return res.status(401).json({ success: false, message: "Invalid Faculty ID or Password. Contact Admin to reset Password." });
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

var hodName = ""; //g
var hodBranch = ""; //g
var hodYears; //g
app.post("/loginToHodDashBoard", (req, res) => {
    const hodId = req.body.HodId;
    const passwordOfHod = req.body.passwordOfHod;

    con.query(
        "SELECT name, branch, year FROM hod_details WHERE hod_id=? AND password=? AND status = 'Approved'",
        [hodId, passwordOfHod],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server error. Try again later.");
            }
            if (result.length > 0) {
                // Store HOD details in global variables
                hodName = result[0].name;
                hodBranch = result[0].branch;
                
                // Convert ENUM year value to an array
                hodYears = result[0].year.split(","); 

                res.sendFile(path.join(baseDir, "HodTask", "HodDashboard", "HodDashboard.html"));
            } else {
                return res.send(
                    `<script>alert('Invalid HOD ID or Password. Contact Admin to reset password.'); window.location.href='/';</script>`
                );
            }
        }
    );
});
//this to display hod details like name, years, branch dynmically when the dom content loaded
//this is for above code
app.get("/getHodDetails", (req, res) => {
    if (hodName && hodBranch && hodYears) {
        res.json({
            hodName,
            hodBranch,
            hodYears
        });
    } else {
        res.status(400).json({ error: "HOD details not found. Please log in again." });
    }
});


//from HodTask:::EnterStudentDetails
//--------------------------------
//here we are taking the year and branch like 2nd years having csm-a csm -b
// app.post("/toGetBranchAndYearOfHod", (req, res) => {
//   branchOfSpecificDepartmentHod = req.body.branch;
//   yearOfSpecificDepartmentHod = parseInt(req.body.year);
// });
//--------------------------------
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
    let branch = approvedBranch; //g
    let year = approvedYear; //g

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
    let subjectName = approvedSubject; // Ensure this has the correct value //g
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
    let branch = approvedBranch; //g
    let year = approvedYear; //g
    let subject = approvedSubject; //g
    let examColumn = req.query.exam;  // Get exam name from frontend

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
app.get("/getOverallMarks", (req, res) => {
    let branch = approvedBranch;  // g
    let year = approvedYear;        // g
    let subject =  approvedSubject;  // g

    // Query to get exam columns dynamically
    con.query("SHOW COLUMNS FROM studentmarks", (err, columns) => {
        if (err) {
            console.error("Error fetching column names:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        // Extract column names excluding non-exam fields
        let examColumns = columns
            .map(col => col.Field)
            .filter(col => !["year", "branch", "htno", "name", "subject"].includes(col));

        // Construct SQL Query to fetch data dynamically
        let sqlQuery = `SELECT htno, name, ${examColumns.join(", ")} FROM studentmarks WHERE branch = ? AND year = ? AND subject = ?`;

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
    let exam = req.query.exam;
    let branch = approvedBranch; //g
    let year = approvedYear;  //g
    let subject = approvedSubject; //g
    
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
    let branch = approvedBranch;
    let year = approvedYear;
    let subject = approvedSubject;
    let facultyName = null // Assuming faculty ID is stored

    let query = `INSERT INTO pending_marks_updates 
        (htno, name, year, branch, subject, exam, old_marks, new_marks, requested_by, request_status) 
        VALUES ?`;

    let values = updateRequests
        .filter(({ newMarks }) => newMarks !== "" && newMarks !== null) // Ensure newMarks is valid
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


// Update student marks--------------------------------------------------
// app.post("/updateStudentMarks", (req, res) => {
//     let updatedMarks = req.body.marks;
//     let branch = approvedBranch;
//     let year = approvedYear;
//     let subject = approvedSubject;

//     let query = `UPDATE studentMarks SET ?? = ? WHERE htno = ? AND branch = ? AND year = ? AND subject = ?`;

//     let promises = updatedMarks.map(({ htno, exam, marks }) => {
//         return new Promise((resolve, reject) => {
//             con.query(query, [exam, marks, htno, branch, year, subject], (err, result) => {
//                 if (err) {
//                     console.error("Error updating marks:", err);
//                     reject(err);
//                 } else {
//                     resolve(result);
//                 }
//             });
//         });
//     });

//     Promise.all(promises)
//         .then(() => res.json({ success: true, message: "Marks updated successfully" }))
//         .catch(() => res.status(500).json({ success: false, message: "Database error" }));
// });

//-----------------------------------------------------------------------------------------

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

//HodTask:::viewFacultyRequests
// Retrieve pending faculty requests for HOD based on branch
// app.get("/hodRequests/:branch", (req, res) => {
//     const { branch } = req.params;
    
//     const query = "SELECT faculty_Id, facultyName, year, subject, status FROM faculty_requests WHERE branch = ? AND status = 'Pending'";
//     con.query(query, [branch], (err, result) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

//by hod
// app.post("/updateRequestStatus", (req, res) => {
//     const { facultyId, status } = req.body;

//     const query = "UPDATE faculty_requests SET status = ? WHERE faculty_Id = ?";
//     con.query(query, [status, facultyId], (err, result) => {
//         if (err) {
//             console.error("Database update error:", err);
//             return res.status(500).send(err);
//         }
//         res.send({ message: "Status updated successfully." });
//     });
// });

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
app.get("/getYears", (req, res) => {
    res.json(hodYears.map(year => ({ year })));
});
app.get("/getBranches/:year", (req, res) => {
    const { year } = req.params;

    let query;
    let params;

    if (year === "1") {
        // Fetch only 1st-year branches
        query = "SELECT DISTINCT branch_name FROM branches WHERE year = ?";
        params = [1];
    } else {
        // Fetch only HOD-related branches for other years
        query = "SELECT branch_name FROM branches WHERE year = ? AND branch_name LIKE ?";
        params = [year, `%${hodBranch}%`];
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


//HodTask:::addAndChangeExams
//-------------------
// app.post("/addExams", (req, res) => {
//     const { year, branch, exams } = req.body;

//     if (!year || !branch || !Array.isArray(exams) || exams.length === 0) {
//         return res.status(400).send("Invalid input!");
//     }

//     // Convert array to JSON
//     const examsJSON = JSON.stringify(exams);

//     // Insert or update the exams list for the branch
//     const insertQuery = `
//         INSERT INTO examsOfSpecificYearAndBranch (year, branch, exams) 
//         VALUES (?, ?, ?) 
//         ON DUPLICATE KEY UPDATE exams = VALUES(exams)`;

//     con.query(insertQuery, [year, branch, examsJSON], (err) => {
//         if (err) {
//             console.error("Error inserting exams:", err);
//             return res.status(500).send("Database error");
//         }

//         // Dynamically alter `studentMarks` table to add the new exams as columns
//         const alterQueries = exams.map(exam => `ALTER TABLE studentMarks ADD COLUMN ${exam} INT DEFAULT NULL`);
        
//         // Execute all ALTER statements
//         Promise.all(alterQueries.map(query => new Promise((resolve, reject) => {
//             con.query(query, (err) => err ? reject(err) : resolve());
//         })))
//         .then(() => res.send("Exams added successfully and studentMarks table updated!"))
//         .catch(error => {
//             console.error("Error updating studentMarks:", error);
//             res.status(500).send("Error updating studentMarks table");
//         });
//     });
// });

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



// app.get("/getExams/:year/:branch", (req, res) => {
//     const { year, branch } = req.params;

//     con.query("SELECT exams FROM examsOfSpecificYearAndBranch WHERE year = ? AND branch = ?", [year, branch], (err, result) => {
//         if (err) return res.status(500).send(err);
//         if (result.length === 0) return res.json([]);

//         const examsList = JSON.parse(result[0].exams);
//         res.json(examsList);
//     });
// });
//----------------------------------------

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
var stuYear = 0;
var stuHtno = "";
app.post("/studentCheckin", (req, res) => {
    stuYear = req.body.year;
    stuHtno = req.body.htno;
    con.query(
        "SELECT * FROM studentmarks WHERE year=? AND htno=?",
        [stuYear, stuHtno],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server error. Try again later.");
            }
            if (result.length > 0) {
                return res.sendFile(path.join(baseDir, "studentsMarks","studentsMarks.html"));
            } else {
                return res.send(
                    `<script>alert('Invalid HTNO or Year'); window.location.href='/';</script>`
                );
            }
        }
    );
});

app.post("/studentDashboard", (req, res) => {
    //console.log("Received request at /studentDashboard");

    let year = stuYear; // Already stored in backend
    let htno = stuHtno; // Already stored in backend

    //console.log(`Backend using HTNO: ${htno}, Year: ${year}`);

    if (!year || !htno) {
        console.error("Session expired or invalid credentials.");
        return res.status(400).json({ error: "Session expired or invalid credentials." });
    }

    const getColumnsQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'studentmarks' 
    AND COLUMN_NAME NOT IN ('year', 'branch', 'htno', 'name', 'subject')
`;

    con.query(getColumnsQuery, (colErr, colResults) => {
        if (colErr) {
            console.error("Error fetching columns:", colErr);
            return res.status(500).json({ error: "Error retrieving exam details." });
        }

        // Extract column names and wrap them in backticks to avoid SQL syntax errors
        const examColumns = colResults.map(col => `\`${col.COLUMN_NAME}\``);
        //console.log("Exam Columns:", examColumns); // Debugging: Check the extracted columns

        const getStudentQuery = `
            SELECT year, branch, htno, name, subject, ${examColumns.join(", ")}
            FROM studentmarks 
            WHERE year = ? AND htno = ?
        `;

        con.query(getStudentQuery, [year, htno], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Server error. Try again later." });
            }

            if (results.length === 0) {
                console.warn("Invalid HTNO or Year.");
                return res.status(404).json({ error: "Invalid HTNO or Year" });
            }

            const studentInfo = {
                year: results[0].year,
                branch: results[0].branch,
                htno: results[0].htno,
                name: results[0].name,
                subjects: results.map(row => {
                    let marks = {};
                    colResults.forEach(col => {
                        marks[col.COLUMN_NAME] = row[col.COLUMN_NAME] !== null ? row[col.COLUMN_NAME] : "N/A";
                    });
                    return { subject: row.subject, marks };
                }),
            };

        //console.log("Sending student data:", studentInfo); // Debugging: Ensure data is formatted correctly
        res.json(studentInfo);
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
                    `<script>alert('Invalid Faculty ID or Password'); window.location.href='/';</script>`
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
            let column = exam.toLowerCase().includes("unit_test") ? "Unit_test_1" : "mid_1";

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




const PORT = process.env.PORT || 9812;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


