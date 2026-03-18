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

// UI Navigation and Modals
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    });
});

function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// LOGIN SYSTEM
document.getElementById('login-btn').addEventListener('click', () => {
    const pass = document.getElementById('pass-input').value;
    if (pass === 'trevoloops') {
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
        let fileData = window.initialData; // Cargado directo y limpio sin Fetch (Bye CORS error)
        let localData = null;

        // Vaciado forzoso por única vez del caché corrupto por la falla anterior
        if (!localStorage.getItem('fix_version_2')) {
            localStorage.removeItem('trevoloData');
            localStorage.setItem('fix_version_2', 'true');
        }

        // Intentamos cargar de localStorage primero (la versión más actual del PC)
        const localSavedData = localStorage.getItem('trevoloData');
        if (localSavedData) {
            localData = JSON.parse(localSavedData);
        }

        // Comparamos para usar el más reciente, o priorizamos localStorage si fileData no tiene last_update
        if (localData && fileData) {
            const localDate = new Date(localData.last_update || 0);
            const fileDate = new Date(fileData.last_update || 0);
            if (localDate >= fileDate) {
                dashboardData = localData;
            } else {
                dashboardData = fileData;
            }
        } else if (localData) {
            dashboardData = localData;
        } else if (fileData) {
            dashboardData = fileData;
        }

        updateUI();
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function saveLocalData() {
    dashboardData.last_update = new Date().toISOString();
    localStorage.setItem('trevoloData', JSON.stringify(dashboardData));
}

function updateUI() {
    renderClients();
    renderFactory();
    renderGems();
    updateLastSync();
    saveLocalData(); // Autoguardado silencioso instantáneo
}

function updateLastSync() {
    const date = new Date();
    // Offset for Argentina (UTC-3)
    const argTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
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
                    <textarea placeholder="Notas estratégicas, accesos, etc..." 
                              onchange="updateProjectField('clientes', '${client.id}', 'notas', this.value)">${client.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

// CONVERSIONS FOR CREATIVE TYPES
const creativeTypes = {
    'reel': { icon: 'fa-video', label: 'Reel/Short' },
    'carousel': { icon: 'fa-images', label: 'Carrusel' },
    'single': { icon: 'fa-image', label: 'Post' }
};

// FACTORY/CREATIVES RENDERING
function renderFactory() {
    const container = document.getElementById('factory-container');
    container.innerHTML = dashboardData.creativos.map(project => {
        const steps = project.steps || [];
        const completed = steps.filter(s => s.completed).length;
        const total = steps.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;
        const typeInfo = creativeTypes[project.type] || creativeTypes['single'];

        return `
            <div class="project-card glass">
                <div class="card-header">
                    <h4><i class="fa-solid ${typeInfo.icon}"></i> ${project.title} <button class="btn-delete" onclick="deleteItem('creativos', '${project.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                    <span class="badge ${project.type}">${typeInfo.label}</span>
                </div>
                
                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <span class="prog-text">${completed}/${total} Completado</span>

                <div class="checklist">
                    ${steps.map(step => `
                        <div class="check-item-row">
                            <label class="check-item">
                                <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleStep('creativos', '${project.id}', ${step.id})">
                                <span>${step.label}</span>
                            </label>
                            <button class="btn-mini-delete" onclick="deleteStep('creativos', '${project.id}', ${step.id})">×</button>
                        </div>
                    `).join('')}
                    <button class="btn-add-step" onclick="openAddStepModal('creativos', '${project.id}')">+ Agregar Paso</button>
                </div>

                <div class="project-gems">
                    <div class="linked-gems-list">
                        ${renderLinkedGems(project.gemas_vinculadas || [], 'creativos', project.id)}
                        <button class="btn-gem-add" onclick="openLinkGemModal('creativos', '${project.id}', '${project.title}')"><i class="fa-solid fa-link"></i> Vincular Gema</button>
                    </div>
                </div>

                <div class="project-notes">
                    <label><i class="fa-solid fa-folder-open"></i> Carpeta Assets / Docs</label>
                    <input type="text" placeholder="Link de Drive o Figma..." value="${project.sheets_link || ''}" 
                           onchange="updateProjectField('creativos', '${project.id}', 'sheets_link', this.value)"
                           class="link-input">
                    <label>Briefing / Copy</label>
                    <textarea placeholder="Hooks, Guion, Textos..." 
                              onchange="updateProjectField('creativos', '${project.id}', 'notas', this.value)">${project.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
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
        saveLocalData(); // Guardar nota/link en PC sin re-renderizar todo
    }
}

// ADD/DELETE ITEMS
function addClient() {
    const name = document.getElementById('new-client-name').value;
    const tplKey = document.getElementById('new-client-template').value;
    if (!name) return;

    // Deep copy de los pasos del template para no mutar el modelo
    const templateSteps = Array.isArray(dashboardData.templates[tplKey]) 
        ? JSON.parse(JSON.stringify(dashboardData.templates[tplKey]))
        : [];

    dashboardData.clientes.unshift({
        id: 'cl-' + Date.now(),
        name: name,
        template: tplKey,
        steps: templateSteps,
        notas: '',
        sheets_link: '',
        gemas_vinculadas: []
    });
    
    document.getElementById('new-client-name').value = '';
    closeAllModals();
    updateUI();
}

function addCreative() {
    const title = document.getElementById('new-creative-title').value;
    const type = document.getElementById('new-creative-type').value;
    if (!title) return;

    // Pasos genéricos estándar
    const genericSteps = [
        { id: 1, label: "Guion / Script", completed: false },
        { id: 2, label: "Selección de Assets", completed: false },
        { id: 3, label: (type === 'reel') ? "Generación Audio/AI" : "Diseño Visual", completed: false },
        { id: 4, label: "Edición Final", completed: false },
        { id: 5, label: "Publicación", completed: false }
    ];

    dashboardData.creativos.unshift({
        id: 'cr-' + Date.now(),
        title: title,
        type: type,
        steps: genericSteps,
        notas: '',
        sheets_link: '',
        gemas_vinculadas: []
    });
    
    document.getElementById('new-creative-title').value = '';
    closeAllModals();
    updateUI();
}

function deleteItem(type, id) {
    if(confirm('¿Seguro que querés eliminar esto?')) {
        dashboardData[type] = dashboardData[type].filter(item => item.id !== id);
        updateUI();
    }
}

// GEMS LOGIC --
function renderGems() {
    const grid = document.getElementById('gems-grid');
    grid.innerHTML = dashboardData.gemas.map(gem => `
        <div class="gem-card glass">
            <h4><i class="fa-solid fa-gem"></i> ${gem.name} <button class="btn-delete" onclick="deleteGem('${gem.name}')"><i class="fa-solid fa-trash"></i></button></h4>
            <p>${gem.description}</p>
        </div>
    `).join('');
}

function addGem() {
    const name = document.getElementById('new-gem-name').value;
    const desc = document.getElementById('new-gem-desc').value;
    if (!name) return;

    dashboardData.gemas.push({ name, description: desc });
    
    document.getElementById('new-gem-name').value = '';
    document.getElementById('new-gem-desc').value = '';
    closeAllModals();
    updateUI();
}

function deleteGem(name) {
    if(confirm('¿Seguro que querés eliminar esta Gema del directorio?')) {
        dashboardData.gemas = dashboardData.gemas.filter(g => g.name !== name);
        // También habría que desvincularla de los proyectos (limpieza)
        ['clientes', 'creativos'].forEach(type => {
            dashboardData[type].forEach(item => {
                if(item.gemas_vinculadas) {
                    item.gemas_vinculadas = item.gemas_vinculadas.filter(g => g.name !== name);
                }
            });
        });
        updateUI();
    }
}

// LINKING GEMS TO PROJECTS --
let currentLinkTargetUrl = { type: null, id: null };

function openLinkGemModal(targetType, targetId, targetName) {
    currentLinkTargetUrl = { type: targetType, id: targetId };
    document.getElementById('link-gem-target-name').innerText = `Vincular a: ${targetName}`;
    
    const select = document.getElementById('select-gem-to-link');
    select.innerHTML = dashboardData.gemas.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
    
    document.getElementById('link-gem-thread').value = '';
    openModal('modal-link-gem');
}

function confirmLinkGem() {
    const gemName = document.getElementById('select-gem-to-link').value;
    const threadTitle = document.getElementById('link-gem-thread').value;
    
    if(!gemName || !currentLinkTargetUrl.id) return;

    const list = dashboardData[currentLinkTargetUrl.type];
    const item = list.find(p => p.id === currentLinkTargetUrl.id);
    
    if (item) {
        if (!item.gemas_vinculadas) item.gemas_vinculadas = [];
        item.gemas_vinculadas.push({
            name: gemName,
            thread_title: threadTitle || 'Chat General'
        });
        updateUI();
    }
    closeAllModals();
}

function unlinkGem(type, itemId, gemName) {
    const list = dashboardData[type];
    const item = list.find(p => p.id === itemId);
    if (item && item.gemas_vinculadas) {
        item.gemas_vinculadas = item.gemas_vinculadas.filter(g => g.name !== gemName);
        updateUI();
    }
}

function renderLinkedGems(linkedArray, type, itemId) {
    if (!linkedArray || linkedArray.length === 0) return '';
    return linkedArray.map(link => `
        <div class="linked-gem-tag">
            <span><strong><i class="fa-solid fa-gem"></i> ${link.name}</strong> - Charla: ${link.thread_title}</span>
            <button class="btn-unlink" onclick="unlinkGem('${type}', '${itemId}', '${link.name}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}


// ADDING CUSTOM STEPS --
let currentAddStepTarget = { type: null, id: null };

function openAddStepModal(targetType, targetId) {
    currentAddStepTarget = { type: targetType, id: targetId };
    document.getElementById('new-step-label').value = '';
    openModal('modal-add-step');
}

function confirmAddStep() {
    const label = document.getElementById('new-step-label').value;
    if(!label || !currentAddStepTarget.id) return;

    const list = dashboardData[currentAddStepTarget.type];
    const item = list.find(p => p.id === currentAddStepTarget.id);
    
    if (item) {
        if (!item.steps) item.steps = [];
        const newId = item.steps.length > 0 ? Math.max(...item.steps.map(s => s.id)) + 1 : 1;
        item.steps.push({
            id: newId,
            label: label,
            completed: false
        });
        updateUI();
    }
    closeAllModals();
}

function deleteStep(type, parentId, stepId) {
    if(confirm('¿Borrar este paso?')) {
        const list = dashboardData[type];
        const item = list.find(p => p.id === parentId);
        if (item && item.steps) {
            item.steps = item.steps.filter(s => s.id !== stepId);
            updateUI();
        }
    }
}


// SYNC TO WEBHOOK
document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
    btn.disabled = true;

    try {
        const payload = JSON.parse(JSON.stringify(dashboardData)); // Copia limpia
        
        // El webhook responde bien? (Tener en cuenta que el n8n responde {"success":true})
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Sincronizado OK';
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar (Argentina)';
                btn.classList.remove('success');
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error('Server Return Error');
        }
    } catch (e) {
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error de Sincronización';
        btn.style.backgroundColor = '#ef4444';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Reintentar Sincronizar';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 3000);
        console.error('Webhook Error:', e);
    }
});