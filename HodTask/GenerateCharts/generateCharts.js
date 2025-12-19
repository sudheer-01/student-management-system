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
generateBtn.onclick = async () => {
  clearCharts();

  const configs = document.querySelectorAll(".exam-config");
  for (const cfg of configs) {
    const exam = cfg.querySelector(".levelCount")?.dataset.exam;
    if (!exam) continue;

    const inputs = cfg.querySelectorAll("input");
    const ranges = [];
    for (let i = 0; i < inputs.length; i += 2) {
      ranges.push({
        label: `${inputs[i].value}-${inputs[i+1].value}`,
        from: +inputs[i].value,
        to: +inputs[i+1].value
      });
    }

    const data = await (await fetch(`/getStudentReports/${yearSelect.value}/${branchSelect.value}/${subjectSelect.value}/${exam}`)).json();

    const counts = ranges.map(r =>
      data.filter(s => s.marks >= r.from && s.marks <= r.to).length
    );

    const box = document.createElement("div");
    box.className = "chart-container";
    box.innerHTML = "<canvas></canvas>";
    chartsContainer.appendChild(box);

    const chart = new Chart(box.querySelector("canvas"), {
      type: "bar",
      data: {
        labels: ranges.map(r => r.label),
        datasets: [{
          label: exam,
          data: counts,
          backgroundColor: "rgba(54,162,235,0.7)"
        }]
      },
      options: {
        plugins: { title: { display: true, text: `${subjectSelect.value} – ${exam}` } },
        scales: { y: { beginAtZero: true } }
      }
    });

    marksChartInstances.push(chart);
  }
};

/*************************************************
 * STUDENT PERFORMANCE & COMPARATIVE
 *************************************************/
// function showStudentPerformanceControls() {
//   resetAnalysisUI();
//   studentControls.style.display = "flex";
// }

// async function loadComparativeInsightChart() {
//   resetAnalysisUI();
//   alert("Comparative Insights already works – unchanged.");
// }
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
async function loadComparativeInsightChart() {
  resetAnalysisUI();

  if (!yearSelect.value || !branchSelect.value) {
    alert("Please select Year and Section");
    return;
  }

  chartsContainer.innerHTML = "<p>Loading comparative insights...</p>";

  try {
    // Fetch exams
    const examRes = await fetch(`/getExams?year=${yearSelect.value}&branch=${branchSelect.value}`);
    const exams = await examRes.json();

    if (!exams.length) {
      chartsContainer.innerHTML = "<p>No exams found</p>";
      return;
    }

    // Fetch marks
    const res = await fetch(`/comparativemarks?year=${yearSelect.value}&branch=${branchSelect.value}`);
    const data = await res.json();

    if (!data.length) {
      chartsContainer.innerHTML = "<p>No data available</p>";
      return;
    }

    chartsContainer.innerHTML = "";

    exams.forEach((exam, idx) => {
      const subjectMap = {};

      data.forEach(row => {
        if (!subjectMap[row.subject]) subjectMap[row.subject] = [];
        if (row[exam] != null) subjectMap[row.subject].push(row[exam]);
      });

      const subjects = Object.keys(subjectMap);
      const averages = subjects.map(s => {
        const arr = subjectMap[s];
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      });

      const box = document.createElement("div");
      box.className = "chart-container";
      box.innerHTML = "<canvas></canvas>";
      chartsContainer.appendChild(box);

      const ctx = box.querySelector("canvas").getContext("2d");
      const chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: subjects,
          datasets: [{
            label: `Average Marks – ${exam}`,
            data: averages,
            backgroundColor: `rgba(${60 + idx*40}, ${120 + idx*30}, 200, 0.7)`
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: `Comparative Subject Performance (${exam})`
            }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Average Marks" } },
            x: { title: { display: true, text: "Subjects" } }
          }
        }
      });

      marksChartInstances.push(chart);
    });
  } catch (err) {
    console.error(err);
    chartsContainer.innerHTML = "<p>Error loading comparative insights</p>";
  }
}
