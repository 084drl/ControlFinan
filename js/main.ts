document.addEventListener('DOMContentLoaded', () => {
    // === ESTADO DA APLICAÇÃO ===
    // Usando uma nova versão para garantir que não haja conflito com dados antigos
    let transacoes = JSON.parse(localStorage.getItem('transacoes_v5')) || [];
    let comprasParceladas = JSON.parse(localStorage.getItem('comprasParceladas_v5')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias_v5')) || [];
    let orcamentos = JSON.parse(localStorage.getItem('orcamentos_v5')) || [];
    let monthlyChart, pieChart;

    // === SELETORES DO DOM ===
    const form = document.getElementById('form-transacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const dataInput = document.getElementById('data');
    const categoriaSelect = document.getElementById('categoria-select');
    const extraOptionsContainer = document.getElementById('extra-options-container');
    const isFixoInput = document.getElementById('is-fixo');
    const isParceladaInput = document.getElementById('is-parcelada');
    const parcelasInputContainer = document.getElementById('parcelas-input-container');

    const mesReceitasEl = document.getElementById('mes-receitas'), mesDespesasEl = document.getElementById('mes-despesas'), mesInvestimentosEl = document.getElementById('mes-investimentos'), mesSaldoEl = document.getElementById('mes-saldo');
    const budgetSummaryContainer = document.getElementById('budget-summary-container');
    const listaTransacoesEl = document.getElementById('lista-transacoes');
    const monthlyChartCtx = document.getElementById('monthly-chart').getContext('2d');
    const pieChartCtx = document.getElementById('category-pie-chart').getContext('2d');

    // === FUNÇÕES AUXILIARES ===
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const salvarDados = () => {
        localStorage.setItem('transacoes_v5', JSON.stringify(transacoes));
        localStorage.setItem('comprasParceladas_v5', JSON.stringify(comprasParceladas));
    };

    // === LÓGICA DE INTERFACE E FORMULÁRIO ===
    const carregarCategorias = (tipo) => {
        categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria...</option>';
        const categoriasFiltradas = categorias.filter(c => c.tipo === tipo);
        categoriasFiltradas.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            categoriaSelect.appendChild(option);
        });
    };

    const atualizarVisibilidadeFormulario = () => {
        const tipoSelecionado = document.querySelector('input[name="tipo"]:checked').value;
        carregarCategorias(tipoSelecionado);
        
        if (tipoSelecionado === 'despesa') {
            extraOptionsContainer.style.display = 'block';
        } else {
            extraOptionsContainer.style.display = 'none';
            isFixoInput.checked = false;
            isParceladaInput.checked = false;
        }
        
        isFixoInput.disabled = isParceladaInput.checked;
        isParceladaInput.disabled = isFixoInput.checked;
        parcelasInputContainer.style.display = isParceladaInput.checked ? 'block' : 'none';
    };
    
    document.querySelectorAll('input[name="tipo"]').forEach(radio => radio.addEventListener('change', atualizarVisibilidadeFormulario));
    isParceladaInput.addEventListener('change', atualizarVisibilidadeFormulario);
    isFixoInput.addEventListener('change', atualizarVisibilidadeFormulario);

    // === LÓGICA DE DADOS E RENDERIZAÇÃO ===
    const gerarTransacoesCompletas = () => {
        let transacoesGeradas = [];
        comprasParceladas.forEach(compra => {
            const valorParcela = compra.valorTotal / compra.numParcelas;
            for (let i = 0; i < compra.numParcelas; i++) {
                const dataParcela = new Date(compra.dataInicio + 'T00:00:00');
                dataParcela.setMonth(dataParcela.getMonth() + i);
                transacoesGeradas.push({
                    id: `${compra.id}-${i}`, descricao: `${compra.descricao} (${i + 1}/${compra.numParcelas})`,
                    valor: -valorParcela, data: dataParcela.toISOString().split('T')[0],
                    tipo: 'despesa', categoriaId: compra.categoriaId, isParcela: true, compraPaiId: compra.id
                });
            }
        });
        return [...transacoes, ...transacoesGeradas];
    };
    
    const atualizarDashboard = (transacoesMes) => {
        const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        const investimentos = transacoesMes.filter(t => t.tipo === 'investimento').reduce((a, t) => a + Math.abs(t.valor), 0);
        
        mesReceitasEl.textContent = formatarMoeda(receitas);
        mesDespesasEl.textContent = formatarMoeda(despesas);
        mesInvestimentosEl.textContent = formatarMoeda(investimentos);
        mesSaldoEl.textContent = formatarMoeda(receitas - despesas - investimentos);

        budgetSummaryContainer.innerHTML = '';
        const orcamentosDoMes = orcamentos.filter(orc => categorias.find(c => c.id === orc.categoriaId));
        if (orcamentosDoMes.length === 0) {
            budgetSummaryContainer.innerHTML = '<p class="placeholder-text">Nenhum orçamento definido.</p>';
            return;
        }

        orcamentosDoMes.forEach(orc => {
            const gasto = transacoesMes.filter(t => t.categoriaId === orc.categoriaId).reduce((a, t) => a + Math.abs(t.valor), 0);
            const percentual = (gasto / orc.limite) * 100;
            const categoria = categorias.find(c => c.id === orc.categoriaId);

            if(categoria){
                const item = document.createElement('div');
                item.className = 'budget-item';
                item.innerHTML = `
                    <div class="info">
                        <span>${categoria.nome}</span>
                        <span>${formatarMoeda(gasto)} / ${formatarMoeda(orc.limite)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-inner ${percentual > 100 ? 'over-budget' : ''}" style="width: ${Math.min(percentual, 100)}%;"></div>
                    </div>
                `;
                budgetSummaryContainer.appendChild(item);
            }
        });
    };

    const renderizarTabela = (transacoesMes) => {
        listaTransacoesEl.innerHTML = '';
        transacoesMes.sort((a,b) => new Date(b.data) - new Date(a.data));
        transacoesMes.forEach(t => {
            const categoria = categorias.find(c => c.id === t.categoriaId)?.nome || 'Sem Categoria';
            const valorClasse = t.tipo;
            const item = document.createElement('tr');
            item.innerHTML = `
                <td>${t.descricao} ${t.isFixo ? '📌' : ''}</td>
                <td class="valor ${valorClasse}">${formatarMoeda(t.valor)}</td>
                <td>${categoria}</td>
                <td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td><button class="delete-btn" data-id="${t.id}" data-is-parcela="${t.isParcela || false}" data-is-fixo="${t.isFixo || false}">✖</button></td>
            `;
            listaTransacoesEl.appendChild(item);
        });
    };

    const atualizarGraficos = (todasTransacoes, transacoesMes) => {
        if(pieChart) pieChart.destroy();
        const gastosPorCategoria = transacoesMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => {
            const categoriaNome = categorias.find(c => c.id === t.categoriaId)?.nome || 'Outros';
            acc[categoriaNome] = (acc[categoriaNome] || 0) + Math.abs(t.valor);
            return acc;
        }, {});
        
        pieChart = new Chart(pieChartCtx, {
            type: 'doughnut',
            data: { labels: Object.keys(gastosPorCategoria), datasets: [{ data: Object.values(gastosPorCategoria), backgroundColor: ['#e35050', '#4a90e2', '#f5a623', '#9013fe', '#417505', '#bd10e0', '#f8e71c', '#7ed321'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });

        if(monthlyChart) monthlyChart.destroy();
        const historicoData = { labels: [], datasets: [{ label: 'Receitas', data: [], backgroundColor: 'var(--success-color)' }, { label: 'Despesas', data: [], backgroundColor: 'var(--danger-color)' }] };
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            historicoData.labels.push(d.toLocaleString('pt-BR', { month: 'short' }));
            const transacoesPeriodo = todasTransacoes.filter(t => new Date(t.data+'T00:00:00').getMonth() === d.getMonth() && new Date(t.data+'T00:00:00').getFullYear() === d.getFullYear());
            historicoData.datasets[0].data.push(transacoesPeriodo.filter(t => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0));
            historicoData.datasets[1].data.push(transacoesPeriodo.filter(t => t.tipo === 'despesa' || t.tipo === 'investimento').reduce((a, b) => a + Math.abs(b.valor), 0));
        }
        monthlyChart = new Chart(monthlyChartCtx, { type: 'bar', data: historicoData, options: { responsive: true, maintainAspectRatio: false } });
    };

    const init = () => {
        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });
        
        atualizarDashboard(transacoesMes);
        renderizarTabela(transacoesMes);
        atualizarGraficos(todasTransacoes, transacoesMes);
        atualizarVisibilidadeFormulario();
        dataInput.valueAsDate = new Date();
    };

    // === EVENTOS ===
    form.addEventListener('submit', e => {
        e.preventDefault();
        const descricao = descricaoInput.value.trim();
        const valor = parseFloat(valorInput.value);
        const data = dataInput.value;
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        const categoriaId = parseInt(categoriaSelect.value);
        const isFixo = isFixoInput.checked;
        const isParcelada = isParceladaInput.checked;

        if (!descricao || !valor || !data || !categoriaId) { alert('Preencha todos os campos obrigatórios!'); return; }
        
        if (isParcelada && tipo === 'despesa') {
            const numParcelas = parseInt(document.getElementById('parcelas').value);
            comprasParceladas.push({ id: Date.now(), descricao, valorTotal: valor, dataInicio: data, numParcelas, categoriaId });
        } else {
            transacoes.push({ id: Date.now(), descricao, valor: tipo === 'receita' ? valor : -valor, data, tipo, categoriaId, isFixo });
        }
        
        salvarDados();
        form.reset();
        dataInput.valueAsDate = new Date(); // Resetar a data para hoje
        atualizarVisibilidadeFormulario();
        init();
    });

    listaTransacoesEl.addEventListener('click', e => {
        if(e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const isParcela = e.target.dataset.isParcela === 'true';

            if (isParcela) {
                if (confirm('Esta é uma parcela. Deseja remover TODA a compra original?')) {
                    const compraPaiId = gerarTransacoesCompletas().find(t => t.id === id)?.compraPaiId;
                    comprasParceladas = comprasParceladas.filter(c => c.id !== compraPaiId);
                }
            } else {
                transacoes = transacoes.filter(t => t.id != id);
            }
            salvarDados();
            init();
        }
    });

    init();
});