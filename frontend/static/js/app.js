/* ============================================================
   NeuroLearn — Frontend Application Logic
   ============================================================ */

const API = "";   // Same origin; change to http://localhost:5000 if running separately

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  document.querySelector(`[data-page="${id}"]`).classList.add("active");
  window.scrollTo(0,0);
  // Load data for relevant pages
  if (id === "dashboard") loadDashboard();
  if (id === "home")      loadHomeStats();
  if (id === "communicate") initCommunicator();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

// ══════════════════════════════════════════════════════════════
// API HELPERS
// ══════════════════════════════════════════════════════════════
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(API + url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
function toast(msg, duration = 2800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}

// ══════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════
async function loadHomeStats() {
  const moods      = await apiFetch("/api/history") || [];
  const activities = await apiFetch("/api/activities") || [];
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el("home-moods",      moods.length);
  el("home-activities", activities.length);
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
let moodLineChart, moodPieChart, activityBarChart;

async function loadDashboard() {
  const moods      = await apiFetch("/api/history") || [];
  const activities = await apiFetch("/api/activities") || [];
  const stats      = await apiFetch("/api/activities/stats") || {};

  renderKPIs(moods, activities);
  renderMoodLineChart(moods);
  renderMoodPieChart(moods);
  renderActivityBarChart(activities);
  renderTimeline(moods, activities);
  renderMoodTable(moods);
}

function renderKPIs(moods, activities) {
  const latest = moods[0];
  document.getElementById("kpi-today-mood").textContent = latest
    ? (EMOTION_ICONS[latest.emotion] || "😐") + " " + cap(latest.emotion) : "—";

  if (activities.length) {
    const avg = activities.reduce((s, a) => s + a.percentage, 0) / activities.length;
    const best = Math.max(...activities.map(a => a.percentage));
    document.getElementById("kpi-avg-score").textContent  = avg.toFixed(0) + "%";
    document.getElementById("kpi-best-score").textContent = best.toFixed(0) + "%";
  }
  document.getElementById("kpi-total-activities").textContent = activities.length;
}

function renderMoodLineChart(moods) {
  const ctx = document.getElementById("moodLineChart").getContext("2d");
  if (moodLineChart) moodLineChart.destroy();

  const sorted = [...moods].reverse().slice(-14);
  const labels = sorted.map(m => {
    const d = new Date(m.timestamp);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  });
  const emotionOrder = ["happy","excited","calm","neutral","sad","angry"];
  const values = sorted.map(m => emotionOrder.indexOf(m.emotion));

  moodLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Mood Level",
        data: values,
        fill: true,
        backgroundColor: "rgba(92,110,248,0.08)",
        borderColor: "#5C6EF8",
        borderWidth: 3,
        pointBackgroundColor: sorted.map(m => EMOTION_COLORS[m.emotion] || "#5C6EF8"),
        pointRadius: 7,
        pointHoverRadius: 9,
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend:{display:false} },
      scales: {
        y: { ticks: { callback: v => emotionOrder[v] || v, font:{family:"Nunito",weight:"700"} }, grid:{color:"#F0F4FF"} },
        x: { grid:{display:false}, ticks:{font:{family:"Nunito",weight:"700"}} }
      }
    }
  });
}

function renderMoodPieChart(moods) {
  const ctx = document.getElementById("moodPieChart").getContext("2d");
  if (moodPieChart) moodPieChart.destroy();

  const counts = {};
  moods.forEach(m => { counts[m.emotion] = (counts[m.emotion] || 0) + 1; });
  const labels = Object.keys(counts);
  const data   = Object.values(counts);
  const colors = labels.map(e => EMOTION_COLORS[e] || "#ccc");

  moodPieChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels: labels.map(cap), datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: "#fff" }] },
    options: {
      plugins: { legend: { position:"bottom", labels:{font:{family:"Nunito",weight:"700"}} } },
      cutout: "60%"
    }
  });
}

