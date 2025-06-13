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
    const listaTransacoesEl = document.getElementById('lista-transacoes');
    const monthlyChartCtx = document.getElementById('monthly-chart')?.getContext('2d');
    const pieChartCtx = document.getElementById('category-pie-chart')?.getContext('2d');
    const projectionChartCtx = document.getElementById('projection-chart')?.getContext('2d');

    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
            if (!response.ok) {
                // Se a resposta não for OK, lança um erro para ser pego pelo catch
                throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            // Atualiza as variáveis globais
            transacoes = data.transacoes || [];
            comprasParceladas = data.comprasParceladas || [];
            categorias = data.categorias || [];
            orcamentos = data.orcamentos || [];
            
            // Se tudo deu certo, inicia a renderização da página
            renderizarPaginaCompleta();

        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error);
            mainElement.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
        }
    };

    // --- RENDERIZAÇÃO E LÓGICA ---
    const renderizarPaginaCompleta = () => {
        // Esta função agora é o nosso 'init', que roda APÓS os dados serem carregados com sucesso
        const todasTransacoes = gerarTransacoesCompletas();
        const hoje = new Date();
        const transacoesMes = todasTransacoes.filter(t => {
            const dataT = new Date(t.data + 'T00:00:00');
            return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear();
        });
        
        atualizarDashboard(transacoesMes, todasTransacoes);
        renderizarTabela(transacoesMes.filter(t => !t.isProjecao || new Date(t.data).getMonth() === hoje.getMonth()));
        atualizarGraficos(todasTransacoes, transacoesMes);
        atualizarVisibilidadeFormulario();
        dataInput.valueAsDate = new Date();
    };
    
    // (Cole aqui todas as suas outras funções: atualizarDashboard, renderizarTabela, gerarTransacoesCompletas, etc.)
    // ...
    // Exemplo de uma função que precisa ser colada aqui:
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

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Lógica para pegar os dados do formulário...
        const novaTransacao = {
            id: Date.now(),
            descricao: descricaoInput.value.trim(),
            valor: parseFloat(valorInput.value),
            data: dataInput.value,
            tipo: document.querySelector('input[name="tipo"]:checked').value,
            categoriaId: parseInt(categoriaSelect.value),
            isFixo: isFixoInput.checked
        };
        // Validar dados...
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
        renderizarPaginaCompleta();
    });
    
    // Inicia a aplicação
    carregarDadosEIniciar();
});