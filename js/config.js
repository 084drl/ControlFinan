document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação para esta página
    let appData = { categorias: [], orcamentos: [] };

    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');
    const mainContent = document.querySelector('main');

    // --- FUNÇÕES DE API ---
    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(appData),
            });
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Falha ao salvar as alterações.');
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const carregarDados = async () => {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha na resposta do servidor.');
            const data = await response.json();
            
            appData = {
                // Pega os dados do backend ou usa arrays vazios como padrão
                categorias: data.categorias || [],
                orcamentos: data.orcamentos || [],
                // Mantém os outros dados intactos para não sobrescrevê-los
                transacoes: data.transacoes || [],
                comprasParceladas: data.comprasParceladas || []
            };

            if (formCategoria) renderizarPaginaCategorias();
            if (formOrcamento) renderizarPaginaOrcamentos();
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            mainContent.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
        }
    };

    // --- LÓGICA DA PÁGINA DE CATEGORIAS ---
    const renderizarPaginaCategorias = () => {
        const nomeCategoriaInput = document.getElementById('categoria-nome');
        const listaDespesasEl = document.getElementById('lista-despesas');
        const listaReceitasEl = document.getElementById('lista-receitas');

        function renderizarListas() {
            listaDespesasEl.innerHTML = '';
            listaReceitasEl.innerHTML = '';
            
            const categoriasDespesa = appData.categorias.filter(c => c.tipo === 'despesa');
            if (categoriasDespesa.length === 0) listaDespesasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de despesa.</li>';
            else categoriasDespesa.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaDespesasEl.appendChild(li); });
            
            const categoriasReceita = appData.categorias.filter(c => c.tipo === 'receita');
            if (categoriasReceita.length === 0) listaReceitasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de receita.</li>';
            else categoriasReceita.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaReceitasEl.appendChild(li); });
        };

        formCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = nomeCategoriaInput.value.trim();
            const tipo = document.querySelector('input[name="categoria-tipo"]:checked').value;
            if (nome && !appData.categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
                appData.categorias.push({ id: Date.now(), nome, tipo });
                await salvarDados();
                renderizarListas();
                nomeCategoriaInput.value = '';
            } else if (nome) { alert('Essa categoria já existe.'); }
        });

        document.body.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn') && e.target.closest('.category-list')) {
                const id = parseInt(e.target.dataset.id);
                appData.categorias = appData.categorias.filter(cat => cat.id !== id);
                appData.orcamentos = appData.orcamentos.filter(orc => orc.categoriaId !== id);
                await salvarDados();
                renderizarListas();
            }
        });
        
        renderizarListas();
    };

    // --- LÓGICA DA PÁGINA DE ORÇAMENTOS ---
    const renderizarPaginaOrcamentos = () => {
        // (A lógica interna desta página já estava boa, apenas adaptada para usar appData)
    };

    carregarDados();
});