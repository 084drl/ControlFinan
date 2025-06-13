document.addEventListener('DOMContentLoaded', async () => {
    // --- Estado Global da Aplicação ---
    let appData = {};

    // --- Seletores do DOM ---
    const mainContent = document.querySelector('main');
    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');

    // --- Funções de API ---
    async function carregarDados() {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            const data = await response.json();
            appData = {
                categorias: data.categorias || [],
                orcamentos: data.orcamentos || [],
                transacoes: data.transacoes || [],
                comprasParceladas: data.comprasParceladas || []
            };
            return true;
        } catch (error) {
            console.error("Erro Crítico:", error);
            mainContent.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
            return false;
        }
    }

    async function salvarDados() {
        try {
            await fetch('/.netlify/functions/transacoes', { method: 'POST', body: JSON.stringify(appData) });
        } catch (error) { console.error("Erro ao salvar:", error); }
    }

    // --- Lógica da Página de Categorias ---
    function renderizarPaginaCategorias() {
        const nomeCategoriaInput = document.getElementById('categoria-nome');
        const listaDespesasEl = document.getElementById('lista-despesas');
        const listaReceitasEl = document.getElementById('lista-receitas');

        function renderizarListas() {
            listaDespesasEl.innerHTML = '';
            listaReceitasEl.innerHTML = '';
            const despesas = appData.categorias.filter(c => c.tipo === 'despesa');
            const receitas = appData.categorias.filter(c => c.tipo === 'receita');

            if (despesas.length === 0) listaDespesasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de despesa.</li>';
            else despesas.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaDespesasEl.appendChild(li); });

            if (receitas.length === 0) listaReceitasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de receita.</li>';
            else receitas.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaReceitasEl.appendChild(li); });
        }

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
                await salvarDados();
                renderizarListas();
            }
        });
        
        renderizarListas();
    }

    // --- Lógica da Página de Orçamentos ---
    function renderizarPaginaOrcamentos() {
        // ... (sua lógica para a página de orçamentos vai aqui)
    }

    // --- Ponto de Entrada ---
    if (await carregarDados()) {
        if (formCategoria) renderizarPaginaCategorias();
        if (formOrcamento) renderizarPaginaOrcamentos();
    }
});