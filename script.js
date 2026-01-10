const DATA_VERSION = "V17_ULTIMA"; 

const INITIAL_QUESTS = [
    { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
    { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
    { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
    { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
    { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
];

let data = JSON.parse(localStorage.getItem("ME_SUPREME_V17")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, lastDayKey: null,
    class: "AWAKENED", theme: 'default',
    stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, bossRewarded: false, completedToday: [],
    quests: [...INITIAL_QUESTS]
};

const save = () => localStorage.setItem("ME_SUPREME_V17", JSON.stringify(data));

// --- BULLETPROOF TIMER ENGINE ---
function updateTimers() {
    const now = new Date();
    document.getElementById('live-time').innerText = now.toLocaleTimeString('en-IN');

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const dailyDiff = endOfDay - now;
    document.getElementById('daily-timer').innerText = `RESET: ${Math.floor(dailyDiff/3600000)}h ${Math.floor((dailyDiff%3600000)/60000)}m`;

    let nextThur = new Date();
    let diffToThur = (4 - now.getDay() + 7) % 7;
    if (diffToThur === 0) diffToThur = 7;
    nextThur.setDate(now.getDate() + diffToThur);
    nextThur.setHours(0, 0, 0, 0);

    const wDiff = nextThur - now;
    document.getElementById('weekly-timer').innerText = `${Math.floor(wDiff/86400000)}d ${Math.floor((wDiff%86400000)/3600000)}h ${Math.floor((wDiff%3600000)/60000)}m`;
}
setInterval(updateTimers, 1000);

// --- CORE SYSTEM LOGIC ---
const playSound = (id) => { const s = document.getElementById(id); if(s){ s.currentTime=0; s.play().catch(()=>{}); }};

function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    playSound('sfx-click');
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;
    if (data.completedToday.length === data.quests.length) {
        data.streak++; data.stats.willpower++; data.weeklyProgress++;
    }
    checkProgress(); save(); render();
}

function checkProgress() {
    let req = data.level * 100;
    if (data.exp >= req) { data.exp -= req; data.level++; }
    const l = data.level;
    data.class = l >= 50 ? 'SHADOW MONARCH' : l >= 10 ? 'HUNTER' : 'AWAKENED';
}

function render() {
    document.body.className = 'theme-' + data.theme;
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    document.getElementById('exp-fill').style.width = (data.exp / (data.level*100) * 100) + "%";
    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k,v]) => `<div class="stat-row-ui"><b>${k.toUpperCase()}</b>: LVL ${v}</div>`).join('');
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `<div class="quest-item ${data.completedToday.includes(q.id)?'done':''}"><span>${q.name}</span>${data.completedToday.includes(q.id)?'✓':`<button onclick="completeQuest(${q.id})">DONE</button>`}</div>`).join('');
}

function resetSystem() { if(confirm("ABORT SYSTEM?")) { localStorage.clear(); location.reload(true); } }
function openSettings() { document.getElementById('settings-modal').style.display='block'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }
function setTheme(t) { data.theme = t; save(); render(); }
window.onload = () => { render(); updateTimers(); };

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('service-worker.js'); }