function renderActivityBarChart(activities) {
  const ctx = document.getElementById("activityBarChart").getContext("2d");
  if (activityBarChart) activityBarChart.destroy();

  const grouped = {};
  activities.forEach(a => {
    if (!grouped[a.activity_type]) grouped[a.activity_type] = [];
    grouped[a.activity_type].push(a.percentage);
  });

  const labels = Object.keys(grouped).map(t => ACTIVITY_LABELS[t] || cap(t));
  const avgs   = Object.values(grouped).map(arr => arr.reduce((s,v)=>s+v,0)/arr.length);
  const bests  = Object.values(grouped).map(arr => Math.max(...arr));

  activityBarChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label:"Average %", data:avgs, backgroundColor:"rgba(92,110,248,0.7)", borderRadius:8, borderSkipped:false },
        { label:"Best %",    data:bests, backgroundColor:"rgba(255,107,157,0.7)", borderRadius:8, borderSkipped:false }
      ]
    },
    options: {
      plugins: { legend: { labels:{font:{family:"Nunito",weight:"700"}} } },
      scales: {
        y: { max:100, ticks:{callback:v=>v+"%",font:{family:"Nunito",weight:"700"}}, grid:{color:"#F0F4FF"} },
        x: { grid:{display:false}, ticks:{font:{family:"Nunito",weight:"700"}} }
      }
    }
  });
}

function renderTimeline(moods, activities) {
  const all = [
    ...moods.slice(0,8).map(m => ({ type:"mood", icon:EMOTION_ICONS[m.emotion]||"😐", title:`Mood: ${cap(m.emotion)}`, time:m.timestamp })),
    ...activities.slice(0,8).map(a => ({ type:"activity", icon:ACTIVITY_ICONS[a.activity_type]||"🎮", title:`${ACTIVITY_LABELS[a.activity_type]||cap(a.activity_type)}: ${a.score}/${a.total} (${a.percentage}%)`, time:a.timestamp }))
  ].sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0,12);

  const el = document.getElementById("timeline-list");
  el.innerHTML = all.map(item => `
    <div class="timeline-item tl-${item.type}">
      <div class="tl-dot">${item.icon}</div>
      <div class="tl-content">
        <div class="tl-title">${item.title}</div>
        <div class="tl-time">${fmtDate(item.time)}</div>
      </div>
    </div>
  `).join("") || "<p style='color:var(--text-muted);padding:16px'>No activity yet.</p>";
}

function renderMoodTable(moods) {
  const SUGGESTIONS_SHORT = {
    happy:"Keep learning! 🌟", sad:"Try a calming activity 💙",
    angry:"Take a deep breath 🌬️", neutral:"Ready to learn! 📚",
    excited:"Channel your energy! ⚡", calm:"Perfect for learning 🧘"
  };
  const tbody = document.getElementById("mood-table-body");
  tbody.innerHTML = moods.map(m => `
    <tr>
      <td>${fmtDate(m.timestamp)}</td>
      <td><span class="emotion-badge emotion-${m.emotion}">${EMOTION_ICONS[m.emotion]||"😐"} ${cap(m.emotion)}</span></td>
      <td>${Math.round((m.confidences[m.emotion]||0)*100)}%</td>
      <td style="font-size:13px;color:var(--text-muted)">${SUGGESTIONS_SHORT[m.emotion]||""}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No mood data yet. Try the Mood Check! 😊</td></tr>`;
}

// ══════════════════════════════════════════════════════════════
// MOOD DETECTION
// ══════════════════════════════════════════════════════════════
let webcamStream = null;
let capturedImageBase64 = null;

document.getElementById("upload-zone").addEventListener("click", () => {
  document.getElementById("file-input").click();
});
document.getElementById("upload-zone").addEventListener("dragover", e => { e.preventDefault(); });
document.getElementById("upload-zone").addEventListener("drop", e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleImageFile(file);
});
document.getElementById("file-input").addEventListener("change", e => {
  if (e.target.files[0]) handleImageFile(e.target.files[0]);
});

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    capturedImageBase64 = e.target.result;
    document.getElementById("preview-img").src = capturedImageBase64;
    document.getElementById("preview-img").style.display = "block";
    document.querySelector(".upload-placeholder").style.display = "none";
    document.getElementById("analyze-btn").disabled = false;
    document.getElementById("mood-result").style.display = "none";
  };
  reader.readAsDataURL(file);
}

function toggleWebcam() {
  const container = document.getElementById("webcam-container");
  if (container.style.display === "none") {
    navigator.mediaDevices.getUserMedia({ video:true })
      .then(stream => {
        webcamStream = stream;
        document.getElementById("webcam-video").srcObject = stream;
        container.style.display = "block";
        document.getElementById("webcam-btn").textContent = "❌ Close Webcam";
      })
      .catch(() => toast("Camera access denied. Please allow camera access."));
  } else {
    if (webcamStream) { webcamStream.getTracks().forEach(t => t.stop()); webcamStream = null; }
    container.style.display = "none";
    document.getElementById("webcam-btn").textContent = "📸 Use Webcam";
  }
}

