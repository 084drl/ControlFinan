document.addEventListener('DOMContentLoaded', () => {
    // === ESTADO DA APLICAÇÃO ===
    // Usando uma nova versão para garantir que não haja conflito com dados antigos
    let categorias = JSON.parse(localStorage.getItem('categorias_v5')) || [
        { id: 1, nome: 'Salário', tipo: 'receita' },
        { id: 2, nome: 'Moradia', tipo: 'despesa' },
        { id: 3, nome: 'Alimentação', tipo: 'despesa' },
    ];
    let orcamentos = JSON.parse(localStorage.getItem('orcamentos_v5')) || [];

    const formCategoria = document.getElementById('form-categoria');
    const formOrcamento = document.getElementById('form-orcamento');

    const salvarDados = () => {
        localStorage.setItem('categorias_v5', JSON.stringify(categorias));
        localStorage.setItem('orcamentos_v5', JSON.stringify(orcamentos));
    };

    // === LÓGICA DE CATEGORIAS (categorias.html) ===
    if (formCategoria) {
        const nomeCategoriaInput = document.getElementById('categoria-nome');
        const listaDespesasEl = document.getElementById('lista-despesas');
        const listaReceitasEl = document.getElementById('lista-receitas');

        const renderizarCategorias = () => {
            if (!listaDespesasEl || !listaReceitasEl) return;
            listaDespesasEl.innerHTML = '';
            listaReceitasEl.innerHTML = '';
            
            const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');
            const categoriasReceita = categorias.filter(c => c.tipo === 'receita');

            if (categoriasDespesa.length === 0) {
                 listaDespesasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de despesa.</li>';
            } else {
                categoriasDespesa.forEach(cat => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`;
                    listaDespesasEl.appendChild(li);
                });
            }

            if (categoriasReceita.length === 0) {
                 listaReceitasEl.innerHTML = '<li class="placeholder-text">Nenhuma categoria de receita.</li>';
            } else {
                categoriasReceita.forEach(cat => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${cat.nome}</span> <button class="delete-btn" data-id="${cat.id}">✖</button>`;
                    listaReceitasEl.appendChild(li);
                });
            }
        };

        formCategoria.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = nomeCategoriaInput.value.trim();
            const tipo = document.querySelector('input[name="categoria-tipo"]:checked').value;
            if (nome && !categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
                categorias.push({ id: Date.now(), nome, tipo });
                salvarDados();
                renderizarCategorias();
                nomeCategoriaInput.value = '';
            } else if (nome) {
                alert('Essa categoria já existe.');
            }
        });

        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') && e.target.closest('.category-list')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                categorias = categorias.filter(cat => cat.id !== id);
                orcamentos = orcamentos.filter(orc => orc.categoriaId !== id);
                salvarDados();
                renderizarCategorias();
            }
        });
        
        renderizarCategorias();
    }

    // === LÓGICA DE ORÇAMENTOS (orcamentos.html) ===
    if (formOrcamento) {
        const categoriaSelect = document.getElementById('orcamento-categoria-select');
        const valorInput = document.getElementById('orcamento-valor');
        const listaOrcamentosEl = document.getElementById('lista-orcamentos');
        
        const carregarCategoriasDeDespesa = () => {
            categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');
            categoriasDespesa.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                categoriaSelect.appendChild(option);
            });
        };

        const renderizarOrcamentos = () => {
            listaOrcamentosEl.innerHTML = '';
            if (orcamentos.length === 0) {
                listaOrcamentosEl.innerHTML = '<p class="placeholder-text">Nenhum orçamento definido.</p>';
            } else {
                orcamentos.forEach(orc => {
                    const categoria = categorias.find(c => c.id === orc.categoriaId);
                    if (categoria) {
                        const item = document.createElement('div');
                        item.className = 'orcamento-list-item';
                        item.innerHTML = `
                            <span><strong>${categoria.nome}:</strong> ${orc.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <button class="delete-btn" data-id="${orc.categoriaId}">✖</button>
                        `;
                        listaOrcamentosEl.appendChild(item);
                    }
                });
            }
        };

        formOrcamento.addEventListener('submit', (e) => {
            e.preventDefault();
            const categoriaId = parseInt(categoriaSelect.value);
            const limite = parseFloat(valorInput.value);
            if (categoriaId && limite > 0) {
                orcamentos = orcamentos.filter(o => o.categoriaId !== categoriaId);
                orcamentos.push({ categoriaId, limite });
                salvarDados();
                renderizarOrcamentos();
                formOrcamento.reset();
            }
        });

        listaOrcamentosEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                orcamentos = orcamentos.filter(o => o.categoriaId !== id);
                salvarDados();
                renderizarOrcamentos();
            }
        });

        carregarCategoriasDeDespesa();
        renderizarOrcamentos();
    }
});