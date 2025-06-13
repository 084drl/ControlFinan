document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL DA APLICAÇÃO ---
    let appData = {
        transacoes: [],
        comprasParceladas: [],
        categorias: [],
        orcamentos: [],
    };
    let charts = {};

    // --- SELETORES DO DOM ---
    const mainElement = document.querySelector('main');

    // --- FUNÇÕES DE API ---
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
                appData.categorias = [ { id: Date.now(), nome: 'Salário', tipo: 'receita' } ];
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

    // --- FUNÇÕES AUXILIARES ---
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function gerarTransacoesCompletas() {
        // Esta função deve ser implementada com a sua lógica de projeção
        return [...appData.transacoes, ...appData.comprasParceladas.flatMap(compra => {
            const parcelas = [];
            for (let i = 0; i < compra.numParcelas; i++) {
                const dataParcela = new Date(compra.dataInicio + 'T00:00:00');
                dataParcela.setMonth(dataParcela.getMonth() + i);
                parcelas.push({
                    // ... propriedades da parcela ...
                });
            }
            return parcelas;
        })];
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarTudo() {
        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => new Date(t.data + 'T00:00:00').getMonth() === hoje.getMonth() && new Date(t.data + 'T00:00:00').getFullYear() === hoje.getFullYear());
        
        renderizarDashboard(transacoesMes, todasTransacoes);
        renderizarTabela(transacoesMes);
        renderizarGraficos(todasTransacoes, transacoesMes);
    }
    
    function renderizarDashboard(transacoesMes) {
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
            tr.innerHTML = `<td>${t.descricao}</td><td class="valor ${t.tipo}">${formatarMoeda(t.valor)}</td><td>${categoria}</td><td>${new Date(t.data+'T00:00:00').toLocaleDateString('pt-BR')}</td><td>...</td>`;
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
            charts.pie = new Chart(pieChartCtx, { type: 'doughnut', data: { labels: Object.keys(gastos), datasets: [{ data: Object.values(gastos), backgroundColor: ['#e35050', '#4a90e2', '#f5a623', '#9013fe'] }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
    }

    function configurarFormulario() {
        const form = document.getElementById('form-transacao');
        const dataInput = document.getElementById('data');
        const categoriaSelect = document.getElementById('categoria-select');
        const tipoRadios = document.querySelectorAll('input[name="tipo"]');
        const isParceladaInput = document.getElementById('is-parcelada');
        const parceladoOptionContainer = document.getElementById('parcelado-option-container');
        const parcelasInputContainer = document.getElementById('parcelas-input-container');
        
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
                isFixo: document.getElementById('is-fixo').checked
            };
            if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.data || !novaTransacao.categoriaId) { alert('Preencha todos os campos!'); return; }
            if (isParceladaInput.checked) {
                appData.comprasParceladas.push({ ...novaTransacao, valorTotal: novaTransacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) });
            } else {
                appData.transacoes.push({ ...novaTransacao, valor: novaTransacao.tipo === 'receita' ? novaTransacao.valor : -novaTransacao.valor });
            }
            await salvarDados();
            form.reset();
            dataInput.valueAsDate = new Date();
            renderizarTudo();
        });
        
        atualizarVisibilidade();
    }
    
    // --- PONTO DE ENTRADA DA APLICAÇÃO ---
    async function iniciarAplicacao() {
        if (await carregarDados()) {
            renderizarTudo();
            configurarFormulario();
        }
    }
    
    iniciarAplicacao();
});