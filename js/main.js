document.addEventListener('DOMContentLoaded', () => {
    // --- Estado Global da Aplicação ---
    let appData = { transacoes: [], comprasParceladas: [], categorias: [], orcamentos: [] };
    let charts = { monthly: null, pie: null, projection: null };

    // --- Seletores do DOM ---
    const mainElement = document.querySelector('main');

    // --- Funções de API ---
    async function carregarDados() {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha na resposta do servidor.');
            const data = await response.json();
            
            let dadosIniciaisForamCriados = false;
            
            appData.transacoes = data.transacoes || [];
            appData.comprasParceladas = data.comprasParceladas || [];
            appData.orcamentos = data.orcamentos || [];

            if (!data.categorias || data.categorias.length === 0) {
                appData.categorias = [{ id: Date.now() + 1, nome: 'Salário', tipo: 'receita' }, { id: Date.now() + 2, nome: 'Moradia', tipo: 'despesa' }];
                dadosIniciaisForamCriados = true;
            } else {
                appData.categorias = data.categorias;
            }
            
            if (dadosIniciaisForamCriados) await salvarDados();
            return true;
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            mainElement.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
            return false;
        }
    }

    async function salvarDados() {
        try {
            await fetch('/.netlify/functions/transacoes', { method: 'POST', body: JSON.stringify(appData) });
        } catch (error) { console.error("Erro ao salvar:", error); }
    }

    // --- Funções de Renderização e Lógica ---
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function gerarTransacoesCompletas() {
        const transacoesFixas = appData.transacoes.filter(t => t.isFixo);
        const transacoesNormais = appData.transacoes.filter(t => !t.isFixo);
        let transacoesProjetadas = [];

        transacoesFixas.forEach(t => {
            for (let i = 0; i < 12; i++) {
                const dataProjetada = new Date(t.data + 'T00:00:00');
                dataProjetada.setMonth(dataProjetada.getMonth() + i);
                transacoesProjetadas.push({ ...t, data: dataProjetada.toISOString().split('T')[0], id: `${t.id}-${i}`, isProjecao: true });
            }
        });
        
        let parcelasGeradas = [];
        appData.comprasParceladas.forEach(compra => {
            for (let i = 0; i < compra.numParcelas; i++) {
                const dataParcela = new Date(compra.dataInicio + 'T00:00:00');
                dataParcela.setMonth(dataParcela.getMonth() + i);
                parcelasGeradas.push({ id: `${compra.id}-${i}`, descricao: `${compra.descricao} (${i + 1}/${compra.numParcelas})`, valor: -(compra.valorTotal / compra.numParcelas), data: dataParcela.toISOString().split('T')[0], tipo: 'despesa', categoriaId: compra.categoriaId, isParcela: true, compraPaiId: compra.id });
            }
        });

        const transacoesUnicas = [...transacoesNormais, ...transacoesProjetadas.filter(p => !transacoesNormais.some(n => n.descricao === p.descricao && new Date(n.data).getMonth() === new Date(p.data).getMonth()))];
        return [...transacoesUnicas, ...parcelasGeradas];
    }
    
    function renderizarPaginaCompleta() {
        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });

        // Selecionar elementos do DOM AQUI, depois que o HTML foi renderizado
        const mesReceitasEl = document.getElementById('mes-receitas'), mesDespesasEl = document.getElementById('mes-despesas'), mesInvestimentosEl = document.getElementById('mes-investimentos'), mesSaldoEl = document.getElementById('mes-saldo');
        const saldoDevedorEl = document.getElementById('saldo-devedor'), proximaFaturaEl = document.getElementById('proxima-fatura');
        const budgetSummaryContainer = document.getElementById('budget-summary-container');
        const listaTransacoesEl = document.getElementById('lista-transacoes');
        
        // Atualizar Visão do Mês
        const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        const investimentos = transacoesMes.filter(t => t.tipo === 'investimento').reduce((a, t) => a + Math.abs(t.valor), 0);
        mesReceitasEl.textContent = formatarMoeda(receitas);
        mesDespesasEl.textContent = formatarMoeda(despesas);
        mesInvestimentosEl.textContent = formatarMoeda(investimentos);
        mesSaldoEl.textContent = formatarMoeda(receitas - despesas - investimentos);

        // Atualizar KPIs Futuros e Orçamentos (implementar lógica completa)
        saldoDevedorEl.textContent = formatarMoeda(0);
        proximaFaturaEl.textContent = formatarMoeda(0);
        budgetSummaryContainer.innerHTML = appData.orcamentos.length > 0 ? '' : '<p class="placeholder-text">Nenhum orçamento definido.</p>';
        
        // Atualizar Tabela
        listaTransacoesEl.innerHTML = '';
        transacoesMes.filter(t => !t.isProjecao || new Date(t.data).getMonth() === hoje.getMonth()).sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(t => {
            const categoria = appData.categorias.find(c => c.id === t.categoriaId)?.nome || 'Sem Categoria';
            const item = document.createElement('tr');
            item.innerHTML = `<td>${t.descricao} ${t.isFixo ? '📌' : ''}</td><td class="valor ${t.tipo}">${formatarMoeda(t.valor)}</td><td>${categoria}</td><td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td><button class="delete-btn" data-id="${t.id}" data-is-parcela="${t.isParcela || false}">✖</button></td>`;
            listaTransacoesEl.appendChild(item);
        });

        // Atualizar Gráficos
        atualizarGraficos(todasTransacoes, transacoesMes);
        
        // Configurar Formulário
        configurarFormulario();
    }
    
    function configurarFormulario() {
        const form = document.getElementById('form-transacao'), dataInput = document.getElementById('data'), categoriaSelect = document.getElementById('categoria-select'), tipoRadios = document.querySelectorAll('input[name="tipo"]'), isFixoInput = document.getElementById('is-fixo'), isParceladaInput = document.getElementById('is-parcelada'), parceladoOptionContainer = document.getElementById('parcelado-option-container'), parcelasInputContainer = document.getElementById('parcelas-input-container');
        
        dataInput.valueAsDate = new Date();
        
        function carregarCategorias() {
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            appData.categorias.filter(c => c.tipo === tipo).forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.nome; categoriaSelect.appendChild(option); });
        }
        
        function atualizarVisibilidade() {
            carregarCategorias();
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            parceladoOptionContainer.style.display = tipo === 'despesa' ? 'flex' : 'none';
            if (tipo !== 'despesa') isParceladaInput.checked = false;
            parcelasInputContainer.style.display = isParceladaInput.checked ? 'block' : 'none';
        }
        
        tipoRadios.forEach(radio => radio.addEventListener('change', atualizarVisibilidade));
        isParceladaInput.addEventListener('change', atualizarVisibilidade);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novaTransacao = {
                id: Date.now(),
                descricao: document.getElementById('descricao').value.trim(),
                valor: parseFloat(document.getElementById('valor').value),
                data: dataInput.value,
                tipo: document.querySelector('input[name="tipo"]:checked').value,
                categoriaId: parseInt(categoriaSelect.value),
                isFixo: isFixoInput.checked
            };
            if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.data || !novaTransacao.categoriaId) { alert('Preencha todos os campos!'); return; }
            if (isParceladaInput.checked) { appData.comprasParceladas.push({ ...novaTransacao, valorTotal: novaTransacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) }); }
            else { appData.transacoes.push({ ...novaTransacao, valor: novaTransacao.tipo === 'receita' ? novaTransacao.valor : -novaTransacao.valor }); }
            await salvarDados();
            form.reset();
            renderizarPaginaCompleta();
        });

        atualizarVisibilidade();
    }
    
    function atualizarGraficos(todasTransacoes, transacoesMes) {
        // ... (colar aqui sua lógica completa de renderização de gráficos)
    }

    // --- Ponto de Entrada ---
    (async () => {
        if (await carregarDados()) {
            renderizarPaginaCompleta();
        }
    })();
});