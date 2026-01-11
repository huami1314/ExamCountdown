const exams = [
  {
    id: "mock2",
    name: "Mock2",
    range: "2026/02/02 - 2026/02/13",
    subjects: [
      { name: "Chinese", date: "2026-02-02" },
      { name: "English", date: "2026-02-03" },
      { name: "CSD", date: "2026-02-05" },
      { name: "Maths", date: "2026-02-06" },
      { name: "Physics", date: "2026-02-11" },
      { name: "ICT", date: "2026-02-12" }
    ]
  },
  {
    id: "dse",
    name: "2026 DSE",
    range: "2026/04/09 - 2026/04/24",
    subjects: [
      { name: "Chinese", date: "2026-04-09" },
      { name: "English", date: "2026-04-10" },
      { name: "Maths", date: "2026-04-13" },
      { name: "CSD", date: "2026-04-14" },
      { name: "Physics", date: "2026-04-22" },
      { name: "ICT", date: "2026-04-24" }
    ]
  }
];

const container = document.getElementById("examContainer");
const pager = document.getElementById("pager");
const headerCountdown = document.getElementById("headerCountdown");
const mobileQuery = window.matchMedia("(max-width: 640px)");
let currentIndex = 0;
let lastIndex = 0;
let panelObserver = null;

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${y}/${m}/${d}`;
};

const getDiffDays = (isoDate) => {
  const now = new Date();
  const target = new Date(`${isoDate}T00:00:00`);
  const diffMs = target - now;
  if (diffMs <= 0) {
    return null;
  }
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatCountdown = (days) => {
  if (days === null) return { text: "已结束", state: "已经考试" };
  return {
    text: `${days} 天`,
    state: days === 0 ? "今天" : "剩余…"
  };
};

const getDiffParts = (isoDate) => {
  const now = new Date();
  const target = new Date(`${isoDate}T00:00:00`);
  const diffMs = target - now;
  if (diffMs <= 0) {
    return null;
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
};

const getNextParts = (subjects) => {
  const diffs = subjects
    .map((subject) => getDiffParts(subject.date))
    .filter((parts) => parts !== null);
  if (!diffs.length) return null;
  return diffs.reduce((min, curr) => (curr.totalSeconds < min.totalSeconds ? curr : min));
};

const updateHeaderCountdown = () => {
  if (!headerCountdown) return;
  const activeExam = exams[currentIndex] || exams[0];
  if (!activeExam) return;
  const parts = getNextParts(activeExam.subjects);
  if (!parts) {
    headerCountdown.textContent = "Finished";
    return;
  }
  headerCountdown.textContent = `Next in ${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
};

const getNext = (subjects) => {
  const diffs = subjects
    .map((subject) => getDiffDays(subject.date))
    .filter((days) => days !== null);
  if (!diffs.length) return null;
  return Math.min(...diffs);
};

const renderPanels = () => {
  exams.forEach((exam, index) => {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.dataset.examId = exam.id;

    const next = getNext(exam.subjects);
    const leadCountdown = formatCountdown(next);
    const leadText = next === null ? "已结束" : leadCountdown.text;
    const leadLabel = next === null ? "全部科目已完成" : "距离最近一科";

    panel.innerHTML = `
      <div class="panel-title">
        <h2>${exam.name}</h2>
        <span>${exam.range}</span>
      </div>
      <div class="lead">
        <div class="lead-number">${leadText}</div>
        <div class="lead-label">${leadLabel}</div>
      </div>
      <div class="subjects"></div>
    `;

    const subjectGrid = panel.querySelector(".subjects");
    const sortedSubjects = [...exam.subjects].sort((a, b) => {
      const aDays = getDiffDays(a.date);
      const bDays = getDiffDays(b.date);
      if (aDays === null && bDays === null) return 0;
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    });

    sortedSubjects.forEach((subject, subjectIndex) => {
      const days = getDiffDays(subject.date);
      const { text, state } = formatCountdown(days);
      const card = document.createElement("div");
      card.className = "subject";
      card.dataset.targetDate = subject.date;
      card.style.animationDelay = `${0.1 + subjectIndex * 0.06 + index * 0.1}s`;
      card.innerHTML = `
        <h3><span class="label">${subject.name}</span></h3>
        <div class="date">${formatDate(subject.date)}</div>
        <div class="count">${text}</div>
        <div class="state">${state}</div>
      `;
      subjectGrid.appendChild(card);
    });

    container.appendChild(panel);
  });
};

const updateCountdowns = () => {
  const panels = document.querySelectorAll(".panel");
  panels.forEach((panel) => {
    const examId = panel.dataset.examId;
    const exam = exams.find((item) => item.id === examId);
    if (!exam) return;
    const next = getNext(exam.subjects);
    const leadCountdown = formatCountdown(next);
    const leadNumber = panel.querySelector(".lead-number");
    const leadLabel = panel.querySelector(".lead-label");
    leadNumber.textContent = next === null ? "已结束" : leadCountdown.text;
    leadLabel.textContent = next === null ? "全部科目已完成" : "距离最近一科";
  });

  const cards = document.querySelectorAll(".subject");
  cards.forEach((card) => {
    const target = card.dataset.targetDate;
    const days = getDiffDays(target);
    const { text, state } = formatCountdown(days);
    card.querySelector(".count").textContent = text;
    card.querySelector(".state").textContent = state;
  });
  updateHeaderCountdown();
};