function captureWebcam() {
  const video  = document.getElementById("webcam-video");
  const canvas = document.getElementById("webcam-canvas");
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  capturedImageBase64 = canvas.toDataURL("image/jpeg");
  document.getElementById("preview-img").src = capturedImageBase64;
  document.getElementById("preview-img").style.display = "block";
  document.querySelector(".upload-placeholder").style.display = "none";
  document.getElementById("analyze-btn").disabled = false;
  toast("Photo captured! Click Detect Mood 😊");
}

async function analyzeMood() {
  if (!capturedImageBase64) { toast("Please upload or capture an image first."); return; }

  document.getElementById("mood-result").style.display   = "none";
  document.getElementById("mood-loading").style.display  = "flex";
  document.getElementById("analyze-btn").disabled = true;

  const result = await apiFetch("/api/upload", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ image: capturedImageBase64, user:"child" })
  });

  document.getElementById("mood-loading").style.display = "none";
  document.getElementById("analyze-btn").disabled = false;

  if (!result) { toast("Analysis failed. Please try again."); return; }

  // Display result
  document.getElementById("result-emotion").textContent = result.suggestion.icon || "😐";
  document.getElementById("result-label").textContent   = cap(result.emotion);
  document.getElementById("result-message").textContent  = result.suggestion.message;

  // Confidence bars
  const barsEl = document.getElementById("confidence-bars");
  const sorted = Object.entries(result.confidences).sort((a,b) => b[1]-a[1]);
  barsEl.innerHTML = sorted.map(([e, v]) => `
    <div class="conf-item">
      <div class="conf-label"><span>${EMOTION_ICONS[e]||"😐"} ${cap(e)}</span><span>${Math.round(v*100)}%</span></div>
      <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:${Math.round(v*100)}%;background:${EMOTION_COLORS[e]||"#5C6EF8"}"></div></div>
    </div>
  `).join("");

  // Suggestions
  const acts = result.suggestion.activities || [];
  document.getElementById("suggestion-list").innerHTML = acts.map(a => `<li>${a}</li>`).join("");

  // Color the result card
  document.querySelector(".mood-result-card").style.borderColor = result.suggestion.color || "#5C6EF8";
  document.getElementById("mood-result").style.display = "block";

  toast(`Detected: ${cap(result.emotion)} ${result.suggestion.icon}`);
}

// ══════════════════════════════════════════════════════════════
// ACTIVITIES — SHARED
// ══════════════════════════════════════════════════════════════
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".activity-panel").forEach(p => p.style.display = "none");
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
  });
});

async function saveActivity(type, score, total, details = {}) {
  await apiFetch("/api/activities/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ activity_type:type, score, total, user:"child", details })
  });
}

// ══════════════════════════════════════════════════════════════
// COLOR MATCHING GAME
// ══════════════════════════════════════════════════════════════
const COLORS = [
  { name:"Red",    hex:"#FF4444" },{ name:"Blue",   hex:"#4488FF" },
  { name:"Green",  hex:"#44CC88" },{ name:"Yellow", hex:"#FFDD44" },
  { name:"Purple", hex:"#AA44FF" },{ name:"Orange", hex:"#FF8844" },
  { name:"Pink",   hex:"#FF88BB" },{ name:"Teal",   hex:"#44CCCC" },
  { name:"Brown",  hex:"#996644" },{ name:"Gray",   hex:"#888888" }
];

let colorGame = { score:0, current:0, total:10, timer:null };

function startColorGame() {
  colorGame = { score:0, current:0, total:10 };
  document.getElementById("color-result").style.display  = "none";
  document.getElementById("color-question").style.display = "block";
  document.getElementById("start-color-btn").style.display = "none";
  document.getElementById("color-score").textContent = 0;
  document.getElementById("color-total").textContent = colorGame.total;
  nextColorQuestion();
}

