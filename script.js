const MASTER_PASS = "35277Jairo924";
const WEBHOOK_URL = "https://macavi-n8n.e2z7ef.easypanel.host/webhook/update-dashboard-data-v2";
let dashboardData = { clientes: [], creativos: [], gemas: [], notas: "", antigravity_log: [] };

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
        renderAll();
        document.getElementById('last-sync').innerText = `Sincronizado: ${new Date(dashboardData.last_update || Date.now()).toLocaleString()}`;
    } catch (e) {
        console.error("Error cargando data inicial, usando fallback.");
        renderAll();
    }
}

function renderAll() {
    renderClients();
    renderFactory();
    renderGems();
    renderNotes();
    updateGemSelects();
}

// CLIENTS RENDERING
function renderClients() {
    const container = document.getElementById('clients-container');
    container.innerHTML = dashboardData.clientes.map(client => {
        const completed = client.steps.filter(s => s.completed).length;
        const total = client.steps.length;
        const percent = (completed / total) * 100;
        
        return `
            <div class="client-card glass">
                <h4>${client.name} <button class="btn-delete" onclick="deleteClient('${client.id}')"><i class="fa-solid fa-trash"></i></button></h4>
                <div class="prog-bar-bg"><div class="prog-bar-fill" style="width: ${percent}%"></div></div>
                <small>${completed}/${total} pasos completados</small>
                <div class="checklist">
                    ${client.steps.map(step => `
                        <div class="check-item">
                            <input type="checkbox" ${step.completed ? 'checked' : ''} onchange="toggleClientStep('${client.id}', ${step.id})">
                            <span>${step.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// FACTORY RENDERING
function renderFactory() {
    const container = document.getElementById('factory-container');
    container.innerHTML = dashboardData.creativos.map(item => `
        <div class="factory-card glass">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                   <span class="card-type">${item.type}</span>
                   <h4 style="margin: 10px 0 5px 0">${item.title}</h4>
                </div>
                <button class="btn-delete" onclick="deleteCreative('${item.id}')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <span class="gem-badge"><i class="fa-solid fa-brain"></i> ${item.gema_vinculada || 'Sin gema'}</span>
            <input type="text" placeholder="ID/Título de la Charla" value="${item.thread_title || ''}" 
                   onchange="updateCreativeField('${item.id}', 'thread_title', this.value)"
                   style="font-size: 11px; background: transparent; border: 1px solid var(--border); padding: 5px; width: 100%; border-radius: 5px; color: var(--emerald);">
            
            <textarea placeholder="Pegá el copy estratégico aquí..." 
                      onchange="updateCreativeField('${item.id}', 'copy', this.value)">${item.copy || ''}</textarea>
            
            <div class="checklist" style="margin-top: 15px;">
                <label class="check-item"><input type="checkbox" ${item.assets.freepik ? 'checked' : ''} onchange="toggleAsset('${item.id}', 'freepik')"> Freepik / Assets</label>
                <label class="check-item"><input type="checkbox" ${item.assets.voice ? 'checked' : ''} onchange="toggleAsset('${item.id}', 'voice')"> Voz en Off / AI</label>
                <label class="check-item"><input type="checkbox" ${item.assets.video ? 'checked' : ''} onchange="toggleAsset('${item.id}', 'video')"> Edición / Final</label>
            </div>
        </div>
    `).join('');
}

// GEMS RENDERING
function renderGems() {
    const grid = document.getElementById('gems-grid');
    grid.innerHTML = dashboardData.gemas.map(gem => `
        <div class="gem-card glass">
            <h5>${gem.name}</h5>
            <p>${gem.description}</p>
        </div>
    `).join('');
}

function renderNotes() {
    document.getElementById('notes-area').value = dashboardData.notas || "";
}

// UI ACTIONS
function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function updateGemSelects() {
    const select = document.getElementById('new-creative-gem');
    if (!select) return;
    select.innerHTML = dashboardData.gemas.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
}

// CRUD OPERATIONS
function addClient() {
    const name = document.getElementById('new-client-name').value;
    if (!name) return;
    
    const newClient = {
        id: 'cl-' + Date.now(),
        name: name,
        steps: [
            { id: 1, label: "Crear cuenta EasyPanel", completed: false },
            { id: 2, label: "Instalar n8n / Herramientas", completed: false },
            { id: 3, label: "Conectar Evolution/YCloud", completed: false },
            { id: 4, label: "Mapeo de Datos y Webhooks", completed: false },
            { id: 5, label: "Entrega de Manual Cliente", completed: false }
        ]
    };
    
    dashboardData.clientes.push(newClient);
    closeAllModals();
    renderClients();
    document.getElementById('new-client-name').value = '';
}

function addCreative() {
    const title = document.getElementById('new-creative-title').value;
    const type = document.getElementById('new-creative-type').value;
    const gem = document.getElementById('new-creative-gem').value;
    if (!title) return;

    const newCr = {
        id: 'cr-' + Date.now(),
        title: title,
        type: type,
        gema_vinculada: gem,
        thread_title: "",
        copy: "",
        assets: { freepik: false, voice: false, video: false }
    };

    dashboardData.creativos.push(newCr);
    closeAllModals();
    renderFactory();
    document.getElementById('new-creative-title').value = '';
}

// UPDATE LOGIC
function toggleClientStep(clientId, stepId) {
    const client = dashboardData.clientes.find(c => c.id === clientId);
    const step = client.steps.find(s => s.id === stepId);
    step.completed = !step.completed;
    renderClients();
}

function toggleAsset(crId, assetKey) {
    const cr = dashboardData.creativos.find(c => c.id === crId);
    cr.assets[assetKey] = !cr.assets[assetKey];
}

function updateCreativeField(crId, field, value) {
    const cr = dashboardData.creativos.find(c => c.id === crId);
    cr[field] = value;
}

function updateNotes(val) {
    dashboardData.notas = val;
}

function deleteClient(id) {
    if(confirm("¿Eliminar cliente?")) {
        dashboardData.clientes = dashboardData.clientes.filter(c => c.id !== id);
        renderClients();
    }
}

function deleteCreative(id) {
    dashboardData.creativos = dashboardData.creativos.filter(c => c.id !== id);
    renderFactory();
}

// SAVE & SYNC
document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
    
    dashboardData.last_update = new Date().toISOString();
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dashboardData)
        });

        if (response.ok) {
            alert("¡Éxito! Dashboard sincronizado en la nube (GitHub).");
        } else {
            throw new Error("Respuesta no OK");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión. Asegurate de que n8n esté activo y tenga CORS habilitado.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Sincronización';
    }
});
