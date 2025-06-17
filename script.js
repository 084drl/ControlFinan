document.addEventListener('DOMContentLoaded', () => {
    
    // --- BANCO DE DADOS LOCAL (Chaves Estáveis) ---
    let transacoes = JSON.parse(localStorage.getItem('financeApp_transacoes')) || [];
    let categorias = JSON.parse(localStorage.getItem('financeApp_categorias')) || ['Geral'];
    let orcamentos = JSON.parse(localStorage.getItem('financeApp_orcamentos')) || [];
    let recorrencias = JSON.parse(localStorage.getItem('financeApp_recorrencias')) || [];
    const saveData = () => { /* ... (código de salvar mantido) ... */ };

    // --- VARIÁVEIS DE ESTADO ---
    let fluxoCaixaChartInstance, gastosCategoriaChartInstance;

    // --- FUNÇÕES DE INICIALIZAÇÃO ---
    function init() {
        // ... (código de inicialização de login e tema mantido) ...
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                // ...
                iniciarApp(); // A mágica acontece aqui
            });
        }
    }

    function iniciarApp() {
        configurarEventListeners();
        renderizarTudo();
    }

    // --- CONFIGURAÇÃO DE EVENT LISTENERS (Centralizado) ---
    function configurarEventListeners() {
        // ... (código de configuração de todos os botões e modais mantido) ...
    }
    
    function renderizarTudo() {
        renderizarDashboard();
        renderizarPaginasGerenciamento();
    }

    // --- O NOVO MOTOR DO DASHBOARD ---
    function renderizarDashboard() {
        const data = calcularDadosDashboard();

        // 1. Atualizar Cards de Texto
        document.getElementById('mes-receitas').textContent = formatCurrency(data.mes.receitas);
        document.getElementById('mes-despesas').textContent = formatCurrency(data.mes.despesas);
        document.getElementById('mes-investimentos').textContent = formatCurrency(data.mes.investimentos);
        document.getElementById('mes-saldo').textContent = formatCurrency(data.mes.saldo);
        document.getElementById('saldo-devedor-total').textContent = formatCurrency(data.futuro.saldoDevedorTotal);
        document.getElementById('proximo-mes-compromisso').textContent = formatCurrency(data.futuro.compromissoProximoMes);

        // 2. Renderizar Gráfico de Fluxo de Caixa
        const fluxoCtx = document.getElementById('fluxoCaixaChart').getContext('2d');
        if (fluxoCaixaChartInstance) fluxoCaixaChartInstance.destroy();
        fluxoCaixaChartInstance = new Chart(fluxoCtx, {
            type: 'line',
            data: { labels: data.fluxoCaixa.labels, datasets: [{ label: 'Saldo Projetado', data: data.fluxoCaixa.data, ... }] },
            options: { ... } // Configurações de cores, etc.
        });

        // 3. Renderizar Gráfico de Top 5 Gastos
        const gastosCtx = document.getElementById('gastosCategoriaChart').getContext('2d');
        if (gastosCategoriaChartInstance) gastosCategoriaChartInstance.destroy();
        gastosCategoriaChartInstance = new Chart(gastosCtx, {
            type: 'doughnut',
            data: { labels: data.top5Gastos.labels, datasets: [{ data: data.top5Gastos.data, ... }] },
            options: { ... } // Configurações de cores, etc.
        });
    }

    function calcularDadosDashboard() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth(), anoAtual = hoje.getFullYear();
        let saldoAtual = transacoes.filter(t => new Date(t.data) <= hoje).reduce((acc, t) => acc + (t.tipo === 'Receita' ? t.valor : -t.valor), 0);

        // Cálculos do mês...
        // Cálculos do futuro...
        // Cálculos do fluxo de caixa (loop de 12 meses)...
        // Cálculos do top 5 gastos...

        return { /* objeto com todos os dados calculados */ };
    }

    // --- Demais funções de renderização e salvamento (mantidas e aprimoradas) ---
    function renderizarPaginasGerenciamento() { /* ... */ }

    init(); // Inicia o processo
});