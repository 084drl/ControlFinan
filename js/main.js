document.addEventListener('DOMContentLoaded', () => {
    // --- Estado Global ---
    let appData = {};
    let charts = {};

    // --- Seletores Globais ---
    const mainElement = document.querySelector('main');
    const loadingIndicator = document.getElementById('loading-indicator');
    const dashboardContent = document.getElementById('dashboard-content');

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
                appData.categorias = [{ id: Date.now(), nome: 'Salário', tipo: 'receita' }];
                dadosIniciaisForamCriados = true;
            } else {
                appData.categorias = data.categorias;
            }
            
            if (dadosIniciaisForamCriados) await salvarDados();
            return true;
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            loadingIndicator.innerHTML = `<p class="error-text" style="display:block;">Erro ao carregar dados.</p>`;
            return false;
        }
    }

    async function salvarDados() {
        try {
            await fetch('/.netlify/functions/transacoes', { method: 'POST', body: JSON.stringify(appData) });
        } catch (error) { console.error("Erro ao salvar:", error); }
    }

    // --- Funções Auxiliares ---
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function gerarTransacoesCompletas() {
        const transacoesFixas = appData.transacoes.filter(t => t.isFixo);
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
        return [...appData.transacoes, ...transacoesProjetadas, ...parcelasGeradas];
    }
    
    // --- Funções de Renderização ---
    function renderizarTudo() {
        loadingIndicator.style.display = 'none';
        dashboardContent.style.display = 'block';

        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });

        renderizarDashboard(transacoesMes, todasTransacoes);
        renderizarTabela(transacoesMes);
        renderizarGraficos(todasTransacoes, transacoesMes);
        configurarFormulario();
    }
    
    function renderizarDashboard(transacoesMes, todasTransacoes) {
        const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
        const investimentos = transacoesMes.filter(t => t.tipo === 'investimento').reduce((a, t) => a + Math.abs(t.valor), 0);
        document.getElementById('mes-receitas').textContent = formatarMoeda(receitas);
        document.getElementById('mes-despesas').textContent = formatarMoeda(despesas);
        document.getElementById('mes-investimentos').textContent = formatarMoeda(investimentos);
        document.getElementById('mes-saldo').textContent = formatarMoeda(receitas - despesas - investimentos);
    }

    function renderizarTabela(transacoesParaExibir) {
        const listaTransacoesEl = document.getElementById('lista-transacoes');
        listaTransacoesEl.innerHTML = '';
        transacoesParaExibir.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(t => {
            const categoria = appData.categorias.find(c => c.id === t.categoriaId)?.nome || '';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${t.descricao} ${t.isFixo ? '📌' : ''}</td><td class="valor ${t.tipo}">${formatarMoeda(t.valor)}</td><td>${categoria}</td><td>${new Date(t.data+'T00:00:00').toLocaleDateString('pt-BR')}</td><td>...</td>`;
            listaTransacoesEl.appendChild(tr);
        });
    }

    function renderizarGraficos(todasTransacoes, transacoesMes) {
        const pieChartCtx = document.getElementById('category-pie-chart')?.getContext('2d');
        if (charts.pie) charts.pie.destroy();
        if (pieChartCtx) {
            const gastos = transacoesMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => {
                const nome = appData.categorias.find(c => c.id === t.categoriaId)?.nome || 'Outros';
                acc[nome] = (acc[nome] || 0) + Math.abs(t.valor); return acc;
            }, {});
            charts.pie = new Chart(pieChartCtx, { type: 'doughnut', data: { labels: Object.keys(gastos), datasets: [{ data: Object.values(gastos), backgroundColor: ['#e35050', '#4a90e2', '#f5a623'] }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
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
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const novaTransacao = { id: Date.now(), descricao: document.getElementById('descricao').value.trim(), valor: parseFloat(document.getElementById('valor').value), data: dataInput.value, tipo: document.querySelector('input[name="tipo"]:checked').value, categoriaId: parseInt(categoriaSelect.value), isFixo: isFixoInput.checked };
            if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.data || !novaTransacao.categoriaId) { alert('Preencha todos os campos!'); return; }
            if (isParceladaInput.checked) { appData.comprasParceladas.push({ ...novaTransacao, valorTotal: novaTransacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) }); }
            else { appData.transacoes.push({ ...novaTransacao, valor: novaTransacao.tipo === 'receita' ? novaTransacao.valor : -novaTransacao.valor }); }
            await salvarDados();
            form.reset();
            renderizarTudo();
        };
        atualizarVisibilidade();
    }
    
    // --- Ponto de Entrada da Aplicação ---
    (async () => {
        if (await carregarDados()) {
            renderizarTudo();
        }
    })();
});