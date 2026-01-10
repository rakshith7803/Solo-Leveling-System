const DATA_VERSION = "V18_MONARCH_FINAL"; 

const INITIAL_QUESTS = [
    { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
    { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
    { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
    { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
    { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
];

// Initialize System Data
let data = JSON.parse(localStorage.getItem("ME_SUPREME_V18")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, lastDayKey: null,
    class: "AWAKENED", theme: 'default',
    stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, bossRewarded: false, completedToday: [],
    quests: [...INITIAL_QUESTS]
};

const save = () => localStorage.setItem("ME_SUPREME_V18", JSON.stringify(data));

// --- THE FAIL-SAFE TIMER ENGINE ---
function startTimers() {
    const update = () => {
        const now = new Date();
        
        // 1. Digital Clock (IST)
        const clock = document.getElementById('live-time');
        if (clock) clock.innerText = now.toLocaleTimeString('en-IN');

        // 2. Daily Reset (Midnight tonight)
        const endDay = new Date();
        endDay.setHours(23, 59, 59, 999);
        const dailyDiff = endDay - now;
        const dH = Math.floor(dailyDiff / 3600000);
        const dM = Math.floor((dailyDiff % 3600000) / 60000);
        const dailyEl = document.getElementById('daily-timer');
        if (dailyEl) dailyEl.innerText = `RESET: ${dH}h ${dM}m`;

        // 3. Weekly Boss (Targeting Next Thursday)
        let nextThur = new Date();
        let daysUntilThur = (4 - now.getDay() + 7) % 7; 
        if (daysUntilThur === 0) daysUntilThur = 7; 
        nextThur.setDate(now.getDate() + daysUntilThur);
        nextThur.setHours(0, 0, 0, 0);

        const wDiff = nextThur - now;
        const wD = Math.floor(wDiff / 86400000);
        const wH = Math.floor((wDiff % 86400000) / 3600000);
        const wM = Math.floor((wDiff % 3600000) / 60000);
        
        const bossEl = document.getElementById('weekly-timer');
        if (bossEl) bossEl.innerText = `${wD}d ${wH}h ${wM}m`;
    };

    update(); // Run once immediately
    setInterval(update, 1000); // Update every second
}

// --- CORE SYSTEM LOGIC ---
function render() {
    document.body.className = 'theme-' + data.theme;
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    
    let req = data.level * 100;
    document.getElementById('exp-fill').style.width = (data.exp / req * 100) + "%";
    document.getElementById('exp-text').innerText = `${data.exp} / ${req} EXP`;
    
    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k, v]) => `
        <div class="stat-row-ui"><b>${k.toUpperCase()}</b>: LVL ${v}</div>
    `).join('');
    
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `
        <div class="quest-item ${data.completedToday.includes(q.id) ? 'done' : ''}">
            <span>${q.name}</span>
            ${data.completedToday.includes(q.id) ? '✓' : `<button onclick="completeQuest(${q.id})">DONE</button>`}
        </div>
    `).join('');
}

function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;
    if (data.completedToday.length === data.quests.length) {
        data.streak++; data.weeklyProgress++;
    }
    checkProgress(); save(); render();
}

function checkProgress() {
    let req = data.level * 100;
    if (data.exp >= req) { data.exp -= req; data.level++; }
    data.class = data.level >= 50 ? 'SHADOW MONARCH' : data.level >= 10 ? 'HUNTER' : 'AWAKENED';
}

function resetSystem() { 
    if(confirm("ABORT SYSTEM?")) { localStorage.clear(); location.reload(true); } 
}

function openSettings() { document.getElementById('settings-modal').style.display = 'block'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function setTheme(t) { data.theme = t; save(); render(); }

// --- INITIALIZE ---
window.onload = () => {
    render();
    startTimers(); // Force timer start
};

if ('serviceWorker' in navigator) { 
    navigator.serviceWorker.register('service-worker.js'); 
}
