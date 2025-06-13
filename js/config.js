document.addEventListener('DOMContentLoaded', () => {
    let appData = { categorias: [], orcamentos: [] };

    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');
    const mainContent = document.querySelector('main');

    const salvarDados = async () => {
        try {
            document.body.style.cursor = 'wait';
            await fetch('/.netlify/functions/transacoes', { method: 'POST', body: JSON.stringify(appData) });
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert("Não foi possível salvar as alterações.");
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
                categorias: data.categorias || [],
                orcamentos: data.orcamentos || [],
                transacoes: data.transacoes || [],
                comprasParceladas: data.comprasParceladas || []
            };
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            mainContent.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados.</p></div>`;
            return false;
        }
        return true;
    };

    const renderizarPaginaCategorias = () => {
        const nomeCategoriaInput = document.getElementById('categoria-nome');
        const listaDespesasEl = document.getElementById('lista-despesas');
        const listaReceitasEl = document.getElementById('lista-receitas');

        const renderizarListas = () => {
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

    const renderizarPaginaOrcamentos = () => {
        const categoriaSelect = document.getElementById('orcamento-categoria-select');
        const valorInput = document.getElementById('orcamento-valor');
        const listaOrcamentosEl = document.getElementById('lista-orcamentos');

        const carregarCategoriasDeDespesa = () => {
            categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            appData.categorias.filter(c => c.tipo === 'despesa').forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                categoriaSelect.appendChild(option);
            });
        };

        const renderizarOrcamentos = () => {
            listaOrcamentosEl.innerHTML = appData.orcamentos.length === 0 ? '<p class="placeholder-text">Nenhum orçamento definido.</p>' : '';
            appData.orcamentos.forEach(orc => {
                const categoria = appData.categorias.find(c => c.id === orc.categoriaId);
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
                appData.orcamentos = appData.orcamentos.filter(o => o.categoriaId !== categoriaId);
                appData.orcamentos.push({ categoriaId, limite });
                await salvarDados();
                renderizarOrcamentos();
                formOrcamento.reset();
            }
        });

        listaOrcamentosEl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = parseInt(e.target.dataset.id);
                appData.orcamentos = appData.orcamentos.filter(o => o.categoriaId !== id);
                await salvarDados();
                renderizarOrcamentos();
            }
        });

        carregarCategoriasDeDespesa();
        renderizarOrcamentos();
    };
    
    // Ponto de entrada
    (async () => {
        if (await carregarDados()) {
            if (formCategoria) renderizarPaginaCategorias();
            if (formOrcamento) renderizarPaginaOrcamentos();
        }
    })();
});