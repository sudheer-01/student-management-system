/*************************************************
 * CHART PLUGIN – VALUES ON BARS
 *************************************************/
Chart.register({
  id: "valueOnBar",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value === 0 || value == null) return;
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(value, bar.x, bar.y - 5);
      });
    });
  }
});

/*************************************************
 * GLOBAL STATE
 *************************************************/
let marksChartInstances = [];
let currentData = [];

/*************************************************
 * DOM REFERENCES (VERY IMPORTANT)
 *************************************************/
const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const subjectSelect = document.getElementById("subject");

const subjectWrapper = document.getElementById("subjectWrapper");
const performanceConfig = document.getElementById("performanceConfig");
const generateBtn = document.getElementById("generateAnalysisBtn");
const chartsContainer = document.getElementById("chartsContainer");
const studentControls = document.getElementById("studentPerformanceControls");

/*************************************************
 * HELPERS
 *************************************************/
function clearCharts() {
  marksChartInstances.forEach(c => c.destroy());
  marksChartInstances = [];
  chartsContainer.innerHTML = "";
}

function resetAnalysisUI() {
  performanceConfig.style.display = "none";
  performanceConfig.innerHTML = "";
  generateBtn.style.display = "none";
  subjectWrapper.style.display = "none";
  studentControls.style.display = "none";
  clearCharts();
}

async function populateDropdown(select, url, valueKey, textKey) {
  const res = await fetch(url);
  const data = await res.json();
  select.innerHTML = `<option value="">Select</option>`;
  data.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[textKey];
    select.appendChild(opt);
  });
}

/*************************************************
 * INITIAL LOAD – YEARS
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const storedYears = localStorage.getItem("hodYears");
  if (!storedYears) return;

  JSON.parse(storedYears).forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = `${y} Year`;
    yearSelect.appendChild(opt);
  });
});

/*************************************************
 * YEAR → BRANCH
 *************************************************/
yearSelect.addEventListener("change", async () => {
  resetAnalysisUI();
  const year = yearSelect.value;
  if (!year) return;

  const hodBranch = localStorage.getItem("hodBranch") || "";
  await populateDropdown(branchSelect, `/getbranches/${year}/${hodBranch}`, "branch_name", "branch_name");
});

/*************************************************
 * SUBJECT EXAM ANALYSIS
 *************************************************/
async function loadSubjectExamAnalysis() {
  resetAnalysisUI();

  if (!yearSelect.value || !branchSelect.value) {
    alert("Please select Year and Section");
    return;
  }

  subjectWrapper.style.display = "flex";
  await populateDropdown(
    subjectSelect,
    `/getSubjects/${yearSelect.value}/${branchSelect.value}`,
    "subject_name",
    "subject_name"
  );
}

subjectSelect.addEventListener("change", async () => {
  const subject = subjectSelect.value;
  if (!subject) return;

  performanceConfig.style.display = "block";
  performanceConfig.innerHTML = "<h3>Select Exams</h3>";

  const exams = await (await fetch(`/getExams?year=${yearSelect.value}&branch=${branchSelect.value}`)).json();
  const maxMap = await (await fetch(`/getExamMaxMarksAll/${yearSelect.value}/${branchSelect.value}`)).json();

  performanceConfig.innerHTML += `
    <div class="exam-checkboxes">
      ${exams.map(e => `
        <label>
          <input type="checkbox" class="examCheck" data-exam="${e}" data-max="${maxMap[e]}">
          ${e} (Max ${maxMap[e]})
        </label>
      `).join("")}
    </div>
    <div id="examConfigs"></div>
  `;
});

/*************************************************
 * EXAM CHECKBOX → CONFIG
 *************************************************/
