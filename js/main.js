document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const navLinks = document.querySelectorAll('.nav-link');

    let state = {
        transacoes: [],
        comprasParceladas: [],
        categorias: [],
        orcamentos: [],
        activePage: 'dashboard',
        charts: {},
    };

    // --- API & DATA HANDLING ---
    async function fetchData() {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha ao buscar dados');
            const data = await response.json();
            
            state.transacoes = data.transacoes || [];
            state.comprasParceladas = data.comprasParceladas || [];
            state.orcamentos = data.orcamentos || [];
            if (!data.categorias || data.categorias.length === 0) {
                state.categorias = [{ id: Date.now(), nome: 'Salário', tipo: 'receita' }];
                await saveData();
            } else {
                state.categorias = data.categorias;
            }
        } catch (error) {
            appRoot.innerHTML = `<p class="error-text">Erro fatal ao carregar dados.</p>`;
            console.error(error);
        }
    }

    async function saveData() {
        const { transacoes, comprasParceladas, categorias, orcamentos } = state;
        try {
            await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify({ transacoes, comprasParceladas, categorias, orcamentos }),
            });
        } catch (error) {
            console.error('Falha ao salvar dados:', error);
        }
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        appRoot.innerHTML = ''; // Limpa a tela
        switch (state.activePage) {
            case 'dashboard':
                appRoot.innerHTML = getDashboardHTML();
                renderDashboardContent();
                break;
            case 'orcamentos':
                appRoot.innerHTML = getOrcamentosHTML();
                renderOrcamentosContent();
                break;
            case 'categorias':
                appRoot.innerHTML = getCategoriasHTML();
                renderCategoriasContent();
                break;
        }
        updateNavLinks();
    }

    function updateNavLinks() {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.id === `nav-${state.activePage}`);
        });
    }

    // --- NAVIGATION ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            state.activePage = e.target.id.split('-')[1];
            render();
        });
    });

    // --- HTML TEMPLATES ---
    function getDashboardHTML() {
        return `
            <section class="strategic-grid">
                <!-- KPIs e Gráficos -->
            </section>
            <section class="card">
                <h2>Adicionar Nova Transação</h2>
                <form id="form-transacao">
                    <!-- Formulário -->
                </form>
            </section>
            <section class="card">
                <h2>Histórico de Transações</h2>
                <table class="transaction-table">
                    <!-- Tabela -->
                </table>
            </section>
        `;
    }
    // ... (funções getOrcamentosHTML e getCategoriasHTML)

    // --- PAGE-SPECIFIC RENDER LOGIC ---
    function renderDashboardContent() {
        // Lógica para preencher o dashboard, criar gráficos e adicionar eventos
    }
    function renderOrcamentosContent() {
        // Lógica para preencher a página de orçamentos e adicionar eventos
    }
    function renderCategoriasContent() {
        const form = document.getElementById('form-categoria');
        const nomeInput = document.getElementById('categoria-nome');
        // ... (resto da lógica)
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica para adicionar categoria)
            await saveData();
            render(); // Re-renderiza a página
        });
    }

    // --- INITIALIZATION ---
    async function init() {
        await fetchData();
        render();
    }

    init();
});