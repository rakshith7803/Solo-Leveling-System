const DATA_VERSION = "V30_SUPREME_SOVEREIGN";

// 1. DATA INITIALIZATION
let data = JSON.parse(localStorage.getItem("ME_SUPREME_V30")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, theme: 'default',
    class: "AWAKENED", stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
    weeklyProgress: 0, completedToday: [], lastDayKey: null,
    quests: [
        { id: 1, name: "Go to Gym and Workout", exp: 100, stat: "strength", gain: 1 },
        { id: 2, name: "Solve 10 Coding Problems", exp: 120, stat: "intelligence", gain: 1 },
        { id: 3, name: "Study Theory", exp: 110, stat: "mentality", gain: 1 },
        { id: 4, name: "Walk 10km a Day", exp: 100, stat: "strength", gain: 1 },
        { id: 5, name: "Follow Diet & Avoid Junk", exp: 150, stat: "vitality", gain: 1 }
    ]
};

let statChart = null;
const save = () => localStorage.setItem("ME_SUPREME_V30", JSON.stringify(data));

// 2. SYSTEM OVERLAY & AUDIO ENGINE
function triggerEvent(title, desc, rewards = []) {
    const overlay = document.getElementById('system-overlay');
    document.getElementById('overlay-title').innerText = title;
    document.getElementById('overlay-desc').innerText = desc;
    document.getElementById('overlay-rewards').innerHTML = rewards.map(r => `<div style="color:#ffd700; font-family:'Orbitron'; margin-top:5px;">+ ${r}</div>`).join('');
    
    overlay.classList.add('active');
    const sfxId = title === "LEVEL UP" ? 'sfx-level' : 'sfx-quest';
    document.getElementById(sfxId)?.play().catch(()=>{});
    setTimeout(() => overlay.classList.remove('active'), 3500);
}

// 3. PIE CHART ENGINE
function updateChart() {
    const canvas = document.getElementById('statChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const vals = Object.values(data.stats);
    const chartData = vals.every(v => v === 0) ? [1,1,1,1,1] : vals;

    if (statChart) statChart.destroy();
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
        options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    });
}

// 4. THE RENDER HUD ENGINE
function render() {
    document.body.className = 'theme-' + data.theme;
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    document.getElementById('rank-val').innerText = data.level >= 15 ? 'C' : data.level >= 5 ? 'D' : 'E';
    
    const req = data.level * 100;
    document.getElementById('exp-fill').style.width = (data.exp / req * 100) + "%";
    document.getElementById('exp-text').innerText = `${data.exp} / ${req} EXP`;
    
    document.getElementById('boss-fill').style.width = (Math.min(data.weeklyProgress, 5) / 5 * 100) + "%";
    document.getElementById('boss-progress-text').innerText = `${Math.min(data.weeklyProgress, 5)} / 5`;

    // Attribute Mini-Bars
    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k, v]) => `
        <div class="stat-row-ui">
            <div class="stat-label-group"><span>${k.toUpperCase()}</span><span>LVL ${v}</span></div>
            <div class="bar-bg mini-bar"><div class="fill" style="width: ${Math.min(v * 5, 100)}%"></div></div>
        </div>`).join('');
    
    // Quest List
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `
        <div class="quest-item ${data.completedToday.includes(q.id) ? 'done' : ''}">
            <span>${q.name}</span>
            ${data.completedToday.includes(q.id) ? '<span>✓</span>' : `<button class="btn-action" onclick="completeQuest(${q.id})">COMPLETE</button>`}
        </div>`).join('');
    updateChart();
}

// 5. CORE SOVEREIGN LOGIC
function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    document.getElementById('sfx-click')?.play().catch(()=>{});
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;
    
    // WILLPOWER LOGIC
    if (data.completedToday.length === data.quests.length) {
        data.streak++; data.weeklyProgress++; data.stats.willpower++;
        triggerEvent("PERFECT DAY", "Objective Cleared", ["1 Willpower", "Streak Maintained"]);
    }
    
    if (data.exp >= data.level * 100) {
        data.exp -= data.level * 100;
        data.level++;
        triggerEvent("LEVEL UP", `Reached Level ${data.level}`, ["Stats Enhanced"]);
    }
    data.class = data.level >= 50 ? 'SHADOW MONARCH' : data.level >= 10 ? 'HUNTER' : 'AWAKENED';
    save(); render();
}

// 6. TIMER ENGINE
function startTimers() {
    const run = () => {
        const now = new Date();
        document.getElementById('live-time').innerText = now.toLocaleTimeString('en-IN');
        document.getElementById('daily-timer').innerText = `RESET: ${23-now.getHours()}h ${59-now.getMinutes()}m`;
        
        let diff = (4 - now.getDay() + 7) % 7 || 7;
        document.getElementById('weekly-timer').innerText = `${diff-1}d ${23-now.getHours()}h REMAINING`;
    };
    run(); setInterval(run, 1000);
}

function resetSystem() { if(confirm("ABORT SYSTEM DATA?")) { localStorage.clear(); location.reload(true); } }
function setTheme(t) { data.theme = t; save(); render(); }
function openSettings() { document.getElementById('settings-modal').style.display='flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }

window.onload = () => { render(); startTimers(); };
document.addEventListener('click', () => { document.getElementById('sfx-idle')?.play().catch(()=>{}); }, {once: true});
