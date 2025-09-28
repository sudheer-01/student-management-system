// Store chart instances to destroy them before creating new ones
if (!window.marksChartInstances) {
    window.marksChartInstances = [];
}
// Store fetched data globally for reuse
let currentData = [];

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

function clearCharts() {
    // Destroy old charts
    window.marksChartInstances.forEach(instance => instance.destroy());
    window.marksChartInstances = [];

    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = ''; // Clear previous charts
}

async function loadSubjectExamAnalysis() {
    const subject = document.getElementById("subject").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    clearCharts();
    const chartsContainer = document.getElementById("chartsContainer");
    const studentControls = document.getElementById("studentPerformanceControls");

    // Fetch available exams
    const examsResponse = await fetch(`/getExams?year=${year}&branch=${branch}`);
    const exams = await examsResponse.json();

    if (!exams || exams.length === 0) {
        chartsContainer.innerHTML = '<p>No exams found for the selected criteria.</p>';
        studentControls.style.display = 'none';
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

        // Populate student dropdown
        const studentSelect = document.getElementById("studentHtno");
        studentSelect.innerHTML = examData.map(s => `<option value="${s.htno}">${s.htno} - ${s.name}</option>`).join('');
        studentControls.style.display = 'flex';

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

function loadStudentPerformanceChart() {
    const selectedHtno = document.getElementById("studentHtno").value;
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
        type: 'line',
        data: {
            labels: examNames,
            datasets: [{
                label: `Marks for ${studentData.name} (${studentData.htno})`,
                data: examMarks,
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
                    title: { display: true, text: 'Marks' }
                },
                x: {
                    title: { display: true, text: 'Exams' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Performance for ${studentData.name} in ${studentData.subject}`,
                    font: { size: 18 }
                }
            }
        }
    });
    window.marksChartInstances.push(chartInstance);
}

async function loadComparativeInsightChart() {
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;

    const response = await fetch(`/comparativemarks?year=${year}&branch=${branch}`);
    const data = await response.json();

    clearCharts();
    document.getElementById("studentPerformanceControls").style.display = 'none';
    const chartsContainer = document.getElementById("chartsContainer");

    if (data.length === 0) {
        chartsContainer.innerHTML = '<p>No data found for comparative analysis.</p>';
        return;
    }

    // Aggregate marks by subject
    const subjectMarks = {};
    data.forEach(item => {
        if (!subjectMarks[item.subject]) {
            subjectMarks[item.subject] = [];
        }
        subjectMarks[item.subject].push(item.marks);
    });

    // Prepare data for chart
    const labels = Object.keys(subjectMarks);
    const datasets = [{
        label: 'Average Marks',
        data: labels.map(subject => {
            const marks = subjectMarks[subject];
            const total = marks.reduce((acc, c) => acc + c, 0);
            return marks.length > 0 ? total / marks.length : 0;
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
    }];

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    chartsContainer.appendChild(chartContainer);

    const ctx = canvas.getContext("2d");
    const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Marks'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Subjects'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Comparative Subject Performance (Year: ${year}, Branch: ${branch})`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
    window.marksChartInstances.push(chartInstance);
}

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


