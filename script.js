const DATA_VERSION = "V21_SYNC_FIX"; 

const INITIAL_QUESTS = [
    { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
    { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
    { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
    { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
    { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
];

// Safety initialization: ensures data is NEVER null
let data = JSON.parse(localStorage.getItem("ME_SUPREME_V21")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, lastDayKey: null,
    class: "AWAKENED", theme: 'default',
    stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, bossRewarded: false, completedToday: [],
    quests: [...INITIAL_QUESTS]
};

let statChart = null; // Chart variable

const save = () => localStorage.setItem("ME_SUPREME_V21", JSON.stringify(data));

// --- SOUND ENGINE ---
const playSound = (id) => {
    const s = document.getElementById(id);
    if (s) { s.currentTime = 0; s.play().catch(() => {}); }
};

function unlockAudio() {
    const idle = document.getElementById('sfx-idle');
    if (idle) { idle.volume = 0.2; idle.play(); }
    playSound('sfx-click');
    document.removeEventListener('click', unlockAudio);
}

// --- TIMER ENGINE ---
function startTimers() {
    setInterval(() => {
        const now = new Date();
        const clock = document.getElementById('live-time');
        if (clock) clock.innerText = now.toLocaleTimeString('en-IN');

        const endDay = new Date();
        endDay.setHours(23, 59, 59);
        const dailyDiff = endDay - now;
        const dailyEl = document.getElementById('daily-timer');
        if (dailyEl) dailyEl.innerText = `RESET: ${Math.floor(dailyDiff/3600000)}h ${Math.floor((dailyDiff%3600000)/60000)}m`;

        let nextThur = new Date();
        let daysUntilThur = (4 - now.getDay() + 7) % 7; 
        if (daysUntilThur === 0) daysUntilThur = 7; 
        nextThur.setDate(now.getDate() + daysUntilThur);
        nextThur.setHours(0, 0, 0, 0);

        const wDiff = nextThur - now;
        const bossEl = document.getElementById('weekly-timer');
        if (bossEl) bossEl.innerText = `${Math.floor(wDiff/86400000)}d ${Math.floor((wDiff%86400000)/3600000)}h ${Math.floor((wDiff%3600000)/60000)}m`;
    }, 1000);
}

// --- CHART ENGINE (FIXED) ---
function updateChart() {
    const canvas = document.getElementById('statChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const vals = Object.values(data.stats);
    const chartData = vals.every(v => v === 0) ? [1,1,1,1,1] : vals;

    if (statChart) {
        statChart.destroy(); // Clean up old chart to prevent errors
    }

    try {
        statChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['STR', 'INT', 'MEN', 'VIT', 'WIL'],
                datasets: [{
                    data: chartData,
                    backgroundColor: ['#ff4d4d', '#00f2ff', '#a55eea', '#20bf6b', '#f7b731'],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (e) { console.error("Chart failed to load:", e); }
}

// --- RENDER ENGINE ---
function render() {
    document.body.className = 'theme-' + data.theme;
    
    // Safety check for UI elements
    const ids = ['lvl-val', 'rank-val', 'cls-val', 'streak-val', 'exp-fill', 'exp-text'];
    ids.forEach(id => { if(!document.getElementById(id)) console.warn("Missing ID:", id); });

    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    
    let req = data.level * 100;
    document.getElementById('exp-fill').style.width = (data.exp / req * 100) + "%";
    document.getElementById('exp-text').innerText = `${data.exp} / ${req} EXP`;
    
    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k, v]) => `
        <div class="stat-row-ui">
            <b>${k.toUpperCase()}</b>: LVL ${v}
            <div class="bar-bg mini-bar"><div class="fill" style="width: ${Math.min(v * 4, 100)}%"></div></div>
        </div>
    `).join('');
    
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `
        <div class="quest-item ${data.completedToday.includes(q.id) ? 'done' : ''}">
            <span>${q.name}</span>
            ${data.completedToday.includes(q.id) ? '<span>✓</span>' : `<button class="btn-action" onclick="completeQuest(${q.id})">COMPLETE</button>`}
        </div>
    `).join('');

    updateChart(); // Refresh chart on every render
}

function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    playSound('sfx-click');
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;
    if (data.completedToday.length === data.quests.length) data.streak++;
    checkProgress(); save(); render();
}

function checkProgress() {
    let req = data.level * 100;
    while (data.exp >= req) { data.exp -= req; data.level++; req = data.level * 100; }
    data.class = data.level >= 50 ? 'SHADOW MONARCH' : data.level >= 10 ? 'HUNTER' : 'AWAKENED';
}

function resetSystem() {
    if(confirm("ABORT SYSTEM?")) {
        localStorage.clear();
        window.location.replace(window.location.pathname); // Pure clean reload
    }
}

function openSettings() { document.getElementById('settings-modal').style.display='block'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }
function setTheme(t) { data.theme = t; save(); render(); }
function showTab(id) { 
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none'); 
    document.getElementById(id).style.display = 'block'; 
}

// --- INITIALIZE ---
window.onload = () => {
    startTimers();
    render();
};
document.addEventListener('click', unlockAudio);
