const DATA_VERSION = "V19_MONARCH_FINAL"; 

const INITIAL_QUESTS = [
    { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
    { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
    { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
    { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
    { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
];

// Initialize Data
let data = JSON.parse(localStorage.getItem("ME_SUPREME_V19")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, lastDayKey: null,
    class: "AWAKENED", theme: 'default',
    stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, bossRewarded: false, completedToday: [],
    quests: [...INITIAL_QUESTS]
};

const save = () => localStorage.setItem("ME_SUPREME_V19", JSON.stringify(data));

// --- RESTORED SOUND ENGINE ---
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
document.addEventListener('click', unlockAudio);

// --- RESTORED CUTSCENE ENGINE ---
function triggerSystemEvent(type, title, desc, rewards = []) {
    const overlay = document.getElementById('system-overlay');
    if (!overlay) return;

    document.getElementById('overlay-label').innerText = type.toUpperCase() + " SYSTEM MESSAGE";
    document.getElementById('overlay-title').innerText = title;
    document.getElementById('overlay-desc').innerText = desc;
    document.getElementById('overlay-rewards').innerHTML = rewards.map(r => `<div class="reward-item">+ ${r}</div>`).join('');
    
    if (type === 'level') playSound('sfx-level');
    else if (type === 'class') playSound('sfx-class');
    else playSound('sfx-quest');

    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 3500);
}

// --- QUEST LOGIC (RESTORED BUTTONS) ---
function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    playSound('sfx-click');
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;

    if (data.completedToday.length === data.quests.length) {
        data.streak++; data.stats.willpower++; data.weeklyProgress++;
        triggerSystemEvent('achievement', 'PERFECT DAY', 'Objective Cleared.', ['1 Willpower', 'Streak Progressed']);
    } else {
        playSound('sfx-quest');
    }
    
    checkProgress(); save(); render();
}

function checkProgress() {
    let req = data.level * 100;
    if (data.exp >= req) {
        data.exp -= req; data.level++;
        triggerSystemEvent('level', 'LEVEL UP', 'Attributes enhanced.', ['Level increased']);
    }
    const l = data.level;
    const oldClass = data.class;
    data.class = l >= 50 ? 'SHADOW MONARCH' : l >= 10 ? 'HUNTER' : 'AWAKENED';
    if(oldClass !== data.class) triggerSystemEvent('class', 'CLASS EVOLVED', `New Identity: ${data.class}`);
}

// --- RENDER ENGINE ---
function render() {
    document.body.className = 'theme-' + data.theme;
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('rank-val').innerText = getRank(data.level);
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
            <span>${q.name} (+${q.exp} EXP)</span>
            ${data.completedToday.includes(q.id) ? '<span>✓</span>' : `<button class="btn-action" onclick="completeQuest(${q.id})">COMPLETE</button>`}
        </div>
    `).join('');

    document.getElementById('boss-progress-text').innerText = `${Math.min(data.weeklyProgress, 5)} / 5`;
    document.getElementById('boss-fill').style.width = (Math.min(data.weeklyProgress, 5) / 5 * 100) + "%";
}

function getRank(l) {
    if (l >= 15) return 'C'; if (l >= 5) return 'D'; return 'E';
}

// --- TIMER ENGINE ---
function startTimers() {
    const update = () => {
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
    };
    update();
    setInterval(update, 1000);
}

function resetSystem() { if(confirm("ABORT SYSTEM?")) { localStorage.clear(); location.reload(true); } }
function openSettings() { document.getElementById('settings-modal').style.display = 'block'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function setTheme(t) { data.theme = t; save(); render(); }

window.onload = () => { render(); startTimers(); };
document.addEventListener('click', unlockAudio);