document.addEventListener("change", e => {
  if (!e.target.classList.contains("examCheck")) return;

  const exam = e.target.dataset.exam;
  const max = e.target.dataset.max;
  const container = document.getElementById("examConfigs");

  if (!e.target.checked) {
    document.getElementById(`cfg-${exam}`)?.remove();
    return;
  }

  const div = document.createElement("div");
  div.id = `cfg-${exam}`;
  div.className = "exam-config";
  div.innerHTML = `
    <h4>${exam} (Max ${max})</h4>
    <label>Performance Levels</label>
    <select class="levelCount" data-exam="${exam}">
      <option value="">Select</option>
      ${[2,3,4,5].map(n => `<option>${n}</option>`).join("")}
    </select>
    <div id="ranges-${exam}"></div>
  `;
  container.appendChild(div);

  generateBtn.style.display = "inline-block";
});

/*************************************************
 * LEVEL SELECTION → RANGE INPUTS
 *************************************************/
document.addEventListener("change", e => {
  if (!e.target.classList.contains("levelCount")) return;

  const exam = e.target.dataset.exam;
  const count = +e.target.value;
  const container = document.getElementById(`ranges-${exam}`);
  container.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    container.innerHTML += `
      <div>
        <input type="number" placeholder="From">
        <input type="number" placeholder="To">
      </div>
    `;
  }
});

/*************************************************
 * GENERATE ANALYSIS
 *************************************************/