function nextColorQuestion() {
  if (colorGame.current >= colorGame.total) {
    endColorGame(); return;
  }
  colorGame.current++;

  // Pick target color
  const target  = COLORS[Math.floor(Math.random() * COLORS.length)];
  // Build 4 options (target + 3 random)
  const others  = COLORS.filter(c => c.name !== target.name).sort(() => Math.random()-.5).slice(0,3);
  const options = [target, ...others].sort(() => Math.random()-.5);

  document.getElementById("color-target-box").style.background = target.hex;
  document.getElementById("color-target-label").textContent = target.name;

  const optEl = document.getElementById("color-options");
  optEl.innerHTML = options.map(c => `
    <div class="color-opt" style="background:${c.hex}" data-name="${c.name}" onclick="checkColor(this,'${c.name}','${target.name}')"></div>
  `).join("");

  // Timer bar
  let t = 100;
  clearInterval(colorGame.timer);
  colorGame.timer = setInterval(() => {
    t -= 0.5;
    document.getElementById("color-timer-fill").style.width = t + "%";
    if (t <= 0) {
      clearInterval(colorGame.timer);
      checkColor(null, "", target.name);
    }
  }, 50);
}

function checkColor(el, chosen, correct) {
  clearInterval(colorGame.timer);
  const opts = document.querySelectorAll(".color-opt");
  opts.forEach(o => {
    if (o.dataset.name === correct) o.classList.add("correct");
    else o.classList.add("wrong");
    o.style.pointerEvents = "none";
  });
  if (chosen === correct) {
    colorGame.score++;
    document.getElementById("color-score").textContent = colorGame.score;
    toast("✅ Correct!");
  } else {
    toast("❌ Wrong! The correct color was " + correct);
  }
  setTimeout(nextColorQuestion, 900);
}

async function endColorGame() {
  document.getElementById("color-question").style.display = "none";
  document.getElementById("color-result").style.display   = "block";
  document.getElementById("start-color-btn").style.display = "block";
  const pct = Math.round(colorGame.score / colorGame.total * 100);
  document.getElementById("color-result-emoji").textContent = pct>=80?"🎉":pct>=50?"😊":"💪";
  document.getElementById("color-result-text").textContent  = pct>=80?"Excellent!":pct>=50?"Good job!":"Keep practicing!";
  document.getElementById("color-result-score").textContent = `You scored ${colorGame.score}/${colorGame.total} (${pct}%)`;
  await saveActivity("color_match", colorGame.score, colorGame.total);
  toast("Activity saved! 🎯");
}

// ══════════════════════════════════════════════════════════════
// SHAPE RECOGNITION GAME
// ══════════════════════════════════════════════════════════════
const SHAPES = [
  { name:"Circle",    svg:'<circle cx="80" cy="80" r="70" fill="#5C6EF8" opacity=".85"/>' },
  { name:"Square",    svg:'<rect x="10" y="10" width="140" height="140" rx="8" fill="#FF6B9D" opacity=".85"/>' },
  { name:"Triangle",  svg:'<polygon points="80,10 150,150 10,150" fill="#FFD93D" opacity=".85"/>' },
  { name:"Rectangle", svg:'<rect x="5"  y="35" width="150" height="90"  rx="8" fill="#4CAF82" opacity=".85"/>' },
  { name:"Star",      svg:'<polygon points="80,10 96,60 150,60 106,90 122,140 80,110 38,140 54,90 10,60 64,60" fill="#FF9843" opacity=".85"/>' },
  { name:"Diamond",   svg:'<polygon points="80,10 150,80 80,150 10,80" fill="#46B2F0" opacity=".85"/>' },
  { name:"Pentagon",  svg:'<polygon points="80,10 148,58 122,140 38,140 12,58" fill="#A29BFE" opacity=".85"/>' },
  { name:"Hexagon",   svg:'<polygon points="80,5 148,42 148,118 80,155 12,118 12,42" fill="#FF6B6B" opacity=".85"/>' }
];

let shapeGame = { score:0, current:0, total:10 };

function startShapeGame() {
  shapeGame = { score:0, current:0, total:10 };
  document.getElementById("shape-result").style.display   = "none";
  document.getElementById("shape-question").style.display = "block";
  document.getElementById("start-shape-btn").style.display = "none";
  document.getElementById("shape-score").textContent = 0;
  document.getElementById("shape-total").textContent = shapeGame.total;
  nextShapeQuestion();
}

