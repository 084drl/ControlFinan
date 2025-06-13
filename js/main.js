document.addEventListener('DOMContentLoaded', async () => {
    // --- Estado Global da Aplicação ---
    let appData = {};
    let charts = {};

    // --- Seletores do DOM ---
    const mainElement = document.querySelector('main');
    if (!mainElement) return; // Aborta se não estiver em uma página principal

    // --- Funções de API ---
    async function carregarDados() {
        try {
            const response = await fetch('/.netlify/functions/transacoes');
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            const data = await response.json();
            
            // Define o estado inicial se o banco de dados estiver vazio
            appData.transacoes = data.transacoes || [];
            appData.comprasParceladas = data.comprasParceladas || [];
            appData.orcamentos = data.orcamentos || [];
            if (!data.categorias || data.categorias.length === 0) {
                appData.categorias = [
                    { id: Date.now() + 1, nome: 'Salário', tipo: 'receita' },
                    { id: Date.now() + 2, nome: 'Moradia', tipo: 'despesa' }
                ];
                // Salva o estado inicial se ele foi criado
                await salvarDados();
            } else {
                appData.categorias = data.categorias;
            }
            return true;
        } catch (error) {
            console.error("Erro Crítico:", error);
            mainElement.innerHTML = `<div class="card"><p class="error-text" style="display:block;">Erro ao carregar dados. Tente recarregar a página.</p></div>`;
            return false;
        }
    }

    async function salvarDados() {
        try {
            await fetch('/.netlify/functions/transacoes', {
                method: 'POST',
                body: JSON.stringify(appData)
            });
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    }

    // --- Funções de Renderização e Lógica ---
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function renderizarTudo() {
        const form = document.getElementById('form-transacao');
        if (!form) return; // Garante que só rode na página certa

        // Seletores específicos do formulário
        const descricaoInput = document.getElementById('descricao');
        const valorInput = document.getElementById('valor');
        const dataInput = document.getElementById('data');
        const categoriaSelect = document.getElementById('categoria-select');
        const tipoRadios = document.querySelectorAll('input[name="tipo"]');
        const isFixoInput = document.getElementById('is-fixo');
        const isParceladaInput = document.getElementById('is-parcelada');
        const parceladoOptionContainer = document.getElementById('parcelado-option-container');
        const parcelasInputContainer = document.getElementById('parcelas-input-container');
        const listaTransacoesEl = document.getElementById('lista-transacoes');
        
        dataInput.valueAsDate = new Date();

        function carregarCategorias() {
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            categoriaSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            appData.categorias.filter(c => c.tipo === tipo).forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                categoriaSelect.appendChild(option);
            });
        }
        
        function atualizarVisibilidadeFormulario() {
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            carregarCategorias();
            parceladoOptionContainer.style.display = tipo === 'despesa' ? 'flex' : 'none';
            if (tipo !== 'despesa') isParceladaInput.checked = false;
            parcelasInputContainer.style.display = isParceladaInput.checked ? 'block' : 'none';
        }

        tipoRadios.forEach(radio => radio.addEventListener('change', atualizarVisibilidadeFormulario));
        isParceladaInput.addEventListener('change', atualizarVisibilidadeFormulario);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novaTransacao = {
                id: Date.now(),
                descricao: descricaoInput.value.trim(),
                valor: parseFloat(valorInput.value),
                data: dataInput.value,
                tipo: document.querySelector('input[name="tipo"]:checked').value,
                categoriaId: parseInt(categoriaSelect.value),
                isFixo: isFixoInput.checked
            };

            if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.data || !novaTransacao.categoriaId) {
                alert('Preencha todos os campos!'); return;
            }

            if (isParceladaInput.checked) {
                appData.comprasParceladas.push({ ...novaTransacao, valorTotal: novaTransacao.valor, numParcelas: parseInt(document.getElementById('parcelas').value) });
            } else {
                appData.transacoes.push({ ...novaTransacao, valor: novaTransacao.tipo === 'receita' ? novaTransacao.valor : -novaTransacao.valor });
            }
            
            await salvarDados();
            form.reset();
            renderizarTudo();
        });

        // Lógica para renderizar o dashboard (tabela, valores, gráficos)
        listaTransacoesEl.innerHTML = 'Carregando transações...'; // Feedback inicial
        
        // ... (Aqui entra a lógica completa para renderizar o dashboard, gráficos, etc.)
        // Exemplo:
        const hoje = new Date();
        const transacoesMes = gerarTransacoesCompletas().filter(t => new Date(t.data + 'T00:00:00').getMonth() === hoje.getMonth() && new Date(t.data + 'T00:00:00').getFullYear() === hoje.getFullYear());
        
        listaTransacoesEl.innerHTML = '';
        transacoesMes.forEach(t => {
            const cat = appData.categorias.find(c => c.id === t.categoriaId);
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${t.descricao}</td><td>${formatarMoeda(t.valor)}</td><td>${cat?.nome || ''}</td><td>${new Date(t.data+'T00:00:00').toLocaleDateString()}</td><td>...</td>`;
            listaTransacoesEl.appendChild(tr);
        });

        //... chamar as funções de renderização de gráficos aqui ...

        atualizarVisibilidadeFormulario();
    }
    
    function gerarTransacoesCompletas() {
        // ... (sua função gerarTransacoesCompletas)
        return [...appData.transacoes, ...appData.comprasParceladas]; // Exemplo simplificado
    }

    // --- Ponto de Entrada ---
    if (await carregarDados()) {
        renderizarTudo();
    }
});