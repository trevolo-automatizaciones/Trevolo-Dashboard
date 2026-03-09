const MASTER_PASS = "35277Jairo924";
let dashboardData = {};

// LOGIN LOGIC
document.getElementById('login-btn').addEventListener('click', () => {
    const input = document.getElementById('pass-input').value;
    if (input === MASTER_PASS) {
        document.body.classList.remove('locked');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadData();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
});

// TAB SWITCHING
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// DATA LOADING
async function loadData() {
    try {
        const response = await fetch('data.json');
        dashboardData = await response.json();
        renderOps();
        renderFactory();
        renderGems();
        renderLogs();
        document.getElementById('last-sync').innerText = `Sincronizado: ${new Date(dashboardData.last_update).toLocaleString()}`;
    } catch (e) {
        console.error("Error cargando data:", e);
    }
}

function renderOps() {
    const list = document.getElementById('onboarding-list');
    list.innerHTML = dashboardData.onboarding.steps.map(step => `
        <li>
            <div class="check-btn ${step.completed ? 'completed' : ''}" onclick="toggleStep(${step.id})">
                ${step.completed ? '<i class="fa-solid fa-check"></i>' : ''}
            </div>
            <span>${step.label}</span>
        </li>
    `).join('');
}

function renderFactory() {
    const container = document.getElementById('factory-container');
    container.innerHTML = dashboardData.content_factory.map(item => `
        <div class="card glass">
            <div class="card-header">
                <h4>${item.title}</h4>
                <span class="status-tag ${item.status}">${item.status.replace('_', ' ')}</span>
            </div>
            <div class="assets-checklist">
                <label><input type="checkbox" ${item.assets.freepik ? 'checked' : ''} onchange="updateAsset('${item.id}', 'freepik')"> Freepik Assets</label><br>
                <label><input type="checkbox" ${item.assets.voice ? 'checked' : ''} onchange="updateAsset('${item.id}', 'voice')"> Voz en Off</label><br>
                <label><input type="checkbox" ${item.assets.video ? 'checked' : ''} onchange="updateAsset('${item.id}', 'video')"> Edición Final</label>
            </div>
            <textarea placeholder="Pegá el copy aquí..." onchange="updateCopy('${item.id}', this.value)">${item.copy}</textarea>
        </div>
    `).join('');
}

function renderGems() {
    const grid = document.getElementById('gems-grid');
    grid.innerHTML = dashboardData.gemas.map(gem => `
        <div class="card glass" style="border-left: 4px solid var(--emerald)">
            <h5 style="color: var(--emerald); margin-bottom: 5px;">${gem.name}</h5>
            <small style="color: var(--text-dim)">Categoría: ${gem.category}</small>
        </div>
    `).join('');
}

function renderLogs() {
    const content = document.getElementById('log-content');
    content.innerHTML = dashboardData.antigravity_log.map(log => `
        <div class="log-item">
            <span class="log-date">${log.date}</span>
            <p>${log.event}</p>
        </div>
    `).join('');
}

// UPDATE FUNCTIONS
function toggleStep(id) {
    const step = dashboardData.onboarding.steps.find(s => s.id === id);
    step.completed = !step.completed;
    renderOps();
}

function updateAsset(itemId, assetKey) {
    const item = dashboardData.content_factory.find(i => i.id === itemId);
    item.assets[assetKey] = !item.assets[assetKey];
}

function updateCopy(itemId, value) {
    const item = dashboardData.content_factory.find(i => i.id === itemId);
    item.copy = value;
}

// SAVE LOGIC (WEBHOOK)
document.getElementById('save-btn').addEventListener('click', async () => {
    document.getElementById('save-btn').innerText = "Guardando...";
    dashboardData.last_update = new Date().toISOString();
    
    // Aquí es donde n8n toma el relevo
    const WEBHOOK_URL = "URL_DE_TU_N8N_ACA"; // El usuario debe proveer esto
    
    try {
        console.log("Enviando a n8n:", dashboardData);
        alert("¡Datos guardados localmente! Para sincronizar con GitHub, conectá el Webhook de n8n.");
        document.getElementById('save-btn').innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Cambios';
    } catch (e) {
        alert("Error al guardar.");
    }
});
