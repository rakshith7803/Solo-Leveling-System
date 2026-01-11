const DATA_VERSION = "V29_ETHEREAL";

let data = JSON.parse(localStorage.getItem("ME_SUPREME_V29")) || {
    version: DATA_VERSION, level: 1, exp: 0, streak: 0, theme: 'default',
    class: "AWAKENED", stats: { strength: 0, intelligence: 0, mentality: 0, vitality: 0, willpower: 0 },
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
const save = () => localStorage.setItem("ME_SUPREME_V29", JSON.stringify(data));

function triggerEvent(title, desc, reward) {
    const overlay = document.getElementById('system-overlay');
    document.getElementById('overlay-title').innerText = title;
    document.getElementById('overlay-desc').innerText = desc;
    document.getElementById('overlay-rewards').innerHTML = reward ? `<div style="color:#ffd700">+ ${reward}</div>` : '';
    overlay.classList.add('active');
    const sfx = title === "LEVEL UP" ? 'sfx-level' : 'sfx-quest';
    document.getElementById(sfx)?.play().catch(()=>{});
    setTimeout(() => overlay.classList.remove('active'), 3500);
}

function updateChart() {
    const ctx = document.getElementById('statChart')?.getContext('2d');
    if (!ctx) return;
    const vals = Object.values(data.stats);
    if (statChart) statChart.destroy();
    statChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['STR', 'INT', 'MEN', 'VIT', 'WIL'],
            datasets: [{ data: vals.every(v=>v===0)?[1,1,1,1,1]:vals, backgroundColor: ['#ff4d4d', '#00f2ff', '#a55eea', '#20bf6b', '#f7b731'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    });
}

function render() {
    document.body.className = 'theme-' + data.theme;
    document.getElementById('lvl-val').innerText = data.level;
    document.getElementById('cls-val').innerText = data.class;
    document.getElementById('streak-val').innerText = data.streak;
    document.getElementById('rank-val').innerText = data.level >= 15 ? 'C' : data.level >= 5 ? 'D' : 'E';
    
    const req = data.level * 100;
    document.getElementById('exp-fill').style.width = (data.exp/req*100) + "%";
    document.getElementById('exp-text').innerText = `${data.exp}/${req} EXP`;
    document.getElementById('boss-fill').style.width = (Math.min(data.weeklyProgress,5)/5*100) + "%";
    document.getElementById('boss-progress-text').innerText = `${Math.min(data.weeklyProgress,5)} / 5`;

    document.getElementById('stats-container').innerHTML = Object.entries(data.stats).map(([k,v]) => `<div style="margin-bottom:8px;"><b>${k.toUpperCase()}</b>: LVL ${v}</div>`).join('');
    document.getElementById('quest-list').innerHTML = data.quests.map(q => `
        <div class="quest-item ${data.completedToday.includes(q.id)?'done':''}">
            <span>${q.name}</span>
            ${data.completedToday.includes(q.id)?'<span>✓</span>':`<button class="btn-action" onclick="completeQuest(${q.id})">COMPLETE</button>`}
        </div>`).join('');
    updateChart();
}

function completeQuest(id) {
    if (data.completedToday.includes(id)) return;
    document.getElementById('sfx-click')?.play().catch(()=>{});
    const q = data.quests.find(x => x.id === id);
    data.completedToday.push(id);
    data.exp += q.exp;
    data.stats[q.stat] += q.gain;

    // FIX: WILLPOWER INCREASE
    if (data.completedToday.length === data.quests.length) {
        data.streak++;
        data.weeklyProgress++;
        data.stats.willpower += 1; // Explicitly adding willpower
        triggerEvent("PERFECT DAY", "Streak Progressed", "1 Willpower gained");
    }

    if (data.exp >= data.level * 100) {
        data.exp -= data.level * 100;
        data.level++;
        triggerEvent("LEVEL UP", `Reached Level ${data.level}`, "All Stats Balanced");
    }
    data.class = data.level >= 50 ? 'SHADOW MONARCH' : data.level >= 10 ? 'HUNTER' : 'AWAKENED';
    save(); render();
}

function startTimers() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-time').innerText = now.toLocaleTimeString('en-IN');
        document.getElementById('daily-timer').innerText = `RESET: ${23-now.getHours()}h ${59-now.getMinutes()}m`;
        let diff = (4 - now.getDay() + 7) % 7 || 7;
        document.getElementById('weekly-timer').innerText = `${diff-1}d ${23-now.getHours()}h`;
    }, 1000);
}

function resetSystem() { if(confirm("ABORT SYSTEM?")) { localStorage.clear(); location.reload(true); } }
function setTheme(t) { data.theme = t; save(); render(); }
function openSettings() { document.getElementById('settings-modal').style.display='flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }

window.onload = () => { render(); startTimers(); };