function nextShapeQuestion() {
  if (shapeGame.current >= shapeGame.total) { endShapeGame(); return; }
  shapeGame.current++;

  const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const others = SHAPES.filter(s => s.name !== target.name).sort(() => Math.random()-.5).slice(0,3);
  const options = [target, ...others].sort(() => Math.random()-.5);

  document.getElementById("shape-display").innerHTML =
    `<svg viewBox="0 0 160 160" width="160" height="160">${target.svg}</svg>`;

  document.getElementById("shape-options").innerHTML = options.map(s => `
    <button class="shape-opt" onclick="checkShape(this,'${s.name}','${target.name}')">${s.name}</button>
  `).join("");
}

function checkShape(el, chosen, correct) {
  document.querySelectorAll(".shape-opt").forEach(o => {
    o.disabled = true;
    if (o.textContent === correct) o.classList.add("correct");
    else o.classList.add("wrong");
  });
  if (chosen === correct) {
    shapeGame.score++;
    document.getElementById("shape-score").textContent = shapeGame.score;
    toast("✅ Correct! It's a " + correct);
  } else {
    toast("❌ Wrong! It was a " + correct);
  }
  setTimeout(nextShapeQuestion, 1000);
}

async function endShapeGame() {
  document.getElementById("shape-question").style.display = "none";
  document.getElementById("shape-result").style.display   = "block";
  document.getElementById("start-shape-btn").style.display = "block";
  const pct = Math.round(shapeGame.score / shapeGame.total * 100);
  document.getElementById("shape-result-emoji").textContent = pct>=80?"🎉":pct>=50?"😊":"💪";
  document.getElementById("shape-result-text").textContent  = pct>=80?"Shape Master!":pct>=50?"Good work!":"Try again!";
  document.getElementById("shape-result-score").textContent = `${shapeGame.score}/${shapeGame.total} (${pct}%)`;
  await saveActivity("shape", shapeGame.score, shapeGame.total);
  toast("Activity saved! 🎯");
}

// ══════════════════════════════════════════════════════════════
// QUIZ GAME
// ══════════════════════════════════════════════════════════════
const QUIZ_QUESTIONS = [
  { q:"What color do you get when you mix red and blue?", options:["Purple","Green","Orange","Brown"], ans:"Purple" },
  { q:"How many sides does a triangle have?", options:["3","4","5","6"], ans:"3" },
  { q:"What is 5 + 7?", options:["11","12","13","10"], ans:"12" },
  { q:"Which animal says 'moo'?", options:["Dog","Cat","Cow","Sheep"], ans:"Cow" },
  { q:"What color is the sky on a sunny day?", options:["Green","Red","Blue","Yellow"], ans:"Blue" },
  { q:"How many days are in a week?", options:["5","6","7","8"], ans:"7" },
  { q:"What do caterpillars turn into?", options:["Birds","Butterflies","Bees","Beetles"], ans:"Butterflies" },
  { q:"Which shape has 4 equal sides?", options:["Rectangle","Circle","Square","Triangle"], ans:"Square" },
  { q:"What is the largest planet in our solar system?", options:["Earth","Mars","Jupiter","Saturn"], ans:"Jupiter" },
  { q:"What is 10 × 2?", options:["12","15","20","22"], ans:"20" },
  { q:"Which fruit is yellow and curved?", options:["Apple","Banana","Mango","Grape"], ans:"Banana" },
  { q:"How many months are in a year?", options:["10","11","12","13"], ans:"12" }
];

let quiz = { questions:[], score:0, current:0, total:10, answered:false };

function startQuiz() {
  quiz.questions = [...QUIZ_QUESTIONS].sort(() => Math.random()-.5).slice(0, 10);
  quiz.score   = 0;
  quiz.current = 0;
  quiz.total   = 10;
  document.getElementById("quiz-result").style.display   = "none";
  document.getElementById("quiz-question").style.display = "block";
  document.getElementById("start-quiz-btn").style.display = "none";
  document.getElementById("quiz-score").textContent = 0;
  document.getElementById("quiz-total").textContent = 10;
  showQuizQuestion();
}

function showQuizQuestion() {
  if (quiz.current >= quiz.total) { endQuiz(); return; }
  quiz.answered = false;
  const q = quiz.questions[quiz.current];
  document.getElementById("quiz-q-num").textContent = `Question ${quiz.current+1} of ${quiz.total}`;
  document.getElementById("quiz-prompt").textContent = q.q;
  document.getElementById("quiz-feedback").style.display = "none";
  document.getElementById("quiz-options").innerHTML = q.options.map(o => `
    <button class="quiz-opt" onclick="checkQuiz(this,'${o}','${q.ans}')">${o}</button>
  `).join("");
}

