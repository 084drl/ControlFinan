document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação que será preenchido pela API
    let transacoes = [], comprasParceladas = [], categorias = [], orcamentos = [];
    let charts = { monthly: null, pie: null, projection: null };

    // Seletores do DOM
    const mainElement = document.querySelector('main');
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

    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- FUNÇÕES DE API (BACKEND) ---
    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            const dadosParaSalvar = { transacoes, comprasParceladas, categorias, orcamentos };
            const response = await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(dadosParaSalvar)
            });
            if (!response.ok) throw new Error('Falha ao salvar os dados no servidor.');
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Não foi possível salvar as alterações. Verifique sua conexão.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const carregarDadosEIniciar = async () => {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);
            
            const data = await response.json();
            transacoes = data.transacoes || [];
            comprasParceladas = data.comprasParceladas || [];
            categorias = data.categorias || [];
            orcamentos = data.orcamentos || [];
            
            renderizarPaginaCompleta();
        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error);
            mainElement.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados. Verifique o console (F12) para mais detalhes.</p></div>`;
        }
    };

    // --- RENDERIZAÇÃO E LÓGICA ---
    const carregarCategorias = (tipo) => {
        categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        categorias.filter(c => c.tipo === tipo).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            categoriaSelect.appendChild(option);
        });
    };

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

    const gerarTransacoesCompletas = () => {
        const transacoesFixas = transacoes.filter(t => t.isFixo);
        const transacoesNormais = transacoes.filter(t => !t.isFixo);
        let transacoesProjetadas = [];

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

        const transacoesUnicas = [...transacoesNormais, ...transacoesProjetadas.filter(p => !transacoesNormais.some(n => n.descricao === p.descricao && new Date(n.data).getMonth() === new Date(p.data).getMonth()))];

        return [...transacoesUnicas, ...parcelasGeradas];
    };

    const atualizarDashboard = (transacoesMes) => {
        const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        const investimentos = transacoesMes.filter(t => t.tipo === 'investimento').reduce((a, t) => a + Math.abs(t.valor), 0);
        
        mesReceitasEl.textContent = formatarMoeda(receitas);
        mesDespesasEl.textContent = formatarMoeda(despesas);
        mesInvestimentosEl.textContent = formatarMoeda(investimentos);
        mesSaldoEl.textContent = formatarMoeda(receitas - despesas - investimentos);

        // ... Lógica para KPIs e Orçamentos ...
    };

    const renderizarTabela = (transacoesParaExibir) => {
        listaTransacoesEl.innerHTML = '';
        transacoesParaExibir.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(t => {
            const categoria = categorias.find(c => c.id === t.categoriaId)?.nome || 'Sem Categoria';
            const item = document.createElement('tr');
            item.innerHTML = `
                <td>${t.descricao} ${t.isFixo ? '📌' : ''}</td>
                <td class="valor ${t.tipo}">${formatarMoeda(t.valor)}</td>
                <td>${categoria}</td>
                <td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td><button class="delete-btn" data-id="${t.id}" data-is-parcela="${t.isParcela || false}">✖</button></td>
            `;
            listaTransacoesEl.appendChild(item);
        });
    };
    
    const atualizarGraficos = (todasTransacoes, transacoesMes) => {
        if (charts.pie && pieChartCtx) charts.pie.destroy();
        if (pieChartCtx) {
            const gastosPorCategoria = transacoesMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => { const catNome = categorias.find(c => c.id === t.categoriaId)?.nome || 'Outros'; acc[catNome] = (acc[catNome] || 0) + Math.abs(t.valor); return acc; }, {});
            charts.pie = new Chart(pieChartCtx, { type: 'doughnut', data: { labels: Object.keys(gastosPorCategoria), datasets: [{ data: Object.values(gastosPorCategoria), backgroundColor: ['#e35050', '#4a90e2', '#f5a623', '#9013fe', '#417505', '#bd10e0'] }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
        // ... (outros gráficos)
    };
    
    const renderizarPaginaCompleta = () => {
        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });
        
        atualizarDashboard(transacoesMes);
        renderizarTabela(transacoesMes.filter(t => !t.isProjecao || new Date(t.data).getMonth() === hoje.getMonth()));
        atualizarGraficos(todasTransacoes, transacoesMes);
        atualizarVisibilidadeFormulario();
        dataInput.valueAsDate = new Date();
    };

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const novaTransacao = {
            id: Date.now(),
            descricao: descricaoInput.value.trim(),
            valor: parseFloat(valorInput.value),
            data: dataInput.value,
            tipo: document.querySelector('input[name="tipo"]:checked').value,
            categoriaId: parseInt(categoriaSelect.value),
            isFixo: isFixoInput.checked
        };
        if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.data || !novaTransacao.categoriaId) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        if (isParceladaInput.checked) {
            comprasParceladas.push({ ...novaTransacao, valorTotal: novaTransacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) });
        } else {
            transacoes.push({ ...novaTransacao, valor: novaTransacao.tipo === 'receita' ? novaTransacao.valor : -novaTransacao.valor });
        }
        
        await salvarDados();
        form.reset();
        dataInput.valueAsDate = new Date();
        renderizarPaginaCompleta();
    });
    
    // Ponto de entrada da aplicação
    carregarDadosEIniciar();
});