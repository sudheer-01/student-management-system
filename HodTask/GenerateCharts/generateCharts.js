// Store chart instances to destroy them before creating new ones
if (!window.marksChartInstances) {
    window.marksChartInstances = [];
}
// Store fetched data globally for reuse
let currentData = [];

// Utility to populate dropdowns
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
    await populateDropdown(branchSelect, `/getBranches/${year}`, 'branch_name', 'branch_name');
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

function showSubjectExamAnalysisControls() {
    clearCharts();
    const subjectExamAnalysisControls = document.getElementById("subjectExamAnalysisControls");
    subjectExamAnalysisControls.style.display = 'flex';

    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    populateSubjects(year, branch);
}

async function loadSubjectExamAnalysis() {
    const subject = document.getElementById("subject").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    clearCharts();
    const chartsContainer = document.getElementById("chartsContainer");

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

    // Ensure all HTNOs are present on the x-axis
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
            return student ? student.marks : null; // Use null for missing data
        });

        const maxMark = Math.max(...marksData.filter(mark => mark !== null)); // Filter out null values

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
        chartsContainer.appendChild(chartContainer);
    }
}

function showStudentPerformanceControls() {
    clearCharts();
    const studentControls = document.getElementById("studentPerformanceControls");
    studentControls.style.display = 'flex';

    const subject = document.getElementById("subject").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    // Fetch student data and populate dropdown
    fetch(`/getStudentReports/${year}/${branch}/${subject}/mid_1`)
        .then(response => response.json())
        .then(data => {
            currentData = data;
            const studentSelect = document.getElementById("studentHtno");
            studentSelect.innerHTML = '<option value="">Select Student</option>' + data.map(s => `<option value="${s.htno}">${s.htno} - ${s.name}</option>`).join('');
        })
        .catch(error => console.error("Error fetching student data:", error));
}

function loadStudentPerformanceChart() {
    const selectedHtno = document.getElementById("studentHtno").value;
    const subject = document.getElementById("subject").value;
    if (!selectedHtno || currentData.length === 0) return;

    const studentData = currentData.find(s => s.htno === selectedHtno);
    if (!studentData) return;

    clearCharts();
    const chartsContainer = document.getElementById("chartsContainer");

    // Extract exam names and marks
    const examKeys = Object.keys(studentData).filter(key => !['id', 'htno', 'name', 'subject', 'year', 'branch'].includes(key));
    const examNames = examKeys.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const examMarks = examKeys.map(key => studentData[key]);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    chartsContainer.appendChild(chartContainer);

    const ctx = canvas.getContext("2d");
    const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [subject], // Use subject as the label
            datasets: examNames.map((exam, index) => ({
                label: exam,
                data: [examMarks[index]], // Marks for the exam
                backgroundColor: `rgba(${index * 50}, ${index * 30}, ${index * 80}, 0.7)` // Dynamic color
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Marks' }
                },
                x: {
                    title: { display: true, text: 'Subjects' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Performance for ${studentData.name} (${studentData.htno}) in ${subject}`,
                    font: { size: 18 }
                },
                legend: {
                    display: true // Show legend for exams
                }
            }
        }
    });
    window.marksChartInstances.push(chartInstance);
}

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
    const subjectWrapper = document.getElementById("subjectWrapper");

    await populateDropdown(yearSelect, '/getYears', 'year', 'year');

    yearSelect.addEventListener('change', async () => {
        const selectedYear = yearSelect.value;
        await populateBranches(selectedYear);
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        subjectWrapper.style.display = "none"; // Hide subject dropdown initially
    });

    branchSelect.addEventListener('change', () => {
        subjectWrapper.style.display = "none"; // Hide subject dropdown initially
    });
});
       

// INITIAL LOAD
document.addEventListener('DOMContentLoaded', async () => {
    const yearSelect = document.getElementById("year");
    const branchSelect = document.getElementById("branch");
    const subjectSelect = document.getElementById("subject");

    await populateDropdown(yearSelect, '/getYears', 'year', 'year');

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
