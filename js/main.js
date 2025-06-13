document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação que será preenchido pela API
    let appData = { transacoes: [], comprasParceladas: [], categorias: [], orcamentos: [] };
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
    // ... outros seletores ...

    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- FUNÇÕES DE API ---
    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            await fetch('/.netlify/functions/transacoes', { method: 'POST', body: JSON.stringify(appData) });
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Não foi possível salvar as alterações.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const carregarDadosEIniciar = async () => {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);
            
            const data = await response.json();
            
            let dadosIniciaisForamCriados = false;
            
            appData.transacoes = data.transacoes || [];
            appData.comprasParceladas = data.comprasParceladas || [];
            appData.orcamentos = data.orcamentos || [];

            if (!data.categorias || data.categorias.length === 0) {
                appData.categorias = [
                    { id: 1, nome: 'Salário', tipo: 'receita' },
                    { id: 2, nome: 'Moradia', tipo: 'despesa' },
                    { id: 3, nome: 'Alimentação', tipo: 'despesa' }
                ];
                dadosIniciaisForamCriados = true;
            } else {
                appData.categorias = data.categorias;
            }
            
            if (dadosIniciaisForamCriados) await salvarDados();
            
            renderizarPaginaCompleta();
        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error);
            mainElement.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
        }
    };

    // --- RENDERIZAÇÃO E LÓGICA ---
    const renderizarPaginaCompleta = () => {
        // Função que renderiza todo o dashboard usando os dados de 'appData'
        // ... (colar aqui o conteúdo da sua função renderizarPaginaCompleta anterior)
        // ... incluindo as chamadas para atualizarDashboard, renderizarTabela, atualizarGraficos, etc.
    };

    // (Cole aqui todas as suas outras funções auxiliares: atualizarDashboard, renderizarTabela, etc.)
    // Elas devem usar 'appData' (ex: appData.transacoes)

    // --- EVENT LISTENERS ---
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica para criar nova transação) ...
            // Adicionar em appData.transacoes ou appData.comprasParceladas
            await salvarDados();
            renderizarPaginaCompleta();
        });
    }

    // Ponto de entrada da aplicação
    carregarDadosEIniciar();
});