function checkQuiz(el, chosen, correct) {
  if (quiz.answered) return;
  quiz.answered = true;
  document.querySelectorAll(".quiz-opt").forEach(o => {
    o.disabled = true;
    if (o.textContent === correct) o.classList.add("correct");
    else if (o.textContent === chosen) o.classList.add("wrong");
  });
  const fb = document.getElementById("quiz-feedback");
  if (chosen === correct) {
    quiz.score++;
    document.getElementById("quiz-score").textContent = quiz.score;
    fb.textContent = "✅ Correct! Great job!";
    fb.className   = "quiz-feedback correct";
    toast("✅ Correct!");
  } else {
    fb.textContent = `❌ Oops! The answer was "${correct}"`;
    fb.className   = "quiz-feedback wrong";
    toast("❌ The answer was " + correct);
  }
  fb.style.display = "block";
  quiz.current++;
  setTimeout(showQuizQuestion, 1400);
}

async function endQuiz() {
  document.getElementById("quiz-question").style.display = "none";
  document.getElementById("quiz-result").style.display   = "block";
  document.getElementById("start-quiz-btn").style.display = "block";
  const pct = Math.round(quiz.score / quiz.total * 100);
  document.getElementById("quiz-result-emoji").textContent = pct>=80?"🏆":pct>=50?"😊":"📚";
  document.getElementById("quiz-result-text").textContent  = pct>=80?"Quiz Champion!":pct>=50?"Well done!":"Keep learning!";
  document.getElementById("quiz-result-score").textContent = `${quiz.score}/${quiz.total} (${pct}%)`;
  await saveActivity("quiz", quiz.score, quiz.total);
  toast("Quiz saved! 🎯");
}

// ══════════════════════════════════════════════════════════════
// COMMUNICATION HELPER
// ══════════════════════════════════════════════════════════════
const COMM_CARDS = [
  { emoji:"🍽️", text:"I am hungry",    color:"#FFE5B4", action:"Feed me please!" },
  { emoji:"💧", text:"I am thirsty",   color:"#B4E5FF", action:"I need water" },
  { emoji:"😢", text:"I am sad",       color:"#B4C8FF", action:"I feel sad" },
  { emoji:"😊", text:"I am happy",     color:"#FFE5B4", action:"I feel happy!" },
  { emoji:"😴", text:"I am sleepy",    color:"#E5D4FF", action:"I want to sleep" },
  { emoji:"🤒", text:"I don't feel good", color:"#FFD4D4", action:"I am not well" },
  { emoji:"🚽", text:"Bathroom break", color:"#D4F5FF", action:"I need to use the bathroom" },
  { emoji:"🤗", text:"I want a hug",   color:"#FFD4E5", action:"Please give me a hug" },
  { emoji:"📚", text:"I want to learn", color:"#D4FFE5", action:"I want to study now" },
  { emoji:"🎮", text:"I want to play",  color:"#FFF5D4", action:"Can we play?" },
  { emoji:"😠", text:"I am angry",      color:"#FFD4D4", action:"I feel angry" },
  { emoji:"❤️",  text:"I love you",     color:"#FFD4E5", action:"I love you!" }
];

function initCommunicator() {
  const grid = document.getElementById("comm-grid");
  if (grid.children.length > 0) return; // Already initialized
  grid.innerHTML = COMM_CARDS.map((c, i) => `
    <div class="comm-card" style="border-color:${c.color};background:${c.color}22" onclick="speakCard(${i})">
      <div class="comm-emoji">${c.emoji}</div>
      <div class="comm-text">${c.text}</div>
      <div class="comm-action">Tap to speak</div>
    </div>
  `).join("");
}

function speakCard(idx) {
  const card = COMM_CARDS[idx];
  speak(card.action || card.text);
  const el = document.querySelectorAll(".comm-card")[idx];
  el.classList.add("speaking");
  setTimeout(() => el.classList.remove("speaking"), 1200);
}

function speakCustom() {
  const text = document.getElementById("custom-speech").value.trim();
  if (!text) { toast("Please type something to say!"); return; }
  speak(text);
  toast("🔊 Speaking: " + text);
}

