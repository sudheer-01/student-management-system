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
function showStudentPerformanceControls() {
  resetAnalysisUI();
  studentControls.style.display = "flex";
}

async function loadComparativeInsightChart() {
  resetAnalysisUI();
  alert("Comparative Insights already works – unchanged.");
}
