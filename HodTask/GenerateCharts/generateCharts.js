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
    const subjectWrapper = document.getElementById("subjectWrapper");
    const subjectSelect = document.getElementById("subject");
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    if (!year || !branch) {
        alert("Please select Year and Branch first.");
        return;
    }

    // Show subject dropdown only here
    subjectWrapper.style.display = "block";
    await populateSubjects(year, branch);

    // Wait until user selects a subject
    subjectSelect.onchange = async () => {
        const subject = subjectSelect.value;
        if (!subject) return;

        clearCharts();
        const chartsContainer = document.getElementById("chartsContainer");
        const studentControls = document.getElementById("studentPerformanceControls");
        studentControls.style.display = 'none';

        // Fetch available exams
        const examsResponse = await fetch(`/getExams?year=${year}&branch=${branch}`);
        const exams = await examsResponse.json();

        if (!exams || exams.length === 0) {
            chartsContainer.innerHTML = '<p>No exams found for the selected criteria.</p>';
            return;
        }

        // Fetch all student data to get all HTNOs
        const allStudentDataResponse = await fetch(`/getStudentReports/${year}/${branch}/${subject}/${exams[0]}`);
        const allStudentData = await allStudentDataResponse.json();

        const allHtnos = [...new Set(allStudentData.map(s => s.htno))];

        for (const exam of exams) {
            const response = await fetch(`/getStudentReports/${year}/${branch}/${subject}/${exam}`);
            const examData = await response.json();

            if (examData.length === 0) {
                chartsContainer.innerHTML += `<p>No data found for ${exam}.</p>`;
                continue;
            }

            const labels = allHtnos;
            const marksData = labels.map(htno => {
                const student = examData.find(s => s.htno === htno);
                return student ? student.marks : null;
            });

            const maxMark = Math.max(...marksData.filter(mark => mark !== null));

            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);
            chartsContainer.appendChild(chartContainer);

            const ctx = canvas.getContext("2d");
            const chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Marks',
                        data: marksData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: Math.ceil((maxMark + 5) / 5) * 5,
                            title: { display: true, text: 'Marks' }
                        },
                        x: {
                            title: { display: true, text: 'Hall Ticket Number' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `Student Marks - ${subject} (${exam})`,
                            font: { size: 16 }
                        }
                    }
                }
            });
            window.marksChartInstances.push(chartInstance);
        }
    };
}

// STUDENT PERFORMANCE (BAR CHART)
function showStudentPerformanceControls() {
    clearCharts();
    const subjectWrapper = document.getElementById("subjectWrapper");
    subjectWrapper.style.display = "none"; // hide subject dropdown
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
    const selectedHtno = document.getElementById("studentHtno").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    if (!selectedHtno || !year || !branch) return;
    try {
        // ✅ Retrieve data from the API
        const response = await fetch(`/getIndividualStudentData/${selectedHtno}/${year}/${branch}`);
        const studentData = await response.json();

        if (!studentData || studentData.length === 0) return;

        clearCharts();
        const chartsContainer = document.getElementById("chartsContainer");

        // Subjects = labels
        const subjects = studentData.map(s => s.subject);

        // Exams = Unit_test_1, Mid_1, Unit_test_2
        async function loadExams(year, branch) {
            const response = await fetch(`/getExams?year=${year}&branch=${branch}`);
            const data = await response.json();
            return data; // already ["Unit_test_1", "Mid_1", "Unit_test_2"]
        }

        const examKeys = await loadExams(year, branch);

        // Build datasets (one per exam)
        const datasets = examKeys.map((exam, idx) => ({
            label: exam.replace(/_/g, " "),
            data: studentData.map(s => s[exam]),
            backgroundColor: `rgba(${idx * 60}, ${idx * 80}, ${idx * 40}, 0.7)`
        }));

        const chartContainer = document.createElement("div");
        chartContainer.className = "chart-container";
        const canvas = document.createElement("canvas");
        chartContainer.appendChild(canvas);
        chartsContainer.appendChild(chartContainer);

        const ctx = canvas.getContext("2d");
        const chartInstance = new Chart(ctx, {
            type: "bar",
            data: { labels: subjects, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: "Marks" } },
                    x: { title: { display: true, text: "Subjects" } }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Performance for ${studentData[0].name} (${studentData[0].htno})`,
                        font: { size: 18 }
                    },
                    legend: { display: true }
                }
            }
        });

        window.marksChartInstances.push(chartInstance);

    } catch (error) {
        console.error("Error fetching student data:", error);
    }
}

// COMPARATIVE SUBJECT INSIGHT
async function loadComparativeInsightChart() {
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    if (!year || !branch) return;

    // Fetch exams dynamically
    const examsResponse = await fetch(`/getExams?year=${year}&branch=${branch}`);
    const examKeys = await examsResponse.json(); // ["Unit_test_1", "Mid_1", "Unit_test_2"]

    // Fetch student marks
    const response = await fetch(`/comparativemarks?year=${year}&branch=${branch}`);
    const data = await response.json();

    clearCharts();
    document.getElementById("studentPerformanceControls").style.display = 'none';
    document.getElementById("subjectWrapper").style.display = "none"; // hide subject dropdown
    const chartsContainer = document.getElementById("chartsContainer");

    if (!data.length) {
        chartsContainer.innerHTML = '<p>No data found for comparative analysis.</p>';
        return;
    }

    // Calculate average marks per subject per exam
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

    const subjects = Object.keys(subjectMarks); // all subjects

    // Create one chart per exam
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
}

// INITIAL LOAD
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