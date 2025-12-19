Chart.register({
    id: 'valueOnBar',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index];
                if (value === 0) return;

                ctx.fillStyle = "#000";
                ctx.font = "bold 12px Segoe UI";
                ctx.textAlign = "center";
                ctx.fillText(value, bar.x, bar.y - 5);
            });
        });
    }
});


// Store chart instances to destroy them before creating new ones
if (!window.marksChartInstances) {
    window.marksChartInstances = [];
}
// Store fetched data globally for reuse
let currentData = [];

// Utility to populate dropdowns (only for subjects, students, etc.)
async function populateDropdown(selectElement, url, valueKey, textKey) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        selectElement.innerHTML = '<option value="">Select an option</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error(`Error fetching data for ${selectElement.id}:`, error);
        alert(`Error loading ${selectElement.id}.`);
    }
}

async function populateBranches(year) {
    const branchSelect = document.getElementById("branch");
    const hodBranch = localStorage.getItem("hodBranch") || "";
    await populateDropdown(branchSelect, `/getbranches/${year}/${hodBranch}`, 'branch_name', 'branch_name');
}

async function populateSubjects(year, branch) {
    const subjectSelect = document.getElementById("subject");
    await populateDropdown(subjectSelect, `/getSubjects/${year}/${branch}`, 'subject_name', 'subject_name');
    subjectSelect.parentElement.style.display = "block"; // show wrapper div
}

function clearCharts() {
    window.marksChartInstances.forEach(instance => instance.destroy());
    window.marksChartInstances = [];

    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = ''; // Clear previous charts
}

// SUBJECT EXAM ANALYSIS
async function loadSubjectExamAnalysis() {
    resetAnalysisUI(); // 👈 ensures clean state

    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        alert("Please select Year and Section.");
        return;
    }

    document.getElementById("subjectWrapper").style.display = "block";
    await populateSubjects(year, branch);
}

document.getElementById("subject").addEventListener("change", loadPerformanceConfig);
subjectSelect.onchange = async () => {
    const subject = subjectSelect.value;
    if (!subject) return;

    resetAnalysisUI();

    const year = yearSelect.value;
    const branch = branchSelect.value;

    const examRes = await fetch(`/getExams?year=${year}&branch=${branch}`);
    const exams = await examRes.json();

    const maxMarksRes = await fetch(`/getExamMaxMarksAll/${year}/${branch}`);
    const maxMarksMap = await maxMarksRes.json();

    const configDiv = document.getElementById("performanceConfig");
    configDiv.style.display = "block";

    configDiv.innerHTML = `
        <h3>Select Exams for Analysis</h3>
        <div class="exam-checkboxes">
            ${exams.map(exam => `
                <label>
                    <input type="checkbox" class="examCheck" data-exam="${exam}" data-max="${maxMarksMap[exam]}">
                    ${exam} (Max: ${maxMarksMap[exam]})
                </label>
            `).join("")}
        </div>
        <div id="examConfigs"></div>
    `;
};

document.addEventListener("change", e => {
    if (!e.target.classList.contains("examCheck")) return;

    const exam = e.target.dataset.exam;
    const max = e.target.dataset.max;
    const container = document.getElementById("examConfigs");

    // Remove config if unchecked
    if (!e.target.checked) {
        document.getElementById(`config-${exam}`)?.remove();
        return;
    }

    const block = document.createElement("div");
    block.id = `config-${exam}`;
    block.className = "exam-config";
    block.innerHTML = `
        <h4>${exam} (Max Marks: ${max})</h4>
        <label>Performance Levels:</label>
        <select class="levelCount" data-exam="${exam}">
            <option value="">Select</option>
            ${[2,3,4,5].map(n => `<option value="${n}">${n}</option>`).join("")}
        </select>
        <div class="rangeInputs" id="ranges-${exam}"></div>
        <hr/>
    `;
    container.appendChild(block);

    document.getElementById("generateAnalysisBtn").style.display = "inline-block";
});

async function loadPerformanceConfig() {
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
    const subject = document.getElementById("subject").value;

    if (!subject) return;

    clearCharts();

    const configDiv = document.getElementById("performanceConfig");
    const generateBtn = document.getElementById("generateAnalysisBtn");

    configDiv.innerHTML = "";
    configDiv.style.display = "block";
    generateBtn.style.display = "block";

    // Fetch exams
    const examRes = await fetch(`/getExams?year=${year}&branch=${branch}`);
    const exams = await examRes.json();

    // Fetch max marks
    const maxMarksRes = await fetch(`/getExamMaxMarksAll/${year}/${branch}`);
    const maxMarksMap = await maxMarksRes.json();

    exams.forEach(exam => {
        const max = maxMarksMap[exam];

        const block = document.createElement("div");
        block.className = "exam-config";
        block.innerHTML = `
            <h4>${exam} (Max Marks: ${max})</h4>
            <label>Number of Performance Levels:</label>
            <select data-exam="${exam}" data-max="${max}" class="levelCount">
                <option value="">Select</option>
                ${[2,3,4,5,6].map(n => `<option value="${n}">${n}</option>`).join("")}
            </select>
            <div class="rangeInputs" id="ranges-${exam}"></div>
            <hr/>
        `;
        configDiv.appendChild(block);
    });
}

