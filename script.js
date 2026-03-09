let dashboardData = {
    clientes: [],
    creativos: [],
    gemas: [],
    templates: {
        chatbot: [],
        stock: [],
        custom: []
    }
};

const WEBHOOK_URL = 'https://macavi-n8n.e2z7ef.easypanel.host/webhook/update-dashboard-data-v2';
const MASTER_PASS = '35277Jairo924';

// AUTH
document.getElementById('login-btn').addEventListener('click', () => {
    const p = document.getElementById('pass-input').value;
    if (p === MASTER_PASS) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.body.classList.remove('locked');
        loadData();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
});

// DATA HANDLING
async function loadData() {
    try {
        const response = await fetch('data.json', { cache: 'no-store' });
        if (response.ok) {
            dashboardData = await response.json();
            updateUI();
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function updateUI() {
    renderClients();
    renderFactory();
    renderGems();
    updateLastSync();
}

function updateLastSync() {
    const date = new Date();
    // Offset for Argentina (UTC-3)
    const argTime = new Date(date.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    const hours = String(argTime.getHours()).padStart(2, '0');
    const mins = String(argTime.getMinutes()).padStart(2, '0');
    document.getElementById('last-sync').innerText = `Sincronizado: ${hours}:${mins}hs (🇦🇷)`;
}

// CLIENTS RENDERING
function renderClients() {
    const container = document.getElementById('clients-container');
    container.innerHTML = dashboardData.clientes.map(client => {
        const steps = client.steps || [];
        const completed = steps.filter(s => s.completed).length;
        const total = steps.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;
        
        return `
            <div class="project-card glass">
                <div class="card-header">
                    <h4>${client.name} <button class="btn-delete" onclick="deleteItem('clientes', '${client.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                </div>
                
                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <span class="prog-text">${completed}/${total} Pasos</span>

                <div class="checklist">
                    ${steps.map(step => `
                        <div class="check-item-row">
                            <label class="check-item">
                                <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleStep('clientes', '${client.id}', ${step.id})">
                                <span>${step.label}</span>
                            </label>
                            <button class="btn-mini-delete" onclick="deleteStep('clientes', '${client.id}', ${step.id})">×</button>
                        </div>
                    `).join('')}
                    <button class="btn-add-step" onclick="openAddStepModal('clientes', '${client.id}')">+ Agregar Paso</button>
                </div>

                <div class="project-gems">
                    <div class="linked-gems-list">
                        ${renderLinkedGems(client.gemas_vinculadas || [], 'clientes', client.id)}
                        <button class="btn-gem-add" onclick="openLinkGemModal('clientes', '${client.id}', '${client.name}')"><i class="fa-solid fa-link"></i> Vincular Gema</button>
                    </div>
                </div>

                <div class="project-notes">
                    <label><i class="fa-solid fa-table"></i> Google Sheets</label>
                    <input type="text" placeholder="Pegá link de Sheets aquí" value="${client.sheets_link || ''}" 
                           onchange="updateProjectField('clientes', '${client.id}', 'sheets_link', this.value)"
                           class="link-input">
                    <label>Notas de Proyecto</label>
                    <textarea placeholder="..." onchange="updateProjectField('clientes', '${client.id}', 'notas', this.value)">${client.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

// FACTORY RENDERING
function renderFactory() {
    const container = document.getElementById('factory-container');
    container.innerHTML = dashboardData.creativos.map(item => {
        const steps = item.steps || [];
        const completed = steps.filter(s => s.completed).length;
        const total = steps.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;

        return `
            <div class="project-card glass">
                <div class="card-header">
                    <span class="card-type">${item.type}</span>
                    <h4 style="margin-top:10px">${item.title} <button class="btn-delete" onclick="deleteItem('creativos', '${item.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                </div>

                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <span class="prog-text">Progreso: ${Math.round(percent)}%</span>

                <div class="checklist">
                    ${steps.map(step => `
                        <div class="check-item-row">
                            <label class="check-item">
                                <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleStep('creativos', '${item.id}', ${step.id})">
                                <span>${step.label}</span>
                            </label>
                            <button class="btn-mini-delete" onclick="deleteStep('creativos', '${item.id}', ${step.id})">×</button>
                        </div>
                    `).join('')}
                    <button class="btn-add-step" onclick="openAddStepModal('creativos', '${item.id}')">+ Agregar Paso</button>
                </div>

                <div class="project-gems">
                    <div class="linked-gems-list">
                        ${renderLinkedGems(item.gemas_vinculadas || [], 'creativos', item.id)}
                        <button class="btn-gem-add" onclick="openLinkGemModal('creativos', '${item.id}', '${item.title}')"><i class="fa-solid fa-link"></i> Vincular Gema</button>
                    </div>
                </div>

                <div class="project-notes">
                    <label><i class="fa-solid fa-table"></i> Google Sheets</label>
                    <input type="text" placeholder="Pegá link de Sheets aquí" value="${item.sheets_link || ''}" 
                           onchange="updateProjectField('creativos', '${item.id}', 'sheets_link', this.value)"
                           class="link-input">
                    <label>Copy / Notas</label>
                    <textarea placeholder="..." onchange="updateProjectField('creativos', '${item.id}', 'notas', this.value)">${item.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

function renderLinkedGems(gems, type, parentId) {
    if (!gems.length) return '';
    return gems.map((g, idx) => `
        <div class="linked-gem-tag">
            <span><strong>${g.name}</strong>: ${g.thread_title}</span>
            <button onclick="unlinkGem('${type}', '${parentId}', ${idx})">×</button>
        </div>
    `).join('');
}

// LOGIC ACTIONS
function toggleStep(type, parentId, stepId) {
    const list = dashboardData[type];
    const parent = list.find(p => p.id === parentId);
    if (parent) {
        const step = parent.steps.find(s => s.id === stepId);
        if (step) step.completed = !step.completed;
        updateUI();
    }
}

function updateProjectField(type, id, field, val) {
    const item = dashboardData[type].find(p => p.id === id);
    if (item) {
        item[field] = val;
    }
}

// ADD/DELETE ITEMS
function addClient() {
    const name = document.getElementById('new-client-name').value;
    const templateKey = document.getElementById('new-client-template').value;
    if (!name) return;

    const newClient = {
        id: 'cl-' + Date.now(),
        name: name,
        sheets_link: '',
        notas: '',
        gemas_vinculadas: [],
        steps: JSON.parse(JSON.stringify(dashboardData.templates[templateKey] || []))
    };

    dashboardData.clientes.push(newClient);
    closeAllModals();
    updateUI();
}

function addCreative() {
    const title = document.getElementById('new-creative-title').value;
    const type = document.getElementById('new-creative-type').value;
    if (!title) return;

    const newCreative = {
        id: 'cr-' + Date.now(),
        title: title,
        type: type,
        sheets_link: '',
        notas: '',
        gemas_vinculadas: [],
        steps: [
            { id: 1, label: 'Guion / Script', completed: false },
            { id: 2, label: 'Selección de Assets', completed: false },
            { id: 3, label: 'Generación Audio/AI', completed: false },
            { id: 4, label: 'Edición Final', completed: false },
            { id: 5, label: 'Publicación', completed: false }
        ]
    };

    dashboardData.creativos.push(newCreative);
    closeAllModals();
    updateUI();
}

function deleteItem(type, id) {
    if (confirm('¿Seguro que querés eliminar?')) {
        dashboardData[type] = dashboardData[type].filter(p => p.id !== id);
        updateUI();
    }
}

// GEMS MANAGEMENT
function renderGems() {
    const grid = document.getElementById('gems-grid');
    grid.innerHTML = dashboardData.gemas.map(g => `
        <div class="gem-card glass">
            <h5>${g.name} <button class="btn-mini-delete" onclick="deleteGem('${g.name}')">×</button></h5>
            <p>${g.description}</p>
        </div>
    `).join('');
}

function addGem() {
    const name = document.getElementById('new-gem-name').value;
    const desc = document.getElementById('new-gem-desc').value;
    if (!name) return;

    dashboardData.gemas.push({ name, description: desc });
    closeAllModals();
    updateUI();
}

function deleteGem(name) {
    if (confirm(`¿Eliminar gema ${name}?`)) {
        dashboardData.gemas = dashboardData.gemas.filter(g => g.name !== name);
        updateUI();
    }
}

// LINK GEMS MODAL
let activeLinkTarget = { type: '', id: '' };
function openLinkGemModal(type, id, name) {
    activeLinkTarget = { type, id };
    document.getElementById('link-gem-target-name').innerText = `Vinculando a: ${name}`;
    const select = document.getElementById('select-gem-to-link');
    select.innerHTML = dashboardData.gemas.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
    openModal('modal-link-gem');
}

function confirmLinkGem() {
    const gemName = document.getElementById('select-gem-to-link').value;
    const thread = document.getElementById('link-gem-thread').value;
    if (!gemName || !thread) return;

    const list = dashboardData[activeLinkTarget.type];
    const item = list.find(p => p.id === activeLinkTarget.id);
    if (item) {
        if (!item.gemas_vinculadas) item.gemas_vinculadas = [];
        item.gemas_vinculadas.push({ name: gemName, thread_title: thread });
        closeAllModals();
        updateUI();
    }
}

function unlinkGem(type, parentId, idx) {
    const item = dashboardData[type].find(p => p.id === parentId);
    if (item) {
        item.gemas_vinculadas.splice(idx, 1);
        updateUI();
    }
}

// CUSTOM STEPS
let activeStepTarget = { type: '', id: '' };
function openAddStepModal(type, id) {
    activeStepTarget = { type, id };
    openModal('modal-add-step');
}

function confirmAddStep() {
    const label = document.getElementById('new-step-label').value;
    if (!label) return;

    const item = dashboardData[activeStepTarget.type].find(p => p.id === activeStepTarget.id);
    if (item) {
        const nextId = item.steps.length > 0 ? Math.max(...item.steps.map(s => s.id)) + 1 : 1;
        item.steps.push({ id: nextId, label, completed: false });
        closeAllModals();
        updateUI();
    }
}

function deleteStep(type, parentId, stepId) {
    const item = dashboardData[type].find(p => p.id === parentId);
    if (item) {
        item.steps = item.steps.filter(s => s.id !== stepId);
        updateUI();
    }
}

// SYNC
document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dashboardData)
        });

        if (response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Éxito!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar (Argentina)';
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error('Sync failed');
        }
    } catch (e) {
        alert('Error al sincronizar. Verificá n8n.');
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Error';
        btn.disabled = false;
    }
});

// MODAL UTILS
function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    // Reset inputs
    document.querySelectorAll('.modal input, .modal textarea').forEach(i => i.value = '');
}

// TABS
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});