function speak(text) {
  if (!window.speechSynthesis) { toast("Speech not supported in this browser."); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.9;
  utt.pitch  = 1.1;
  utt.volume = 1;
  window.speechSynthesis.speak(utt);
}

// ══════════════════════════════════════════════════════════════
// PARENT PANEL
// ══════════════════════════════════════════════════════════════
let parentSession = JSON.parse(sessionStorage.getItem("parent_session") || "null");

// Check existing session on page load
function checkParentSession() {
  if (parentSession) showParentDashboard(parentSession.child);
}

function switchAuthTab(tab) {
  document.getElementById("login-form").style.display    = tab==="login"    ? "block" : "none";
  document.getElementById("register-form").style.display = tab==="register" ? "block" : "none";
  document.getElementById("login-tab-btn").classList.toggle("active",    tab==="login");
  document.getElementById("register-tab-btn").classList.toggle("active", tab==="register");
}

async function parentLogin() {
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value.trim();
  const err = document.getElementById("auth-error");
  err.textContent = "";

  if (!username || !password) { err.textContent = "Please enter username and password."; return; }

  const result = await apiFetch("/api/auth/login", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  if (result && result.success) {
    parentSession = { username, child: result.child };
    sessionStorage.setItem("parent_session", JSON.stringify(parentSession));
    showParentDashboard(result.child);
    toast("Welcome, " + username + "! 👋");
  } else {
    err.textContent = (result && result.message) || "Login failed. Try again.";
  }
}

async function parentRegister() {
  const username = document.getElementById("reg-user").value.trim();
  const password = document.getElementById("reg-pass").value.trim();
  const child    = document.getElementById("reg-child").value.trim();
  const err      = document.getElementById("auth-error");
  err.textContent = "";

  if (!username || !password) { err.textContent = "Please fill all fields."; return; }

  const result = await apiFetch("/api/auth/register", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ username, password, child: child||"child" })
  });

  if (result && result.success) {
    toast("Account created! Please sign in.");
    switchAuthTab("login");
  } else {
    err.textContent = (result && result.error) || "Registration failed.";
  }
}

function parentLogout() {
  parentSession = null;
  sessionStorage.removeItem("parent_session");
  document.getElementById("parent-login").style.display     = "flex";
  document.getElementById("parent-dashboard").style.display = "none";
  toast("Signed out. See you soon!");
}

async function showParentDashboard(child) {
  document.getElementById("parent-login").style.display     = "none";
  document.getElementById("parent-dashboard").style.display = "block";
  document.getElementById("child-name-display").textContent = cap(child || "Child");
  document.getElementById("nav-avatar").textContent = "👤 " + (parentSession.username || "Parent");

  const moods      = await apiFetch(`/api/history?user=${child}`) || [];
  const activities = await apiFetch(`/api/activities?user=${child}`) || [];

  // KPIs
  const moodCounts = {};
  moods.forEach(m => { moodCounts[m.emotion] = (moodCounts[m.emotion]||0)+1; });
  const dominant = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0];
  document.getElementById("p-dominant-mood").textContent   = dominant ? (EMOTION_ICONS[dominant[0]]||"😐")+" "+cap(dominant[0]) : "—";
  document.getElementById("p-mood-count").textContent      = moods.length;
  document.getElementById("p-activity-count").textContent  = activities.length;
  const avgScore = activities.length ? (activities.reduce((s,a)=>s+a.percentage,0)/activities.length).toFixed(0)+"%" : "—";
  document.getElementById("p-avg-score").textContent       = avgScore;

  // Charts
  renderParentMoodChart(moods);
  renderParentActivityChart(activities);
  renderParentRecommendations(moods);
  renderParentAlerts(moods);
}

let parentMoodChart, parentActivityChart;

