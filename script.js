const MASTER_PASS = "35277Jairo924";
const WEBHOOK_URL = "https://macavi-n8n.e2z7ef.easypanel.host/webhook/update-dashboard-data-v2";
let dashboardData = { clientes: [], creativos: [], gemas: [], last_update: "" };
let linkGemTarget = { type: null, id: null };

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
        // Inicializar campos si faltan por migración v2->v3
        if(!dashboardData.gemas) dashboardData.gemas = [];
        if(!dashboardData.clientes) dashboardData.clientes = [];
        if(!dashboardData.creativos) dashboardData.creativos = [];
        
        renderAll();
        updateLastSyncText();
    } catch (e) {
        console.error("Error cargando data inicial.");
        renderAll();
    }
}

function updateLastSyncText() {
    if(!dashboardData.last_update) return;
    const date = new Date(dashboardData.last_update);
    document.getElementById('last-sync').innerText = `Sincronizado: ${date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;
}

function renderAll() {
    renderClients();
    renderFactory();
    renderGems();
}

// CLIENTS RENDERING
function renderClients() {
    const container = document.getElementById('clients-container');
    container.innerHTML = dashboardData.clientes.map(client => {
        const completed = client.steps.filter(s => s.completed).length;
        const total = client.steps.length;
        const percent = (completed / total) * 100;
        
        return `
            <div class="project-card glass">
                <div class="card-header">
                    <h4>${client.name} <button class="btn-delete" onclick="deleteItem('clientes', '${client.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                </div>
                
                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <span class="prog-text">${completed}/${total} Pasos Completados</span>

                <div class="checklist">
                    ${client.steps.map(step => `
                        <label class="check-item">
                            <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleStep('clientes', '${client.id}', ${step.id})">
                            <span>${step.label}</span>
                        </label>
                    `).join('')}
                </div>

                <div class="project-gems">
                    <div class="gems-header">
                        <label>Gemas Estratégicas</label>
                        <button class="btn-gem-add" onclick="openLinkGemModal('clientes', '${client.id}', '${client.name}')"><i class="fa-solid fa-link"></i> Vincular</button>
                    </div>
                    <div class="linked-gems-list">
                        ${renderLinkedGems(client.gemas_vinculadas || [], 'clientes', client.id)}
                    </div>
                </div>

                <div class="project-notes">
                    <label>Notas de Proyecto</label>
                    <textarea placeholder="Datos importantes del cliente..." onchange="updateProjectField('clientes', '${client.id}', 'notas', this.value)">${client.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

// FACTORY RENDERING
function renderFactory() {
    const container = document.getElementById('factory-container');
    container.innerHTML = dashboardData.creativos.map(item => {
        const completed = item.steps.filter(s => s.completed).length;
        const total = item.steps.length;
        const percent = (completed / total) * 100;

        return `
            <div class="project-card glass">
                <div class="card-header">
                    <span class="card-type">${item.type}</span>
                    <h4 style="margin-top:10px">${item.title} <button class="btn-delete" onclick="deleteItem('creativos', '${item.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                </div>

                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <span class="prog-text">Progreso: ${Math.round(percent)}%</span>

                <div class="checklist">
                    ${item.steps.map(step => `
                        <label class="check-item">
                            <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleStep('creativos', '${item.id}', ${step.id})">
                            <span>${step.label}</span>
                        </label>
                    `).join('')}
                </div>

                <div class="project-gems">
                    <div class="gems-header">
                        <label>Gemas Utilizadas</label>
                        <button class="btn-gem-add" onclick="openLinkGemModal('creativos', '${item.id}', '${item.title}')"><i class="fa-solid fa-link"></i> Vincular</button>
                    </div>
                    <div class="linked-gems-list">
                        ${renderLinkedGems(item.gemas_vinculadas || [], 'creativos', item.id)}
                    </div>
                </div>

                <div class="project-notes">
                    <label>Copy Estratégico y Notas</label>
                    <textarea placeholder="Pegá el copy o ideas aquí..." onchange="updateProjectField('creativos', '${item.id}', 'notas', this.value)">${item.notas || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

// GEMS (Directorio)
function renderGems() {
    const grid = document.getElementById('gems-grid');
    grid.innerHTML = dashboardData.gemas.map(gem => `
        <div class="gem-tile glass">
            <h5>${gem.name}</h5>
            <p>${gem.description}</p>
            <button class="btn-gem-delete" onclick="deleteGem('${gem.name}')"><i class="fa-solid fa-circle-xmark"></i></button>
        </div>
    `).join('');
}

// HELPERS
function renderLinkedGems(list, type, parentId) {
    if(list.length === 0) return `<small style="color:var(--text-dim)">Sin gemas vinculadas</small>`;
    return list.map((lg, index) => `
        <div class="gem-linked-item">
            <div class="gem-top">
                <span>${lg.name}</span>
                <button class="btn-unlink" onclick="unlinkGem('${type}', '${parentId}', ${index})"><i class="fa-solid fa-unlink"></i></button>
            </div>
            <input type="text" class="gem-thread" placeholder="Título de la charla..." value="${lg.thread_title || ''}" 
                   onchange="updateLinkedGemTitle('${type}', '${parentId}', ${index}, this.value)">
        </div>
    `).join('');
}

// MODAL LOGIC
function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function openLinkGemModal(type, id, name) {
    linkGemTarget = { type, id };
    document.getElementById('link-gem-target-name').innerText = `Vinculando a: ${name}`;
    const select = document.getElementById('select-gem-to-link');
    select.innerHTML = dashboardData.gemas.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
    document.getElementById('link-gem-thread').value = "";
    openModal('modal-link-gem');
}

function confirmLinkGem() {
    const gemName = document.getElementById('select-gem-to-link').value;
    const thread = document.getElementById('link-gem-thread').value;
    if(!gemName) return;

    const item = dashboardData[linkGemTarget.type].find(i => i.id === linkGemTarget.id);
    if(!item.gemas_vinculadas) item.gemas_vinculadas = [];
    item.gemas_vinculadas.push({ name: gemName, thread_title: thread });
    
    closeAllModals();
    renderAll();
}

// CRUD ACTIONS
function addClient() {
    const name = document.getElementById('new-client-name').value;
    if(!name) return;
    dashboardData.clientes.push({
        id: 'cl-' + Date.now(),
        name: name,
        notas: "",
        gemas_vinculadas: [],
        steps: [
            { id: 1, label: "Crear cuenta EasyPanel", completed: false },
            { id: 2, label: "Carpeta Drive de Cliente", completed: false },
            { id: 3, label: "Instalar n8n / Herramientas", completed: false },
            { id: 4, label: "Conectar Evolution/YCloud", completed: false },
            { id: 5, label: "Mapeo de Datos y Webhooks", completed: false },
            { id: 6, label: "Entrega de Manual Cliente", completed: false }
        ]
    });
    closeAllModals();
    document.getElementById('new-client-name').value = "";
    renderClients();
}

function addCreative() {
    const title = document.getElementById('new-creative-title').value;
    const type = document.getElementById('new-creative-type').value;
    if(!title) return;
    dashboardData.creativos.push({
        id: 'cr-' + Date.now(),
        title: title,
        type: type,
        notas: "",
        gemas_vinculadas: [],
        steps: [
            { id: 1, label: "Guion / Script Estratégico", completed: false },
            { id: 2, label: "Selección de Assets / Stock", completed: false },
            { id: 3, label: "Generación de Voz / Audio", completed: false },
            { id: 4, label: "Edición Final", completed: false },
            { id: 5, label: "Aprobación / Publicación", completed: false }
        ]
    });
    closeAllModals();
    document.getElementById('new-creative-title').value = "";
    renderFactory();
}

function addGem() {
    const name = document.getElementById('new-gem-name').value;
    const desc = document.getElementById('new-gem-desc').value;
    if(!name || !desc) return;
    dashboardData.gemas.push({ name, description: desc });
    closeAllModals();
    document.getElementById('new-gem-name').value = "";
    document.getElementById('new-gem-desc').value = "";
    renderGems();
}

// UPDATE LOGIC
function toggleStep(type, itemId, stepId) {
    const item = dashboardData[type].find(i => i.id === itemId);
    const step = item.steps.find(s => s.id === stepId);
    step.completed = !step.completed;
    renderAll();
}

function updateProjectField(type, itemId, field, value) {
    const item = dashboardData[type].find(i => i.id === itemId);
    item[field] = value;
}

function updateLinkedGemTitle(type, itemId, gemIndex, value) {
    const item = dashboardData[type].find(i => i.id === itemId);
    item.gemas_vinculadas[gemIndex].thread_title = value;
}

function unlinkGem(type, itemId, index) {
    const item = dashboardData[type].find(i => i.id === itemId);
    item.gemas_vinculadas.splice(index, 1);
    renderAll();
}

function deleteItem(type, id) {
    if(confirm(`¿Eliminar este ${type === 'clientes' ? 'cliente' : 'proyecto'}?`)) {
        dashboardData[type] = dashboardData[type].filter(i => i.id !== id);
        renderAll();
    }
}

function deleteGem(name) {
    if(confirm(`¿Eliminar gema ${name} del directorio?`)) {
        dashboardData.gemas = dashboardData.gemas.filter(g => g.name !== name);
        renderGems();
    }
}

// SAVE & SYNC (ARGENTINA TIME)
document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
    
    // Forzar fecha en America/Argentina/Buenos_Aires para el JSON
    const now = new Date();
    dashboardData.last_update = now.toISOString(); 

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dashboardData)
        });

        if (response.ok) {
            updateLastSyncText();
            alert("¡Éxito! Dashboard v3.0 sincronizado en horario de Argentina.");
        } else { throw new Error("n8n no respondió OK"); }
    } catch (e) {
        console.error(e);
        alert("Error de conexión. Verificá tu flujo de n8n.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar (Argentina)';
    }
});
