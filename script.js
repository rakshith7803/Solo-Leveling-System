const DATA_VERSION = "V23_ULTIMATE"; 

let data = JSON.parse(localStorage.getItem("ME_SUPREME_V23")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, 
    class: "AWAKENED", theme: 'default',
    stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, completedToday: [],
    quests: [
        { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
        { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
        { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
        { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
        { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
    ]
};

let statChart = null;
const save = () => localStorage.setItem("ME_SUPREME_V23", JSON.stringify(data));

// 1. SOUND & CUTSCENES
function triggerEvent(title, desc, rewards = []) {
    const overlay = document.getElementById('system-overlay');
    if (!overlay) return;
    document.getElementById('overlay-title').innerText = title;
    document.getElementById('overlay-desc').innerText = desc;
    document.getElementById('overlay-rewards').innerHTML = rewards.map(r => `<div class="reward-item">+ ${r}</div>`).join('');
    
    const sfx = title === "LEVEL UP" ? 'sfx-level' : 'sfx-quest';
    const s = document.getElementById(sfx);
    if(s) s.play().catch(()=>{});

    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 3000);
}

// 2. CHART ENGINE
function updateChart() {
    const ctx = document.getElementById('statChart')?.getContext('2d');
    if (!ctx) return;
    const vals = Object.values(data.stats);
    const cData = vals.every(v => v === 0) ? [1,1,1,1,1] : vals;
    if (statChart) statChart.destroy();
    statChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['STR', 'INT', 'MEN', 'VIT', 'WIL'],
            datasets: [{ data: cData, backgroundColor: ['#ff4d4d', '#00f2ff', '#a55eea', '#20bf6b', '#f7b731'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    });
}

// 3. RENDER UI
function render() {
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    document.getElementById('rank-val').innerText = data.level >= 15 ? 'C' : data.level >= 5 ? 'D' : 'E';
    
    const req = data.level * 100;
    document.getElementById('exp-fill').style.width = (data.exp/req*100) + "%";
    document.getElementById('exp-text').innerText = `${data.exp}/${req} EXP`;

    document.getElementById('boss-fill').style.width = (Math.min(data.weeklyProgress,5)/5*100) + "%";
    document.getElementById('boss-progress-text').innerText = `${Math.min(data.weeklyProgress,5)} / 5`;

    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k,v]) => `<div class="stat-row-ui"><b>${k.toUpperCase()}</b>: LVL ${v}</div>`).join('');
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `
        <div class="quest-item ${data.completedToday.includes(q.id)?'done':''}">
            <span>${q.name}</span>
            ${data.completedToday.includes(q.id)?'<span>✓</span>':`<button class="btn-action" onclick="completeQuest(${q.id})">COMPLETE</button>`}
        </div>`).join('');
    updateChart();
}

// 4. LOGIC
function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;
    if (data.completedToday.length === data.quests.length) {
        data.streak++; data.weeklyProgress++;
        triggerEvent("PERFECT DAY", "Objective Cleared", ["1 Willpower"]);
    }
    checkLvl(); save(); render();
}

function checkLvl() {
    const req = data.level * 100;
    if (data.exp >= req) { data.exp -= req; data.level++; triggerEvent("LEVEL UP", "Power Increased"); }
    data.class = data.level >= 50 ? 'SHADOW MONARCH' : data.level >= 10 ? 'HUNTER' : 'AWAKENED';
}

function startTimers() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-time').innerText = now.toLocaleTimeString('en-IN');
        
        let nextThur = new Date();
        let diff = (4 - now.getDay() + 7) % 7 || 7;
        nextThur.setDate(now.getDate() + diff);
        nextThur.setHours(0,0,0,0);
        const wDiff = nextThur - now;
        document.getElementById('weekly-timer').innerText = `${Math.floor(wDiff/86400000)}d ${Math.floor((wDiff%86400000)/3600000)}h`;
    }, 1000);
}

function resetSystem() { if(confirm("ABORT?")) { localStorage.clear(); location.reload(true); } }
function openSettings() { document.getElementById('settings-modal').style.display='block'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }

window.onload = () => { render(); startTimers(); };
document.addEventListener('click', () => { document.getElementById('sfx-idle')?.play(); }, {once: true});