function renderParentMoodChart(moods) {
  const ctx = document.getElementById("parentMoodChart").getContext("2d");
  if (parentMoodChart) parentMoodChart.destroy();

  const sorted = [...moods].reverse().slice(-10);
  parentMoodChart = new Chart(ctx, {
    type:"line",
    data:{
      labels: sorted.map(m => fmtDate(m.timestamp, true)),
      datasets:[{
        label:"Mood", data: sorted.map(m => ["angry","sad","neutral","calm","happy","excited"].indexOf(m.emotion)),
        fill:true, backgroundColor:"rgba(92,110,248,0.1)", borderColor:"#5C6EF8",
        borderWidth:3, pointRadius:6, tension:0.4
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{
        y:{ticks:{callback:v=>["angry","sad","neutral","calm","happy","excited"][v]||v},grid:{color:"#F0F4FF"}},
        x:{grid:{display:false}}
      }
    }
  });
}

function renderParentActivityChart(activities) {
  const ctx = document.getElementById("parentActivityChart").getContext("2d");
  if (parentActivityChart) parentActivityChart.destroy();

  const recent = activities.slice(0,7).reverse();
  parentActivityChart = new Chart(ctx, {
    type:"bar",
    data:{
      labels: recent.map(a => ACTIVITY_LABELS[a.activity_type]||cap(a.activity_type)),
      datasets:[{
        label:"Score %", data: recent.map(a=>a.percentage),
        backgroundColor: recent.map(a => a.percentage>=80?"rgba(76,175,130,.7)":a.percentage>=50?"rgba(255,152,67,.7)":"rgba(255,107,107,.7)"),
        borderRadius:8, borderSkipped:false
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{y:{max:100,ticks:{callback:v=>v+"%"},grid:{color:"#F0F4FF"}},x:{grid:{display:false}}}
    }
  });
}

function renderParentRecommendations(moods) {
  const recsEl = document.getElementById("parent-recs");
  if (!moods.length) { recsEl.innerHTML = "<p style='color:var(--text-muted)'>No mood data yet.</p>"; return; }

  const recent = moods.slice(0,5).map(m=>m.emotion);
  const recs = [];

  if (recent.includes("sad"))    recs.push({ title:"Child felt sad recently", tip:"Spend extra time with them. Try art activities or storytelling." });
  if (recent.includes("angry"))  recs.push({ title:"Anger episodes detected",  tip:"Practice breathing exercises together. Reduce screen time before activities." });
  if (recent.includes("happy") || recent.includes("excited")) recs.push({ title:"Child is in a great mood! 🎉", tip:"Great time for challenging learning activities and new topics." });
  if (recent.filter(e=>e==="neutral").length > 3) recs.push({ title:"Mood seems flat", tip:"Try introducing new games or outdoor play to boost engagement." });

  if (!recs.length) recs.push({ title:"Mood looks balanced 👍", tip:"Keep up the routine! Regular mood checks help track long-term patterns." });

  recsEl.innerHTML = recs.map(r => `
    <div class="rec-card">
      <h4>${r.title}</h4>
      <p>${r.tip}</p>
    </div>
  `).join("");
}

function renderParentAlerts(moods) {
  const alertsEl = document.getElementById("parent-alerts");
  const recent   = moods.slice(0, 7).map(m=>m.emotion);
  const alerts   = [];

  const sadCount   = recent.filter(e=>e==="sad").length;
  const angryCount = recent.filter(e=>e==="angry").length;

  if (sadCount >= 3)   alerts.push({ type:"danger",  msg:`⚠️ Child detected as "Sad" ${sadCount} times in the last 7 records. Consider talking with them.` });
  if (angryCount >= 2) alerts.push({ type:"warning", msg:`⚡ Anger detected ${angryCount} times recently. Monitor activity stress levels.` });
  if (!sadCount && !angryCount) alerts.push({ type:"success", msg:"✅ No concerning mood patterns detected. Child appears emotionally healthy." });

  alertsEl.innerHTML = alerts.map(a => `
    <div class="alert-card alert-${a.type}">${a.msg}</div>
  `).join("");
}

// ══════════════════════════════════════════════════════════════
// UTILITY / CONSTANTS
// ══════════════════════════════════════════════════════════════
const EMOTION_ICONS = {
  happy:"😊", sad:"😢", angry:"😠", neutral:"😐", excited:"🤩", calm:"😌"
};
const EMOTION_COLORS = {
  happy:"#FFD93D", sad:"#6FAEDF", angry:"#FF6B6B",
  neutral:"#A8D8A8", excited:"#FF9F43", calm:"#A29BFE"
};
const ACTIVITY_LABELS = {
  color_match:"🎨 Color Match", shape:"🔷 Shape Game", quiz:"📝 Quiz"
};
const ACTIVITY_ICONS = {
  color_match:"🎨", shape:"🔷", quiz:"📝"
};

function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

function fmtDate(iso, short=false) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (short) return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  return d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
  loadHomeStats();
  checkParentSession();
});
