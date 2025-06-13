document.addEventListener('DOMContentLoaded', () => {
    // Estado global da aplicação
    let appData = { transacoes: [], comprasParceladas: [], categorias: [], orcamentos: [] };
    let charts = { monthly: null, pie: null, projection: null };
    const mainElement = document.querySelector('main');

    // --- FUNÇÕES DE API ---
    const salvarDados = async () => { /* ... (código mantido da resposta anterior) ... */ };
    const carregarDados = async () => { /* ... (código mantido da resposta anterior) ... */ };

    // --- FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function carregarCategorias(tipo, selectElement) {
        selectElement.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        appData.categorias.filter(c => c.tipo === tipo).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; option.textContent = cat.nome;
            selectElement.appendChild(option);
        });
    }

    function atualizarVisibilidadeFormulario() {
        // ... (código mantido, apenas com seletores mais seguros)
    }
    
    // ... (todas as outras funções auxiliares: gerarTransacoesCompletas, atualizarDashboard, renderizarTabela, atualizarGraficos)

    // --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
    function renderizarPaginaPrincipal() {
        mainElement.innerHTML = `
            <section class="strategic-grid">
                <!-- ... (cole aqui a estrutura HTML do seu dashboard) ... -->
            </section>
            <section class="card">
                <h2>Adicionar Nova Transação</h2>
                <form id="form-transacao">
                    <!-- ... (cole aqui a estrutura HTML do seu formulário) ... -->
                </form>
            </section>
            <section class="card">
                <h2>Histórico de Transações (Mês Atual)</h2>
                <table class="transaction-table">
                    <thead><tr><th>Descrição</th><th>Valor</th><th>Categoria</th><th>Data</th><th>Ação</th></tr></thead>
                    <tbody id="lista-transacoes"></tbody>
                </table>
            </section>
        `;

        // Agora que os elementos existem, podemos adicionar os event listeners
        adicionarEventListeners();
        
        // E renderizar os dados
        const todasTransacoes = gerarTransacoesCompletas();
        // ... (lógica para pegar transacoesMes e chamar as funções de renderização de dashboard/tabela/gráficos)
    }
    
    function adicionarEventListeners() {
        const form = document.getElementById('form-transacao');
        // ... (selecionar todos os outros elementos do formulário)

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica de submit do formulário)
            await salvarDados();
            renderizarPaginaPrincipal(); // Re-renderiza tudo para refletir as mudanças
        });
        
        // ... (adicionar outros event listeners, como para os radio buttons e checkboxes)
    }

    // --- PONTO DE ENTRADA ---
    (async () => {
        if (await carregarDados()) {
            // Se os dados carregaram, renderiza a página principal
            renderizarPaginaPrincipal();
        }
    })();
});