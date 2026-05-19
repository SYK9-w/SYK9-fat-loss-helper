const STORAGE_KEY = "syk9-fat-loss-records";
const KCAL_PER_KG_FAT = 7700;

const userProfile = {
  age: 19,
  heightCm: 178
};

const form = document.querySelector("#checkinForm");
const dateInput = document.querySelector("#dateInput");
const weightInput = document.querySelector("#weightInput");
const intakeInput = document.querySelector("#intakeInput");
const exerciseInput = document.querySelector("#exerciseInput");
const todayDeficit = document.querySelector("#todayDeficit");
const todayHint = document.querySelector("#todayHint");
const totalDeficit = document.querySelector("#totalDeficit");
const estimatedLoss = document.querySelector("#estimatedLoss");
const historyText = document.querySelector("#historyText");
const historyList = document.querySelector("#historyList");

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function setRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatKcal(value) {
  return `${Math.round(value)} kcal`;
}

function formatKg(value) {
  return `${value.toFixed(2)} kg`;
}

function calculateBmr(weightKg) {
  // 男性 Mifflin-St Jeor 公式：体重*9.99 + 身高*6.25 - 年龄*4.92 + 5
  return weightKg * 9.99 + userProfile.heightCm * 6.25 - userProfile.age * 4.92 + 5;
}

function calculateCurrentInput() {
  const weight = Number(weightInput.value) || 0;
  const intake = Number(intakeInput.value) || 0;
  const exercise = Number(exerciseInput.value) || 0;
  const bmr = weight > 0 ? calculateBmr(weight) : 0;
  const dailyMaintain = bmr > 0 ? bmr / 0.7 + exercise : 0;
  const deficit = dailyMaintain - intake;

  return {
    date: dateInput.value,
    weight,
    intake,
    exercise,
    dailyMaintain,
    deficit
  };
}

function updateTodayPreview() {
  const current = calculateCurrentInput();
  todayDeficit.textContent = formatKcal(current.deficit);

  if (!current.weight || !current.intake) {
    todayHint.textContent = "输入体重和热量后自动计算。";
    return;
  }

  if (current.deficit > 0) {
    todayHint.textContent = `估算维持热量约 ${formatKcal(current.dailyMaintain)}，今天是热量缺口。`;
  } else if (current.deficit < 0) {
    todayHint.textContent = `估算维持热量约 ${formatKcal(current.dailyMaintain)}，今天可能热量超出。`;
  } else {
    todayHint.textContent = `估算维持热量约 ${formatKcal(current.dailyMaintain)}，今天接近持平。`;
  }
}

function saveTodayRecord(event) {
  event.preventDefault();

  const current = calculateCurrentInput();
  const newRecord = {
    date: current.date,
    weight: current.weight,
    intake: current.intake,
    exercise: current.exercise,
    dailyMaintain: Math.round(current.dailyMaintain),
    deficit: Math.round(current.deficit)
  };

  const records = getRecords();
  const recordsWithoutSameDate = records.filter((record) => record.date !== newRecord.date);

  setRecords([...recordsWithoutSameDate, newRecord]);
  renderPage();
  todayHint.textContent = "已保存今日记录。刷新页面后，数据也不会丢失。";
}

function deleteRecord(date) {
  const records = getRecords();
  const nextRecords = records.filter((record) => record.date !== date);
  setRecords(nextRecords);
  renderPage();
}

function renderTotals(records) {
  const sumDeficit = records.reduce((sum, record) => sum + record.deficit, 0);
  const lossKg = sumDeficit / KCAL_PER_KG_FAT;

  totalDeficit.textContent = formatKcal(sumDeficit);
  estimatedLoss.textContent = formatKg(lossKg);
}

function renderHistory(records) {
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));
  historyList.innerHTML = "";

  historyText.textContent = sortedRecords.length
    ? `已经保存 ${sortedRecords.length} 天记录。`
    : "还没有记录，今天先打第一卡。";

  if (!sortedRecords.length) {
    historyList.innerHTML = `<div class="empty">暂无历史记录</div>`;
    return;
  }

  sortedRecords.forEach((record) => {
    const item = document.createElement("article");
    item.className = "history-item";

    item.innerHTML = `
      <div class="history-top">
        <div>
          <div class="history-date">${record.date}</div>
          <div class="history-deficit">缺口 ${formatKcal(record.deficit)}</div>
        </div>
        <button class="delete-button" type="button" data-date="${record.date}">删除</button>
      </div>
      <div class="history-meta">
        <span>体重：${record.weight.toFixed(1)} kg</span>
        <span>摄入：${formatKcal(record.intake)}</span>
        <span>运动：${formatKcal(record.exercise)}</span>
        <span>维持：${formatKcal(record.dailyMaintain)}</span>
      </div>
    `;

    historyList.appendChild(item);
  });
}

function renderPage() {
  const records = getRecords();
  renderTotals(records);
  renderHistory(records);
  updateTodayPreview();
}

dateInput.value = getTodayString();
weightInput.value = "79.0";
exerciseInput.value = "0";

weightInput.addEventListener("input", updateTodayPreview);
intakeInput.addEventListener("input", updateTodayPreview);
exerciseInput.addEventListener("input", updateTodayPreview);
form.addEventListener("submit", saveTodayRecord);

historyList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  deleteRecord(button.dataset.date);
});

renderPage();
