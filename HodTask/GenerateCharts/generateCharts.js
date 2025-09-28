// Store chart instances to destroy them before creating new ones
if (!window.marksChartInstances) {
    window.marksChartInstances = [];
}
// Store fetched data globally for reuse
let currentData = [];

/**
 * Populate dropdown with fetched data
 */
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
}

/**
 * Clear existing charts
 */
function clearCharts() {
    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = "";
    window.marksChartInstances.forEach(chart => chart.destroy());
    window.marksChartInstances = [];
}

/**
 * 1) Subject Exam Analysis
 */
function loadSubjectExamAnalysis() {
    clearCharts();
    document.getElementById("studentDropdownContainer").style.display = "none";

    // TODO: Add your subject exam analysis chart logic here
    // Example: Average marks of subject in all exams
}

/**
 * 2) Prepare Student Performance (show dropdown)
 */
function prepareStudentPerformance() {
    clearCharts();
    const dropdown = document.getElementById("studentSelect");
    dropdown.innerHTML = "";

    if (currentData.length === 0) {
        alert("No student data loaded!");
        return;
    }

    currentData.forEach(student => {
        const option = document.createElement("option");
        option.value = student.htno;
        option.text = `${student.htno} - ${student.name}`;
        dropdown.appendChild(option);
    });

    document.getElementById("studentDropdownContainer").style.display = "block";
}

/**
 * 2) Load Student Performance Chart (Grouped Bar)
 */
function loadStudentPerformanceChart() {
    clearCharts();
    const selectedHtno = document.getElementById("studentSelect").value;
    if (!selectedHtno) return;

    const studentDataAllSubjects = currentData.filter(s => s.htno === selectedHtno);
    if (studentDataAllSubjects.length === 0) return;

    const examKeys = Object.keys(studentDataAllSubjects[0])
        .filter(key => !['id','htno','name','subject','year','branch'].includes(key));

    const subjects = studentDataAllSubjects.map(s => s.subject);

    const datasets = examKeys.map((exam, index) => ({
        label: exam.replace(/_/g," ").toUpperCase(),
        data: studentDataAllSubjects.map(s => s[exam]),
        backgroundColor: `hsl(${index * 60},70%,60%)`
    }));

    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    const canvas = document.createElement("canvas");
    chartContainer.appendChild(canvas);
    document.getElementById("chartsContainer").appendChild(chartContainer);

    const ctx = canvas.getContext("2d");
    const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: subjects, datasets: datasets },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Marks' } },
                x: { title: { display: true, text: 'Subjects' } }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Performance of ${studentDataAllSubjects[0].name} (${selectedHtno})`
                }
            }
        }
    });
    window.marksChartInstances.push(chartInstance);
}

/**
 * 3) Comparative Insights (Grouped Bar with Avg per Subject)
 */
function loadComparativeInsights() {
    clearCharts();
    document.getElementById("studentDropdownContainer").style.display = "none";

    if (currentData.length === 0) {
        alert("No data available!");
        return;
    }

    const examKeys = Object.keys(currentData[0])
        .filter(key => !['id','htno','name','subject','year','branch'].includes(key));

    const subjects = [...new Set(currentData.map(s => s.subject))];
    const datasets = examKeys.map((exam, index) => {
        const avgMarks = subjects.map(sub => {
            const subStudents = currentData.filter(s => s.subject === sub);
            const total = subStudents.reduce((sum, s) => sum + (s[exam] || 0), 0);
            return (total / subStudents.length) || 0;
        });
        return {
            label: exam.replace(/_/g," ").toUpperCase(),
            data: avgMarks,
            backgroundColor: `hsl(${index * 60},70%,60%)`
        };
    });

    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    const canvas = document.createElement("canvas");
    chartContainer.appendChild(canvas);
    document.getElementById("chartsContainer").appendChild(chartContainer);

    const ctx = canvas.getContext("2d");
    const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: subjects, datasets: datasets },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Marks' } },
                x: { title: { display: true, text: 'Subjects' } }
            },
            plugins: {
                title: { display: true, text: 'Comparative Insights Across Subjects' }
            }
        }
    });
    window.marksChartInstances.push(chartInstance);
}

/**
 * Initialize dropdowns on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    const yearSelect = document.getElementById("year");
    const branchSelect = document.getElementById("branch");
    const subjectSelect = document.getElementById("subject");

    await populateDropdown(yearSelect, '/getYears', 'year', 'year');

    yearSelect.addEventListener('change', async () => {
        const selectedYear = yearSelect.value;
        await populateBranches(selectedYear);
        subjectSelect.innerHTML = '<option value="">Select Subject</option>'; // Clear subjects
    });

    branchSelect.addEventListener('change', async () => {
        const selectedYear = yearSelect.value;
        const selectedBranch = branchSelect.value;
        await populateSubjects(selectedYear, selectedBranch);
    });
});
