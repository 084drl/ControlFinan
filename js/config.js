document.addEventListener('DOMContentLoaded', () => {
    // Estas variáveis agora serão preenchidas com dados do backend
    let categorias = [];
    let orcamentos = [];

    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');
    const mainContent = document.querySelector('main');

    // --- FUNÇÕES DE API (BACKEND) ---
    // Esta função salva TODOS os dados de uma vez.
    const salvarDadosGlobais = async (dados) => {
        try {
            mainContent.style.opacity = '0.5'; // Feedback visual de que está salvando
            await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(dados),
            });
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            alert('Falha ao salvar. Verifique sua conexão.');
        } finally {
            mainContent.style.opacity = '1';
        }
    };

    const carregarDadosEIniciar = async () => {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha ao buscar dados do servidor.');
            
            const dados = await response.json();
            // Preenche as variáveis globais com os dados do "banco"
            categorias = dados.categorias || [{ id: 1, nome: 'Salário', tipo: 'receita' }, { id: 2, nome: 'Moradia', tipo: 'despesa' }];
            orcamentos = dados.orcamentos || [];

            // Inicia a renderização da página específica após carregar os dados
            if (formCategoria) renderizarPaginaCategorias();
            if (formOrcamento) renderizarPaginaOrcamentos();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert(error.message);
        }
    };

    // --- LÓGICA DA PÁGINA DE CATEGORIAS (categorias.html) ---
    const renderizarPaginaCategorias = () => {
        const nomeCategoriaInput = document.getElementById('categoria-nome');
        const listaDespesasEl = document.getElementById('lista-despesas');
        const listaReceitasEl = document.getElementById('lista-receitas');

        const renderizarListas = () => {
            listaDespesasEl.innerHTML = '';
            listaReceitasEl.innerHTML = '';
            
            const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');
            if (categoriasDespesa.length === 0) listaDespesasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de despesa.</li>';
            else categoriasDespesa.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaDespesasEl.appendChild(li); });
            
            const categoriasReceita = categorias.filter(c => c.tipo === 'receita');
            if (categoriasReceita.length === 0) listaReceitasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de receita.</li>';
            else categoriasReceita.forEach(cat => { const li = document.createElement('li'); li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`; listaReceitasEl.appendChild(li); });
        };

        formCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = nomeCategoriaInput.value.trim();
            const tipo = document.querySelector('input[name="categoria-tipo"]:checked').value;
            if (nome && !categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
                categorias.push({ id: Date.now(), nome, tipo });
                await salvarDadosGlobais({ categorias, orcamentos });
                renderizarListas();
                nomeCategoriaInput.value = '';
            } else if (nome) { alert('Essa categoria já existe.'); }
        });

        document.body.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn') && e.target.closest('.category-list')) {
                const id = parseInt(e.target.dataset.id);
                categorias = categorias.filter(cat => cat.id !== id);
                orcamentos = orcamentos.filter(orc => orc.categoriaId !== id);
                await salvarDadosGlobais({ categorias, orcamentos });
                renderizarListas();
            }
        });
        
        renderizarListas();
    };

    // --- LÓGICA DA PÁGINA DE ORÇAMENTOS (orcamentos.html) ---
    const renderizarPaginaOrcamentos = () => {
        const categoriaSelect = document.getElementById('orcamento-categoria-select');
        const valorInput = document.getElementById('orcamento-valor');
        const listaOrcamentosEl = document.getElementById('lista-orcamentos');
        
        const carregarCategoriasDeDespesa = () => {
            categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            categorias.filter(c => c.tipo === 'despesa').forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.nome; categoriaSelect.appendChild(option); });
        };

        const renderizarOrcamentos = () => {
            listaOrcamentosEl.innerHTML = orcamentos.length === 0 ? '<p class="placeholder-text">Nenhum orçamento definido.</p>' : '';
            orcamentos.forEach(orc => {
                const categoria = categorias.find(c => c.id === orc.categoriaId);
                if (categoria) {
                    const item = document.createElement('div');
                    item.className = 'orcamento-list-item';
                    item.innerHTML = `<span><strong>${categoria.nome}:</strong> ${orc.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> <button class="delete-btn" data-id="${orc.categoriaId}">✖</button>`;
                    listaOrcamentosEl.appendChild(item);
                }
            });
        };

        formOrcamento.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoriaId = parseInt(categoriaSelect.value);
            const limite = parseFloat(valorInput.value);
            if (categoriaId && limite > 0) {
                orcamentos = orcamentos.filter(o => o.categoriaId !== categoriaId);
                orcamentos.push({ categoriaId, limite });
                await salvarDadosGlobais({ categorias, orcamentos });
                renderizarOrcamentos();
                formOrcamento.reset();
            }
        });

        listaOrcamentosEl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = parseInt(e.target.dataset.id);
                orcamentos = orcamentos.filter(o => o.categoriaId !== id);
                await salvarDadosGlobais({ categorias, orcamentos });
                renderizarOrcamentos();
            }
        });

        carregarCategoriasDeDespesa();
        renderizarOrcamentos();
    };
    
    // Ponto de entrada do script
    carregarDadosEIniciar();
});