function resetAnalysisUI() {
    // Hide Subject Exam Analysis UI
    document.getElementById("performanceConfig").style.display = "none";
    document.getElementById("performanceConfig").innerHTML = "";
    document.getElementById("generateAnalysisBtn").style.display = "none";

    // Hide subject dropdown unless explicitly needed
    document.getElementById("subjectWrapper").style.display = "none";

    // Clear charts
    clearCharts();
}


document.addEventListener("change", e => {
    if (!e.target.classList.contains("levelCount")) return;

    const exam = e.target.dataset.exam;
    const max = parseInt(e.target.dataset.max);
    const levels = parseInt(e.target.value);

    const container = document.getElementById(`ranges-${exam}`);
    container.innerHTML = "";

    for (let i = 1; i <= levels; i++) {
        container.innerHTML += `
            <div>
                <label>Level ${i} Range:</label>
                <input type="number" placeholder="From" class="from-${exam}">
                <input type="number" placeholder="To" class="to-${exam}">
            </div>
        `;
    }
});
document.getElementById("generateAnalysisBtn").onclick = async () => {
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
    const subject = document.getElementById("subject").value;
    const chartsContainer = document.getElementById("chartsContainer");

    chartsContainer.innerHTML = "";

    const examBlocks = document.querySelectorAll(".exam-config");

    for (const block of examBlocks) {
        const exam = block.querySelector(".levelCount")?.dataset.exam;
        if (!exam) continue;

        const fromInputs = block.querySelectorAll(`[class^="from-${exam}"]`);
        const toInputs = block.querySelectorAll(`[class^="to-${exam}"]`);

        const ranges = [];
        for (let i = 0; i < fromInputs.length; i++) {
            ranges.push({
                label: `${fromInputs[i].value}-${toInputs[i].value}`,
                from: parseInt(fromInputs[i].value),
                to: parseInt(toInputs[i].value)
            });
        }

        const res = await fetch(`/getStudentReports/${year}/${branch}/${subject}/${exam}`);
        const data = await res.json();

        const counts = ranges.map(r =>
            data.filter(s => s.marks >= r.from && s.marks <= r.to).length
        );

        const chartBox = document.createElement("div");
        chartBox.className = "chart-container";
        chartBox.innerHTML = `<canvas></canvas>`;
        chartsContainer.appendChild(chartBox);

        new Chart(chartBox.querySelector("canvas"), {
            type: "bar",
            data: {
                labels: ranges.map(r => r.label),
                datasets: [{
                    label: `${exam} Performance Distribution`,
                    data: counts,
                    backgroundColor: "rgba(54, 162, 235, 0.7)"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${subject} – ${exam} Performance Distribution`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Number of Students" }
                    },
                    x: {
                        title: { display: true, text: "Marks Range" }
                    }
                }
            }
        });
    }
};



// STUDENT PERFORMANCE (BAR CHART)
function showStudentPerformanceControls() {
    resetAnalysisUI(); //  THIS fixes your issue
    const studentControls = document.getElementById("studentPerformanceControls");
    studentControls.style.display = 'flex';

    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    fetch(`/getStudentsData/${year}/${branch}`)
        .then(response => response.json())
        .then(data => {
            currentData = data;
            const studentSelect = document.getElementById("studentHtno");
            studentSelect.innerHTML = '<option value="">Select Student</option>' +
                data.map(s => `<option value="${s.htno}">${s.htno} - ${s.name}</option>`).join('');
        })
        .catch(error => console.error("Error fetching student data:", error));
}

async function loadStudentPerformanceChart() {
    const htno = document.getElementById("studentHtno").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
  const chartsContainer = document.getElementById("chartsContainer");
  chartsContainer.innerHTML = "<p>Loading student data...</p>";

  try {
    const res = await fetch(`/getIndividualStudentData/${htno}/${year}/${branch}`);
    const result = await res.json();

    if (!result || !result.data || result.data.length === 0) {
      chartsContainer.innerHTML = "<p>No data found for this student.</p>";
      return;
    }

    const exams = result.exams; // dynamic exam list
    const studentData = result.data;

    // Step 1: Prepare labels (subjects)
    const subjects = studentData.map(s => s.subject);

    // Step 2: Prepare datasets (one per exam)
    const datasets = exams.map((exam, i) => ({
      label: exam.replace(/_/g, " ").toUpperCase(),
      data: studentData.map(s => s[exam] ?? 0),
      backgroundColor: `hsl(${i * 60}, 70%, 60%)`,
    }));

    // Step 3: Clear old chart and draw new
    chartsContainer.innerHTML = `<canvas id="studentChart"></canvas>`;
    const ctx = document.getElementById("studentChart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: subjects,
        datasets: datasets
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Marks" } },
          x: { title: { display: true, text: "Subjects" } }
        },
        plugins: {
          title: {
            display: true,
            text: `Performance Chart for ${studentData[0].name} (${htno})`
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    chartsContainer.innerHTML = "<p>Error loading chart.</p>";
  }
}
// COMPARATIVE INSIGHT (BAR CHART)
async function loadComparativeInsightChart() {
     resetAnalysisUI();
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    if (!year || !branch) return;

    clearCharts();
    document.getElementById("studentPerformanceControls").style.display = 'none';
    document.getElementById("subjectWrapper").style.display = "none";
    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = "<p>Loading comparative data...</p>";

    try {
        // Step 1: Fetch exams dynamically
        const examsResponse = await fetch(`/getExams?year=${year}&branch=${branch}`);
        const examKeys = await examsResponse.json();

        if (!examKeys || examKeys.length === 0) {
            chartsContainer.innerHTML = "<p>No exams found for this year & branch.</p>";
            return;
        }

        // Step 2: Fetch student marks (backend now returns only relevant columns)
        const response = await fetch(`/comparativemarks?year=${year}&branch=${branch}`);
        const data = await response.json();

        if (!data.length) {
            chartsContainer.innerHTML = '<p>No data found for comparative analysis.</p>';
            return;
        }

        // Step 3: Aggregate marks per subject per exam
        const subjectMarks = {}; // { subject: { exam1: [marks], ... } }
        data.forEach(item => {
            const subject = item.subject;
            if (!subjectMarks[subject]) {
                subjectMarks[subject] = {};
                examKeys.forEach(exam => subjectMarks[subject][exam] = []);
            }
            examKeys.forEach(exam => {
                if (item[exam] != null) subjectMarks[subject][exam].push(item[exam]);
            });
        });

        const subjects = Object.keys(subjectMarks);

        // Step 4: Clear container & draw charts
        chartsContainer.innerHTML = "";

        examKeys.forEach((exam, idx) => {
            const examData = subjects.map(subject => {
                const marksArray = subjectMarks[subject][exam];
                const total = marksArray.reduce((sum, val) => sum + val, 0);
                return marksArray.length ? total / marksArray.length : 0;
            });

            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);
            chartsContainer.appendChild(chartContainer);

            const ctx = canvas.getContext("2d");
            const chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: exam.replace(/_/g, " "),
                        data: examData,
                        backgroundColor: `rgba(${50 + idx*60}, ${100 + idx*40}, ${150 + idx*30}, 0.7)`
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Average Marks' } },
                        x: { title: { display: true, text: 'Subjects' } }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `Average Marks per Subject - ${exam.replace(/_/g, " ")}`,
                            font: { size: 16 }
                        },
                        legend: { display: false }
                    }
                }
            });

            window.marksChartInstances.push(chartInstance);
        });

    } catch (error) {
        console.error("Error loading comparative chart:", error);
        chartsContainer.innerHTML = "<p>Error loading comparative analysis.</p>";
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const yearSelect = document.getElementById("year");
    const branchSelect = document.getElementById("branch");
    const subjectSelect = document.getElementById("subject");

    // ✅ Load years from localStorage instead of API
    const storedYears = localStorage.getItem("hodYears");
    if (storedYears) {
        const years = JSON.parse(storedYears).map(y => parseInt(y, 10));
        yearSelect.innerHTML = '<option value="">Select Year</option>';
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = `${year} Year`;
            yearSelect.appendChild(option);
        });
    }

    yearSelect.addEventListener('change', async () => {
        const selectedYear = yearSelect.value;
        await populateBranches(selectedYear);
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        document.getElementById("subjectWrapper").style.display = "none"; // hide by default
    });

    branchSelect.addEventListener('change', () => {
        document.getElementById("subjectWrapper").style.display = "none"; // hide until Subject Exam Analysis is clicked
    });
});
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }