document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação que será preenchido pela API
    let transacoes = [];
    let comprasParceladas = [];
    let categorias = [];
    let orcamentos = [];
    let monthlyChart, pieChart, projectionChart;

    // Seletores do DOM (versão resumida para clareza)
    const form = document.getElementById('form-transacao'),
        descricaoInput = document.getElementById('descricao'),
        valorInput = document.getElementById('valor'),
        dataInput = document.getElementById('data'),
        categoriaSelect = document.getElementById('categoria-select'),
        fixoOptionContainer = document.getElementById('fixo-option-container'),
        parceladoOptionContainer = document.getElementById('parcelado-option-container'),
        isFixoInput = document.getElementById('is-fixo'),
        isParceladaInput = document.getElementById('is-parcelada'),
        parcelasInputContainer = document.getElementById('parcelas-input-container'),
        mesReceitasEl = document.getElementById('mes-receitas'),
        mesDespesasEl = document.getElementById('mes-despesas'),
        mesInvestimentosEl = document.getElementById('mes-investimentos'),
        mesSaldoEl = document.getElementById('mes-saldo'),
        saldoDevedorEl = document.getElementById('saldo-devedor'),
        proximaFaturaEl = document.getElementById('proxima-fatura'),
        budgetSummaryContainer = document.getElementById('budget-summary-container'),
        listaTransacoesEl = document.getElementById('lista-transacoes'),
        monthlyChartCtx = document.getElementById('monthly-chart')?.getContext('2d'),
        pieChartCtx = document.getElementById('category-pie-chart')?.getContext('2d'),
        projectionChartCtx = document.getElementById('projection-chart')?.getContext('2d');

    // --- FUNÇÕES DE API (BACKEND) ---
    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            const dadosCompletos = { transacoes, comprasParceladas, categorias, orcamentos };
            await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(dadosCompletos),
            });
        } catch (error) {
            console.error('Erro ao salvar os dados:', error);
            alert('Falha ao salvar as alterações.');
        } finally {
            document.body.style.cursor = 'default';
        }
    };
    
    const carregarDadosEIniciar = async () => {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Não foi possível carregar os dados do servidor.');
            const dados = await response.json();
            transacoes = dados.transacoes || [];
            comprasParceladas = dados.comprasParceladas || [];
            categorias = dados.categorias || [{ id: 1, nome: 'Salário', tipo: 'receita' }, { id: 2, nome: 'Moradia', tipo: 'despesa' }];
            orcamentos = dados.orcamentos || [];
            init(); // Renderiza a página com os dados carregados
        } catch (error) {
            console.error('Erro crítico ao carregar dados:', error);
            document.querySelector('main').innerHTML = `<div class="card"><p class="placeholder-text" style="color:var(--danger-color);">Erro ao carregar dados. Tente recarregar a página.</p></div>`;
        }
    };
    
    // --- LÓGICA DE INTERFACE E RENDERIZAÇÃO ---
    // (As funções internas não mudam, apenas quem as chama)
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const init = () => { /* ... lógica de init mantida, apenas chamada pelo carregarDadosEIniciar ... */ };
    const atualizarVisibilidadeFormulario = () => { /* ... código mantido ... */ };
    const carregarCategorias = () => { /* ... código mantido ... */ };
    const gerarTransacoesCompletas = () => { /* ... código mantido ... */ };
    const renderizarTabela = () => { /* ... código mantido ... */ };
    const atualizarGraficos = () => { /* ... código mantido ... */ };
    
    // --- EVENTOS ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... (lógica para pegar os dados do formulário)
        const isParcelada = isParceladaInput.checked;
        const transacaoBase = { id: Date.now(), /*...*/ };
        if (isParcelada) { comprasParceladas.push({ ...transacaoBase, /*...*/ }); } 
        else { transacoes.push({ ...transacaoBase, /*...*/ }); }
        await salvarDados();
        form.reset();
        init();
    });

    listaTransacoesEl.addEventListener('click', async (e) => {
        if(e.target.classList.contains('delete-btn')) {
            // ... (lógica para encontrar o ID e se é parcela)
            if (isParcelada) { /*...*/ } 
            else { transacoes = transacoes.filter(t => t.id != id); }
            await salvarDados();
            init();
        }
    });

    // Ponto de entrada da aplicação
    carregarDadosEIniciar();
});