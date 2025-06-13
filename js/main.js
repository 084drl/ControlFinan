document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_VERSION = '_v7';
    // === CARREGAR DADOS ===
    let transacoes = JSON.parse(localStorage.getItem('transacoes' + STORAGE_VERSION)) || [];
    let comprasParceladas = JSON.parse(localStorage.getItem('comprasParceladas' + STORAGE_VERSION)) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias_v6')) || [];
    let orcamentos = JSON.parse(localStorage.getItem('orcamentos_v6')) || [];
    let monthlyChart, pieChart, projectionChart;

    // === SELETORES DO DOM ===
    const form = document.getElementById('form-transacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const dataInput = document.getElementById('data');
    const categoriaSelect = document.getElementById('categoria-select');
    const fixoOptionContainer = document.getElementById('fixo-option-container');
    const parceladoOptionContainer = document.getElementById('parcelado-option-container');
    const isFixoInput = document.getElementById('is-fixo');
    const isParceladaInput = document.getElementById('is-parcelada');
    const parcelasInputContainer = document.getElementById('parcelas-input-container');

    const mesReceitasEl = document.getElementById('mes-receitas'), mesDespesasEl = document.getElementById('mes-despesas'), mesInvestimentosEl = document.getElementById('mes-investimentos'), mesSaldoEl = document.getElementById('mes-saldo');
    const saldoDevedorEl = document.getElementById('saldo-devedor'), proximaFaturaEl = document.getElementById('proxima-fatura');
    const budgetSummaryContainer = document.getElementById('budget-summary-container');
    const listaTransacoesEl = document.getElementById('lista-transacoes');
    const monthlyChartCtx = document.getElementById('monthly-chart')?.getContext('2d');
    const pieChartCtx = document.getElementById('category-pie-chart')?.getContext('2d');
    const projectionChartCtx = document.getElementById('projection-chart')?.getContext('2d');

    // === FUNÇÕES AUXILIARES ===
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const salvarDados = () => {
        localStorage.setItem('transacoes' + STORAGE_VERSION, JSON.stringify(transacoes));
        localStorage.setItem('comprasParceladas' + STORAGE_VERSION, JSON.stringify(comprasParceladas));
    };

    // === LÓGICA DE INTERFACE ===
    const atualizarVisibilidadeFormulario = () => {
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        carregarCategorias(tipo);
        fixoOptionContainer.style.display = 'block';
        parceladoOptionContainer.style.display = tipo === 'despesa' ? 'block' : 'none';
        if (tipo !== 'despesa') isParceladaInput.checked = false;
        isFixoInput.disabled = isParceladaInput.checked;
        isParceladaInput.disabled = isFixoInput.checked;
        parcelasInputContainer.style.display = isParceladaInput.checked ? 'block' : 'none';
    };
    
    const carregarCategorias = (tipo) => {
        categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        categorias.filter(c => c.tipo === tipo).forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.nome; categoriaSelect.appendChild(option); });
    };

    // === LÓGICA DE DADOS ===
    const gerarTransacoesCompletas = () => {
        const transacoesFixas = transacoes.filter(t => t.isFixo);
        const transacoesNormais = transacoes.filter(t => !t.isFixo);
        let transacoesProjetadas = [];

        // Projetar transações fixas para os próximos 12 meses
        transacoesFixas.forEach(t => {
            for (let i = 0; i < 12; i++) {
                const dataProjetada = new Date(t.data + 'T00:00:00');
                dataProjetada.setMonth(dataProjetada.getMonth() + i);
                transacoesProjetadas.push({ ...t, data: dataProjetada.toISOString().split('T')[0], id: `${t.id}-${i}`, isProjecao: true });
            }
        });
        
        let parcelasGeradas = [];
        comprasParceladas.forEach(compra => {
            for (let i = 0; i < compra.numParcelas; i++) {
                const dataParcela = new Date(compra.dataInicio + 'T00:00:00');
                dataParcela.setMonth(dataParcela.getMonth() + i);
                parcelasGeradas.push({ id: `${compra.id}-${i}`, descricao: `${compra.descricao} (${i + 1}/${compra.numParcelas})`, valor: -(compra.valorTotal / compra.numParcelas), data: dataParcela.toISOString().split('T')[0], tipo: 'despesa', categoriaId: compra.categoriaId, isParcela: true, compraPaiId: compra.id });
            }
        });

        // Remove duplicatas de fixas que já foram lançadas no mês
        const transacoesUnicas = [...transacoesNormais, ...transacoesProjetadas.filter(p => !transacoesNormais.some(n => n.descricao === p.descricao && new Date(n.data).getMonth() === new Date(p.data).getMonth()))];

        return [...transacoesUnicas, ...parcelasGeradas];
    };

    const atualizarPainelPrincipal = (transacoesMes, todasTransacoes) => {
        // ... (lógica de resumo do mês e orçamentos)
    };
    
    // === ATUALIZAÇÃO DOS DASHBOARDS E GRÁFICOS ===
    const init = () => {
        const hoje = new Date();
        const todasTransacoes = gerarTransacoesCompletas();
        
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });

        // Atualizar Visão do Mês
        const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        const investimentos = transacoesMes.filter(t => t.tipo === 'investimento').reduce((a, t) => a + Math.abs(t.valor), 0);
        mesReceitasEl.textContent = formatarMoeda(receitas);
        mesDespesasEl.textContent = formatarMoeda(despesas);
        mesInvestimentosEl.textContent = formatarMoeda(investimentos);
        mesSaldoEl.textContent = formatarMoeda(receitas - despesas - investimentos);

        // Atualizar KPIs Futuros
        let saldoDevedor = 0, proximaFatura = 0;
        const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
        comprasParceladas.forEach(compra => {
            const valorParcela = compra.valorTotal / compra.numParcelas;
            for (let i = 0; i < compra.numParcelas; i++) {
                const dataParcela = new Date(compra.dataInicio + 'T00:00:00');
                dataParcela.setMonth(dataParcela.getMonth() + i);
                if (dataParcela >= hoje) saldoDevedor += valorParcela;
                if (dataParcela.getMonth() === proximoMes.getMonth() && dataParcela.getFullYear() === proximoMes.getFullYear()) proximaFatura += valorParcela;
            }
        });
        const despesasFixasProximoMes = transacoes.filter(t => t.isFixo && t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        proximaFatura += despesasFixasProximoMes;
        saldoDevedorEl.textContent = formatarMoeda(saldoDevedor);
        proximaFaturaEl.textContent = formatarMoeda(proximaFatura);

        // Atualizar Tabela
        renderizarTabela(transacoesMes.filter(t => !t.isProjecao || new Date(t.data).getMonth() === hoje.getMonth()));

        // Atualizar Gráficos
        atualizarGraficos(todasTransacoes, transacoesMes);

        // Formulário
        atualizarVisibilidadeFormulario();
        dataInput.valueAsDate = new Date();
    };

    const renderizarTabela = (transacoes) => { /* ... código mantido ... */ };
    
    const atualizarGraficos = (todasTransacoes, transacoesMes) => {
        if(pieChart) pieChart.destroy();
        const gastosPorCategoria = transacoesMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => { const catNome = categorias.find(c => c.id === t.categoriaId)?.nome || 'Outros'; acc[catNome] = (acc[catNome] || 0) + Math.abs(t.valor); return acc; }, {});
        pieChart = new Chart(pieChartCtx, { type: 'doughnut', data: { labels: Object.keys(gastosPorCategoria), datasets: [{ data: Object.values(gastosPorCategoria), backgroundColor: ['#e35050', '#4a90e2', '#f5a623', '#9013fe', '#417505', '#bd10e0'] }] }, options: { responsive: true, maintainAspectRatio: false } });

        if(monthlyChart) monthlyChart.destroy();
        // ... (lógica do gráfico de histórico)
        
        if(projectionChart) projectionChart.destroy();
        const projecaoData = { labels: [], datasets: [ { label: 'Receitas Projetadas', data: [], borderColor: 'var(--success-color)', tension: 0.1 }, { label: 'Despesas Projetadas', data: [], borderColor: 'var(--danger-color)', tension: 0.1 } ] };
        for (let i = 0; i < 12; i++) {
            const d = new Date(); d.setMonth(d.getMonth() + i);
            projecaoData.labels.push(d.toLocaleString('pt-BR', { month: 'short' }));
            const transacoesPeriodo = todasTransacoes.filter(t => new Date(t.data+'T00:00:00').getMonth() === d.getMonth() && new Date(t.data+'T00:00:00').getFullYear() === d.getFullYear());
            projecaoData.datasets[0].data.push(transacoesPeriodo.filter(t => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0));
            projecaoData.datasets[1].data.push(transacoesPeriodo.filter(t => t.tipo === 'despesa').reduce((a, b) => a + Math.abs(b.valor), 0));
        }
        projectionChart = new Chart(projectionChartCtx, { type: 'line', data: projecaoData, options: { responsive: true, maintainAspectRatio: false } });
    };

    // === EVENTOS ===
    document.querySelectorAll('input[name="tipo"]').forEach(radio => radio.addEventListener('change', atualizarVisibilidadeFormulario));
    isParceladaInput.addEventListener('change', atualizarVisibilidadeFormulario);
    isFixoInput.addEventListener('change', atualizarVisibilidadeFormulario);
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        const isFixo = isFixoInput.checked;
        const isParcelada = isParceladaInput.checked;
        const transacao = { id: Date.now(), descricao: descricaoInput.value.trim(), valor: parseFloat(valorInput.value), data: dataInput.value, tipo, categoriaId: parseInt(categoriaSelect.value), isFixo };
        if (!transacao.descricao || !transacao.valor || !transacao.data || !transacao.categoriaId) { alert('Preencha todos os campos!'); return; }
        
        if (isParcelada) {
            comprasParceladas.push({ ...transacao, valorTotal: transacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) });
        } else {
            transacoes.push({ ...transacao, valor: tipo === 'receita' ? transacao.valor : -transacao.valor });
        }
        salvarDados(); form.reset(); init();
    });

    init();
});