function createStudentRangeTable(exam, ranges, students) {
    const wrapper = document.createElement("div");
    wrapper.className = "student-range-wrapper";

    const table = document.createElement("table");
    table.className = "student-range-table";

    // Header
    const headerRow = document.createElement("tr");
    ranges.forEach(r => {
        const th = document.createElement("th");
        th.textContent = r.label;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Body row
    const bodyRow = document.createElement("tr");
    ranges.forEach(r => {
        const td = document.createElement("td");

        const matched = students.filter(
            s => s.marks >= r.from && s.marks <= r.to
        );

        if (matched.length === 0) {
            td.innerHTML = "<em>No students</em>";
        } else {
            matched.forEach(s => {
                const div = document.createElement("div");
                div.textContent = `${s.htno} - ${s.name} (${s.marks})`;
                td.appendChild(div);
            });
        }

        bodyRow.appendChild(td);
    });

    table.appendChild(bodyRow);
    wrapper.appendChild(table);
    return wrapper;
}

generateBtn.onclick = async () => {
    clearCharts();

    const year = yearSelect.value;
    const branch = branchSelect.value;
    const subject = subjectSelect.value;

    if (!year || !branch || !subject) {
        alert("Please select Year, Section and Subject");
        return;
    }

    const configs = document.querySelectorAll(".exam-config");

    for (const cfg of configs) {
        const exam = cfg.querySelector(".levelCount")?.dataset.exam;
        if (!exam) continue;

        // 🔹 Collect ranges
        const inputs = cfg.querySelectorAll("input");
        const ranges = [];

        for (let i = 0; i < inputs.length; i += 2) {
            if (!inputs[i].value || !inputs[i + 1].value) continue;

            ranges.push({
                label: `${inputs[i].value}-${inputs[i + 1].value}`,
                from: parseInt(inputs[i].value),
                to: parseInt(inputs[i + 1].value)
            });
        }

        if (ranges.length === 0) continue;

        // 🔹 Fetch students
        const res = await fetch(
            `/getStudentReports/${year}/${branch}/${subject}/${exam}`
        );
        const students = await res.json();

        // 🔹 Count students per range
        const counts = ranges.map(r =>
            students.filter(s => s.marks >= r.from && s.marks <= r.to).length
        );

        // 🔹 Chart box
        const chartBox = document.createElement("div");
        chartBox.className = "analysis-block";

        chartBox.innerHTML = `
            <div class="chart-container">
                <canvas></canvas>
            </div>

            <button class="view-students-btn">
                View Students in Each Performance Level
            </button>

            <div class="students-container" style="display:none;"></div>
        `;


        chartsContainer.appendChild(chartBox);

        // 🔹 Draw chart
        const chart = new Chart(chartBox.querySelector("canvas"), {
            type: "bar",
            data: {
                labels: ranges.map(r => r.label),
                datasets: [{
                    label: `${exam} Performance Distribution`,
                    data: counts,
                    backgroundColor: "rgba(54,162,235,0.7)"
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${subject} – ${exam} Performance Distribution`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Number of Students"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Marks Range"
                        }
                    }
                }
            }
        });

        marksChartInstances.push(chart);

        // 🔹 View Students toggle
        const viewBtn = chartBox.querySelector(".view-students-btn");
        const studentsDiv = chartBox.querySelector(".students-container");

        viewBtn.onclick = () => {
            if (studentsDiv.innerHTML === "") {
                const table = createStudentRangeTable(exam, ranges, students);
                studentsDiv.appendChild(table);
            }

            studentsDiv.style.display =
                studentsDiv.style.display === "none" ? "block" : "none";
        };
    }
};

/*************************************************
 * SHOW STUDENT PERFORMANCE
 *************************************************/
async function showStudentPerformanceControls() {
  // Reset everything else
  resetAnalysisUI();

  if (!yearSelect.value || !branchSelect.value) {
    alert("Please select Year and Section first");
    return;
  }

  studentControls.style.display = "flex";

  try {
    const res = await fetch(`/getStudentsData/${yearSelect.value}/${branchSelect.value}`);
    const students = await res.json();

    const studentSelect = document.getElementById("studentHtno");
    studentSelect.innerHTML = `<option value="">Select Student</option>`;

    students.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.htno;
      opt.textContent = `${s.htno} - ${s.name}`;
      studentSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load students");
  }
}

/*************************************************
 * LOAD INDIVIDUAL STUDENT PERFORMANCE CHART
 *************************************************/
async function loadStudentPerformanceChart() {
  const htno = document.getElementById("studentHtno").value;
  if (!htno) {
    alert("Please select a student");
    return;
  }

  clearCharts();
  chartsContainer.innerHTML = "<p>Loading student performance...</p>";

  try {
    const res = await fetch(
      `/getIndividualStudentData/${htno}/${yearSelect.value}/${branchSelect.value}`
    );
    const result = await res.json();

    if (!result.data || result.data.length === 0) {
      chartsContainer.innerHTML = "<p>No data found</p>";
      return;
    }

    const exams = result.exams;
    const data = result.data;

    const subjects = data.map(d => d.subject);

    const datasets = exams.map((exam, i) => ({
      label: `${exam}`,
      data: data.map(d => d[exam] ?? 0),
      backgroundColor: `hsl(${i * 60}, 70%, 60%)`
    }));

    chartsContainer.innerHTML = `<div class="chart-container"><canvas id="studentChart"></canvas></div>`;

    const ctx = document.getElementById("studentChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels: subjects, datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Student Performance – ${data[0].name} (${htno})`
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Marks" } },
          x: { title: { display: true, text: "Subjects" } }
        }
      }
    });

    marksChartInstances.push(chart);
  } catch (err) {
    console.error(err);
    chartsContainer.innerHTML = "<p>Error loading student performance</p>";
  }
}
/*************************************************
 * COMPARATIVE INSIGHTS
 *************************************************/
function createCommonStudentTable(subjects, subjectData) {
    const wrapper = document.createElement("div");
    wrapper.className = "student-range-wrapper";
    const heading = document.createElement("h4");
    heading.textContent = "Common Students (All Selected Subjects)";
    wrapper.appendChild(heading);

    const table = document.createElement("table");
    table.className = "student-range-table";

    /* ===== HEADER ===== */
    const header = document.createElement("tr");
    header.innerHTML = `<th>HTNO</th><th>Name</th>`;
    subjects.forEach(sub => {
        header.innerHTML += `<th>${sub}</th>`;
    });
    table.appendChild(header);

    /* ===== FIND COMMON STUDENTS ===== */
    if (!subjects.length || !subjectData[subjects[0]]?.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="${subjects.length + 2}">
            <em>No data available</em>
        </td>`;
        table.appendChild(row);
        wrapper.appendChild(table);
        return wrapper;
    }

    let common = subjectData[subjects[0]].map(s => s.htno);


    subjects.slice(1).forEach(sub => {
        const set = subjectData[sub].map(s => s.htno);
        common = common.filter(h => set.includes(h));
    });

    if (!common.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="${subjects.length + 2}">
            <em>No common students</em>
        </td>`;
        table.appendChild(row);
        wrapper.appendChild(table);
        return wrapper;
    }

    /* ===== BODY ===== */
    common.forEach(htno => {
        const row = document.createElement("tr");
        const student = subjectData[subjects[0]].find(s => s.htno === htno);

        row.innerHTML = `<td>${htno}</td><td>${student.name}</td>`;

        subjects.forEach(sub => {
            const rec = subjectData[sub].find(s => s.htno === htno);
            row.innerHTML += `<td>${rec ? rec.marks : "-"}</td>`;
        });

        table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
}

function createStudentRangeTable(title, ranges, students) {
    const wrapper = document.createElement("div");
    wrapper.className = "student-range-wrapper";

    const heading = document.createElement("h4");
    heading.textContent = title;
    wrapper.appendChild(heading);

    const table = document.createElement("table");
    table.className = "student-range-table";

    const header = document.createElement("tr");
    ranges.forEach(r => {
        const th = document.createElement("th");
        th.textContent = r.label;
        header.appendChild(th);
    });
    table.appendChild(header);

    const body = document.createElement("tr");
    ranges.forEach(r => {
        const td = document.createElement("td");
        const matched = students.filter(s => s.marks >= r.from && s.marks <= r.to);

        if (!matched.length) {
            td.innerHTML = "<em>No students</em>";
        } else {
            matched.forEach(s => {
                const div = document.createElement("div");
                div.textContent = `${s.htno} - ${s.name} (${s.marks})`;
                td.appendChild(div);
            });
        }
        body.appendChild(td);
    });

    table.appendChild(body);
    wrapper.appendChild(table);
    return wrapper;
}

/*************************************************
 * COMPARATIVE INSIGHTS (FIXED)
 *************************************************/
async function loadComparativeInsightChart() {
    resetAnalysisUI();

    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        alert("Please select Year and Section");
        return;
    }

    const config = document.getElementById("comparativeConfig");
    config.style.display = "block";
    config.innerHTML = "<h3>Comparative Insights</h3>";

    const subjects = await (await fetch(`/getSubjects/${year}/${branch}`)).json();
    const exams = await (await fetch(`/getExams?year=${year}&branch=${branch}`)).json();
    const maxMap = await (await fetch(`/getExamMaxMarksAll/${year}/${branch}`)).json();

    config.innerHTML += `
        <h4>Select Subjects</h4>
        <div class="checkbox-group" id="ciSubjects">
            ${subjects.map(s => `
                <label>
                    <input type="checkbox" value="${s.subject_name}">
                    ${s.subject_name}
                </label>
            `).join("")}
        </div>

        <h4>Select Exams</h4>
        <div class="checkbox-group" id="ciExams">
            ${exams.map(e => `
                <label>
                    <input type="checkbox" class="ciExamCheck" data-exam="${e}" data-max="${maxMap[e]}">
                    ${e} (Max ${maxMap[e]})
                </label>
            `).join("")}
        </div>

        <div id="ciExamConfigs"></div>
    `;

    document.getElementById("generateComparativeBtn").style.display = "inline-block";
}

/*************************************************
 * PER-EXAM CONFIG (NO DUPLICATE LEVELS)
 *************************************************/
document.addEventListener("change", e => {
    if (!e.target.classList.contains("ciExamCheck")) return;

    const exam = e.target.dataset.exam;
    const max = e.target.dataset.max;
    const container = document.getElementById("ciExamConfigs");

    if (!e.target.checked) {
        document.getElementById(`ci-${exam}`)?.remove();
        return;
    }

    const block = document.createElement("div");
    block.className = "exam-config";
    block.id = `ci-${exam}`;
    block.innerHTML = `
        <h4>${exam} (Max ${max})</h4>
        <label>Performance Levels</label>
        <select class="ciLevelCount" data-exam="${exam}">
            <option value="">Select</option>
            ${[2,3,4,5].map(n => `<option value="${n}">${n}</option>`).join("")}
        </select>
        <div class="ciRanges" id="ranges-${exam}"></div>
        <hr/>
    `;
    container.appendChild(block);
});

document.addEventListener("change", e => {
    if (!e.target.classList.contains("ciLevelCount")) return;

    const exam = e.target.dataset.exam;
    const levels = +e.target.value;
    const box = document.getElementById(`ranges-${exam}`);
    box.innerHTML = "";

    for (let i = 1; i <= levels; i++) {
        box.innerHTML += `
            <div>
                <label>Level ${i}</label>
                <input type="number" placeholder="From">
                <input type="number" placeholder="To">
            </div>
        `;
    }
});

/*************************************************
 * GENERATE COMPARATIVE ANALYSIS
 *************************************************/
document.getElementById("generateComparativeBtn").onclick = async () => {
    clearCharts();

    const subjects = [...document.querySelectorAll("#ciSubjects input:checked")].map(i => i.value);
    const exams = [...document.querySelectorAll(".ciExamCheck:checked")].map(i => i.dataset.exam);

    if (!subjects.length || !exams.length) {
        alert("Select subjects and exams");
        return;
    }

    for (const exam of exams) {
        const inputs = document.querySelectorAll(`#ranges-${exam} input`);
        const ranges = [];

        for (let i = 0; i < inputs.length; i += 2) {
            ranges.push({
                label: `${inputs[i].value}-${inputs[i+1].value}`,
                from: +inputs[i].value,
                to: +inputs[i+1].value
            });
        }

        const subjectData = {};
        for (const subject of subjects) {
            subjectData[subject] = await (await fetch(
                `/getStudentReports/${yearSelect.value}/${branchSelect.value}/${subject}/${exam}`
            )).json();
        }

        /* ===== GROUPED SUBJECT COMPARISON GRAPH ===== */

        // Prepare datasets (one dataset per subject)
        const datasets = subjects.map((subject, idx) => ({
            label: subject,
            data: ranges.map(r =>
                subjectData[subject].filter(
                    s => s.marks >= r.from && s.marks <= r.to
                ).length
            ),
            backgroundColor: `hsl(${idx * 70}, 70%, 60%)`
        }));

        const block = document.createElement("div");
        block.className = "analysis-block";

        block.innerHTML = `
            <h4>${exam} – Subject Comparison</h4>
            <div class="chart-container"><canvas></canvas></div>
            <button class="view-students-btn">View Students</button>
            <div class="students-container" style="display:none;"></div>
        `;

        chartsContainer.appendChild(block);

        // Create grouped bar chart
        const chart = new Chart(block.querySelector("canvas"), {
            type: "bar",
            data: {
                labels: ranges.map(r => r.label),
                datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${exam} – Subject-wise Performance`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Number of Students" }
                    },
                    x: {
                        title: { display: true, text: "Performance Levels" }
                    }
                }
            }
        });

        marksChartInstances.push(chart);


        /* ===== COMMON STUDENTS ===== */
        const commonCounts = ranges.map(r => {
            let common = subjectData[subjects[0]]
                .filter(s => s.marks >= r.from && s.marks <= r.to)
                .map(s => s.htno);

            subjects.slice(1).forEach(sub => {
                const set = subjectData[sub]
                    .filter(s => s.marks >= r.from && s.marks <= r.to)
                    .map(s => s.htno);
                common = common.filter(h => set.includes(h));
            });

            return common.length;
        });

        const commonBlock = document.createElement("div");
        commonBlock.className = "analysis-block";
        commonBlock.innerHTML = `
            <h4>Common Students – ${exam}</h4>
            <div class="chart-container"><canvas></canvas></div>
            <button class="view-students-btn">View Common Students</button>
            <div class="students-container" style="display:none;"></div>
        `;
        chartsContainer.appendChild(commonBlock);
        const commonBtn = commonBlock.querySelector(".view-students-btn");
        const commonBox = commonBlock.querySelector(".students-container");

        commonBtn.onclick = () => {
            if (commonBox.innerHTML !== "") {
                commonBox.innerHTML = "";
                commonBox.style.display = "none";
                return;
            }

            ranges.forEach(range => {
                // ===== HEADING FOR RANGE =====
                const heading = document.createElement("h4");
                heading.textContent = `Level: ${range.label}`;
                commonBox.appendChild(heading);

                // ===== FIND COMMON STUDENTS IN THIS RANGE =====
                let common = subjectData[subjects[0]]
                    .filter(s => s.marks >= range.from && s.marks <= range.to)
                    .map(s => s.htno);

                subjects.slice(1).forEach(sub => {
                    const set = subjectData[sub]
                        .filter(s => s.marks >= range.from && s.marks <= range.to)
                        .map(s => s.htno);
                    common = common.filter(h => set.includes(h));
                });

                // ===== TABLE =====
                const table = document.createElement("table");
                table.className = "student-range-table";

                const header = document.createElement("tr");
                header.innerHTML = `<th>HTNO</th><th>Name</th>`;
                subjects.forEach(sub => header.innerHTML += `<th>${sub}</th>`);
                table.appendChild(header);

                if (!common.length) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td colspan="${subjects.length + 2}">
                            <em>No common students in this range</em>
                        </td>`;
                    table.appendChild(row);
                } else {
                    common.forEach(htno => {
                        const row = document.createElement("tr");
                        const student = subjectData[subjects[0]].find(s => s.htno === htno);

                        row.innerHTML = `<td>${htno}</td><td>${student.name}</td>`;

                        subjects.forEach(sub => {
                            const rec = subjectData[sub].find(s => s.htno === htno);
                            row.innerHTML += `<td>${rec ? rec.marks : "-"}</td>`;
                        });

                        table.appendChild(row);
                    });
                }

                commonBox.appendChild(table);
            });

            commonBox.style.display = "block";
        };

        new Chart(commonBlock.querySelector("canvas"), {
            type: "bar",
            data: {
                labels: ranges.map(r => r.label),
                datasets: [{
                    label: "Common Students",
                    data: commonCounts,
                    backgroundColor: "rgba(220,38,38,0.7)"
                }]
            }
        });

        const viewBtn = block.querySelector(".view-students-btn");
        const box = block.querySelector(".students-container");

        viewBtn.onclick = () => {
            if (box.innerHTML !== "") {
                box.innerHTML = "";
                box.style.display = "none";
                return;
            }

            const table = document.createElement("table");
            table.className = "student-range-table";

            /* ===== HEADER: RANGES ===== */
            const header = document.createElement("tr");
            ranges.forEach(r => {
                header.innerHTML += `<th>${r.label}</th>`;
            });
            table.appendChild(header);

            /* ===== BODY: ONE CELL PER RANGE ===== */
            const body = document.createElement("tr");

            ranges.forEach(range => {
                const td = document.createElement("td");

                subjects.forEach(subject => {
                    const title = document.createElement("strong");
                    title.textContent = subject;
                    td.appendChild(title);

                    const matched = subjectData[subject].filter(
                        s => s.marks >= range.from && s.marks <= range.to
                    );

                    if (!matched.length) {
                        const em = document.createElement("div");
                        em.innerHTML = "<em>No students</em>";
                        td.appendChild(em);
                    } else {
                        matched.forEach(s => {
                            const div = document.createElement("div");
                            div.textContent = `${s.htno} - ${s.name} (${s.marks})`;
                            td.appendChild(div);
                        });
                    }

                    td.appendChild(document.createElement("hr"));
                });

                body.appendChild(td);
            });

            table.appendChild(body);
            box.appendChild(table);
            box.style.display = "block";
        };


    };

};