const setHeroHeight = (panel) => {
  if (!panel) return;
  container.style.height = `${panel.offsetHeight}px`;
};

const observeActivePanel = (panel) => {
  if (!panel || typeof ResizeObserver === "undefined") return;
  if (panelObserver) {
    panelObserver.disconnect();
  }
  panelObserver = new ResizeObserver(() => setHeroHeight(panel));
  panelObserver.observe(panel);
};

const showPanel = (index) => {
  const panels = document.querySelectorAll(".panel");
  lastIndex = currentIndex;
  currentIndex = index;
  if (!mobileQuery.matches) {
    panels.forEach((panel) => {
      panel.classList.remove(
        "is-hidden",
        "is-visible",
        "flip-in-right",
        "flip-in-left",
        "flip-out-left",
        "flip-out-right"
      );
    });
    container.style.height = "";
    updateHeaderCountdown();
    return;
  }
  const direction = currentIndex > lastIndex ? "next" : "prev";
  panels.forEach((panel, panelIndex) => {
    const isActive = panelIndex === currentIndex;
    const isLeaving = panelIndex === lastIndex && panelIndex !== currentIndex;
    panel.classList.remove(
      "flip-in-right",
      "flip-in-left",
      "flip-out-left",
      "flip-out-right"
    );

    if (isActive) {
      panel.classList.add("is-visible");
      panel.classList.remove("is-hidden");
      panel.classList.add(direction === "next" ? "flip-in-right" : "flip-in-left");
      requestAnimationFrame(() => {
        panel.classList.remove(direction === "next" ? "flip-in-right" : "flip-in-left");
      });
      setHeroHeight(panel);
      observeActivePanel(panel);
      updateHeaderCountdown();
      return;
    }

    panel.classList.remove("is-visible");
    if (isLeaving) {
      panel.classList.add(direction === "next" ? "flip-out-left" : "flip-out-right");
      setTimeout(() => {
        panel.classList.remove(direction === "next" ? "flip-out-left" : "flip-out-right");
        panel.classList.add("is-hidden");
      }, 380);
      return;
    }
    panel.classList.add("is-hidden");
  });

  if (!pager) return;
  const buttons = pager.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.index) === currentIndex);
  });
};

const setupPager = () => {
  if (!pager) return;
  pager.innerHTML = "";
  const items = [
    { label: "2026 DSE >", index: 1 },
    { label: "< Mock2", index: 0 }
  ];
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.index = item.index;
    button.textContent = item.label;
    button.addEventListener("click", () => showPanel(item.index));
    pager.appendChild(button);
  });
  showPanel(currentIndex);
};

const handleResponsive = () => {
  showPanel(currentIndex);
};

const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");

if (storedTheme) {
  root.setAttribute("data-theme", storedTheme);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  root.setAttribute("data-theme", "dark");
}

const setToggleIcon = () => {
  const isDark = root.getAttribute("data-theme") === "dark";
  const icon = isDark
    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5"></circle>
        <path d="M12 2.5v3"></path>
        <path d="M12 18.5v3"></path>
        <path d="M4.2 4.2l2.1 2.1"></path>
        <path d="M17.7 17.7l2.1 2.1"></path>
        <path d="M2.5 12h3"></path>
        <path d="M18.5 12h3"></path>
        <path d="M4.2 19.8l2.1-2.1"></path>
        <path d="M17.7 6.3l2.1-2.1"></path>
      </svg>`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"></path>
      </svg>`;
  themeToggle.querySelector(".icon").innerHTML = icon;
  themeToggle.setAttribute("aria-label", isDark ? "切换明亮模式" : "切换暗黑模式");
};

const initThemeToggle = () => {
  setToggleIcon();
  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", current);
    localStorage.setItem("theme", current);
    setToggleIcon();
  });
};

const bindPressEffects = () => {
  const targets = [
    ...document.querySelectorAll(".subject"),
    ...document.querySelectorAll(".pager button"),
    themeToggle
  ].filter(Boolean);

  targets.forEach((target) => {
    const add = () => target.classList.add("is-pressed");
    const remove = () => target.classList.remove("is-pressed");
    target.addEventListener("pointerdown", add);
    target.addEventListener("pointerup", remove);
    target.addEventListener("pointerleave", remove);
    target.addEventListener("pointercancel", remove);
  });
};

renderPanels();
updateCountdowns();
initThemeToggle();
setupPager();
handleResponsive();
mobileQuery.addEventListener("change", handleResponsive);
bindPressEffects();
setInterval(updateCountdowns, 1000);

window.addEventListener("load", () => {
  showPanel(currentIndex);
});

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);
