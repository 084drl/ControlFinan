document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação que será preenchido pela API
    let categorias = [];
    let orcamentos = [];
    
    // Seletores
    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');
    const mainContent = document.querySelector('main');

    // --- FUNÇÕES DE API (BACKEND) ---
    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            const dadosParaSalvar = { categorias, orcamentos };
            const response = await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(dadosParaSalvar)
            });
            if (!response.ok) throw new Error('Falha ao salvar os dados no servidor.');
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
            categorias = data.categorias || [];
            orcamentos = data.orcamentos || [];
            
            // Inicia a renderização da página específica
            if (formCategoria) renderizarPaginaCategorias();
            if (formOrcamento) renderizarPaginaOrcamentos();
        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error);
            mainContent.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
        }
    };

    // --- LÓGICA DA PÁGINA DE CATEGORIAS ---
    const renderizarPaginaCategorias = () => {
        // (Cole aqui a sua função renderizarPaginaCategorias completa)
        // Ela usa as variáveis globais 'categorias' e 'orcamentos'
        // ...
        formCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Lógica para adicionar categoria...
            const nome = document.getElementById('categoria-nome').value.trim();
            if (nome) {
                categorias.push({ id: Date.now(), nome, tipo: document.querySelector('input[name="categoria-tipo"]:checked').value });
                await salvarDados();
                renderizarListas(); // Função interna de renderizarPaginaCategorias
            }
        });
    };

    // --- LÓGICA DA PÁGINA DE ORÇAMENTOS ---
    const renderizarPaginaOrcamentos = () => {
        // (Cole aqui a sua função renderizarPaginaOrcamentos completa)
        // ...
    };

    // Ponto de entrada do script
    carregarDadosEIniciar();
});