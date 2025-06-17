document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen'), mainContent = document.getElementById('main-content'), loginButton = document.getElementById('login-button');
    const themeSwitch = document.getElementById('checkbox');
    const navLinks = document.querySelectorAll('.nav-link'), pages = document.querySelectorAll('.page');

    // --- BANCO DE DADOS LOCAL (Chaves Estáveis) ---
    let transacoes = JSON.parse(localStorage.getItem('financeApp_transacoes')) || [];
    let categorias = JSON.parse(localStorage.getItem('financeApp_categorias')) || ['Geral'];
    let orcamentos = JSON.parse(localStorage.getItem('financeApp_orcamentos')) || [];
    let recorrencias = JSON.parse(localStorage.getItem('financeApp_recorrencias')) || [];
    const saveData = () => { localStorage.setItem('financeApp_transacoes', JSON.stringify(transacoes)); localStorage.setItem('financeApp_categorias', JSON.stringify(categorias)); localStorage.setItem('financeApp_orcamentos', JSON.stringify(orcamentos)); localStorage.setItem('financeApp_recorrencias', JSON.stringify(recorrencias)); };

    // --- FUNÇÕES DE INICIALIZAÇÃO ---
    function initLogin() {
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                const userInput = document.getElementById('usuario');
                const passInput = document.getElementById('senha');
                if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
                    loginScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    iniciarApp();
                } else { alert('Usuário ou senha incorretos!'); }
            });
        }
    }

    function initTheme() {
        const currentTheme = localStorage.getItem('financeApp_theme') || 'dark';
        document.body.setAttribute('data-theme', currentTheme);
        if (themeSwitch) themeSwitch.checked = currentTheme === 'light';
        if (themeSwitch) themeSwitch.addEventListener('change', (e) => { const newTheme = e.target.checked ? 'light' : 'dark'; document.body.setAttribute('data-theme', newTheme); localStorage.setItem('financeApp_theme', newTheme); });
    }

    function iniciarApp() {
        // Agora que o app principal é visível, podemos selecionar os elementos com segurança
        const elements = {
            incomesDisplay: document.getElementById('total-receitas'), expensesDisplay: document.getElementById('total-despesas'), investmentsDisplay: document.getElementById('total-investimentos'), totalDisplay: document.getElementById('saldo-geral'),
            futureExpensesDisplay: document.getElementById('lancamentos-futuros'), lastInstallmentDisplay: document.getElementById('ultima-parcela'),
            installmentsProjectionDiv: document.getElementById('installments-projection'), budgetsOverviewDiv: document.getElementById('budgets-overview'),
            tbody: document.querySelector('.div-table tbody'),
            modal: document.getElementById("modal"), btnNew: document.getElementById("btnNew"), closeButton: document.querySelector(".close-button"), btnSalvarLancamento: document.getElementById("btnSalvar"),
            mNome: document.getElementById("m-nome"), mDescricao: document.getElementById("m-descricao"), mValor: document.getElementById("m-valor"), mTipo: document.getElementById("m-tipo"),
            despesaOptions: document.getElementById("despesa-options"), mParcelada: document.getElementById("m-parcelada"), parcelasGroup: document.getElementById("parcelas-group"), mParcelas: document.getElementById("m-parcelas"),
            catNomeInput: document.getElementById('cat-nome'), btnSalvarCategoria: document.getElementById('btn-salvar-categoria'), listaCategorias: document.getElementById('lista-categorias'),
            orcCategoriaSelect: document.getElementById('orc-categoria'), orcValorInput: document.getElementById('orc-valor'), btnSalvarOrcamento: document.getElementById('btn-salvar-orcamento'), listaOrcamentos: document.getElementById('lista-orcamentos'),
            recNomeInput: document.getElementById('rec-nome'), recValorInput: document.getElementById('rec-valor'), recTipoSelect: document.getElementById('rec-tipo'), recDiaInput: document.getElementById('rec-dia'), btnSalvarRecorrencia: document.getElementById('btn-salvar-recorrencia'), listaRecorrencias: document.getElementById('lista-recorrencias'),
        };
        
        // Adicionar o campo de categoria dinamicamente ao modal
        if (!document.getElementById('m-categoria')) {
            const categoriaFormGroup = document.createElement('div');
            categoriaFormGroup.className = 'form-group';
            categoriaFormGroup.innerHTML = `<label for="m-categoria">Categoria</label><select id="m-categoria"></select>`;
            elements.despesaOptions.insertAdjacentElement('beforebegin', categoriaFormGroup);
        }
        elements.mCategoriaSelect = document.getElementById('m-categoria');

        const renderizarTudo = () => { renderizarDashboard(elements); renderizarCategorias(elements); renderizarOrcamentos(elements); renderizarRecorrencias(elements); };
        
        configurarEventListeners(elements, renderizarTudo);
        renderizarTudo();
    }
    
    // --- CONFIGURAÇÃO DE EVENT LISTENERS (centralizado) ---
    function configurarEventListeners(elements, renderizarTudo) {
        navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const pageId = link.dataset.page; navLinks.forEach(l => l.classList.remove('active')); link.classList.add('active'); pages.forEach(p => p.classList.remove('active')); document.getElementById(`${pageId}-page`).classList.add('active'); }); });
        
        elements.btnSalvarCategoria.addEventListener('click', (e) => { e.preventDefault(); const nome = elements.catNomeInput.value.trim(); if (nome && !categorias.find(c => c.toLowerCase() === nome.toLowerCase())) { categorias.push(nome); saveData(); renderizarTudo(); elements.catNomeInput.value = ''; } else { alert('Nome inválido ou categoria já existe.'); } });
        elements.btnSalvarOrcamento.addEventListener('click', (e) => { e.preventDefault(); const cat = elements.orcCategoriaSelect.value; const val = parseFloat(elements.orcValorInput.value); if (cat && val > 0) { const index = orcamentos.findIndex(o => o.categoria === cat); if (index > -1) orcamentos[index].valor = val; else orcamentos.push({ categoria: cat, valor: val }); saveData(); renderizarTudo(); elements.orcValorInput.value = ''; } else { alert('Selecione uma categoria e um valor válido.'); } });
        elements.btnSalvarRecorrencia.addEventListener('click', (e) => { e.preventDefault(); const nome = elements.recNomeInput.value.trim(); const valor = parseFloat(elements.recValorInput.value); const tipo = elements.recTipoSelect.value; const dia = parseInt(elements.recDiaInput.value); if (nome && valor > 0 && dia >= 1 && dia <= 31) { recorrencias.push({ id: Date.now(), nome, valor, tipo, dia }); saveData(); renderizarTudo(); elements.recNomeInput.value = ''; elements.recValorInput.value = ''; elements.recDiaInput.value = ''; } else { alert('Preencha todos os campos corretamente.'); } });
        
        const closeModal = () => { elements.modal.style.display = "none"; elements.mNome.value = ''; elements.mDescricao.value = ''; elements.mValor.value = ''; elements.mParcelas.value = ''; elements.mParcelada.checked = false; elements.parcelasGroup.classList.add('hidden'); };
        elements.btnNew.onclick = () => { elements.modal.style.display = "flex"; atualizarSelectsDeCategoria(elements); };
        elements.closeButton.onclick = closeModal;
        elements.mTipo.addEventListener('change', () => elements.despesaOptions.classList.toggle('hidden', elements.mTipo.value !== 'Despesa'));
        elements.mParcelada.addEventListener('change', () => elements.parcelasGroup.classList.toggle('hidden', !elements.mParcelada.checked));
        elements.btnSalvarLancamento.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = elements.mNome.value.trim(), valor = parseFloat(elements.mValor.value), tipo = elements.mTipo.value, descricao = elements.mDescricao.value.trim(), categoria = elements.mCategoriaSelect.value;
            const hoje = new Date();
            if (!nome || !valor) return alert('Nome e Valor são obrigatórios.');

            if (elements.mParcelada.checked && tipo === 'Despesa') {
                const qtdParcelas = parseInt(elements.mParcelas.value);
                if (qtdParcelas > 1) {
                    const valorParcela = valor / qtdParcelas;
                    for (let i = 0; i < qtdParcelas; i++) {
                        const dataParcela = new Date(hoje.getFullYear(), hoje.getMonth() + i, hoje.getDate());
                        transacoes.push({ id: Date.now() + i, nome: `${nome} (${i + 1}/${qtdParcelas})`, descricao, valor: valorParcela, tipo, categoria, data: dataParcela.toISOString().slice(0, 10), installmentInfo: { current: i + 1, total: qtdParcelas } });
                    }
                }
            } else {
                transacoes.push({ id: Date.now(), nome, descricao, valor, tipo, categoria, data: hoje.toISOString().slice(0, 10) });
            }
            saveData();
            renderizarTudo();
            closeModal();
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function formatCurrency(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    
    function renderizarDashboard({ incomesDisplay, expensesDisplay, investmentsDisplay, totalDisplay, tbody, futureExpensesDisplay, lastInstallmentDisplay, installmentsProjectionDiv, budgetsOverviewDiv }) {
        const hoje = new Date();
        const mesAtual = hoje.getMonth(), anoAtual = hoje.getFullYear();
        
        // FILTRA TRANSAÇÕES PARA O MÊS ATUAL
        const transacoesDoMes = transacoes.filter(t => { const data = new Date(t.data + 'T00:00:00'); return data.getMonth() === mesAtual && data.getFullYear() === anoAtual; });
        
        const totalReceitas = transacoesDoMes.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0);
        const totalDespesas = transacoesDoMes.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0);
        const totalInvestimentos = transacoesDoMes.filter(t => t.tipo === 'Investimento').reduce((acc, t) => acc + t.valor, 0);
        incomesDisplay.textContent = formatCurrency(totalReceitas);
        expensesDisplay.textContent = formatCurrency(totalDespesas);
        investmentsDisplay.textContent = formatCurrency(totalInvestimentos);
        totalDisplay.textContent = formatCurrency(totalReceitas - totalDespesas);
        
        // RENDERIZA A TABELA APENAS COM TRANSAÇÕES DO MÊS
        tbody.innerHTML = '';
        transacoesDoMes.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(t => { tbody.innerHTML += `<tr><td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td>${t.nome}</td><td>${formatCurrency(t.valor)}</td><td class="columnType">${t.tipo}</td><td class="columnAction"><button onclick="deleteTransaction(${t.id})"><i class='fa-solid fa-trash'></i></button></td></tr>`; });
        
        hoje.setHours(0, 0, 0, 0);
        const lancamentosFuturos = transacoes.filter(t => new Date(t.data + 'T00:00:00') > hoje && t.tipo === 'Despesa');
        futureExpensesDisplay.textContent = formatCurrency(lancamentosFuturos.reduce((acc, t) => acc + t.valor, 0));
        
        if (lancamentosFuturos.length > 0) { const ultimaData = new Date(Math.max.apply(null, lancamentosFuturos.map(t => new Date(t.data)))); lastInstallmentDisplay.textContent = ultimaData.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); } else { lastInstallmentDisplay.textContent = '-'; }

        const projecoes = {};
        lancamentosFuturos.forEach(t => { const mesAno = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); if (!projecoes[mesAno]) projecoes[mesAno] = 0; projecoes[mesAno] += t.valor; });
        installmentsProjectionDiv.innerHTML = '';
        if (Object.keys(projecoes).length > 0) { for (const mes in projecoes) { installmentsProjectionDiv.innerHTML += `<p>${(mes.charAt(0).toUpperCase() + mes.slice(1))}: ${formatCurrency(projecoes[mes])}</p>`; } } else { installmentsProjectionDiv.innerHTML = '<p>Nenhuma despesa futura.</p>'; }

        budgetsOverviewDiv.innerHTML = '';
        if (orcamentos.length > 0) { orcamentos.forEach(orc => { const gastos = transacoesDoMes.filter(t => t.categoria === orc.categoria && t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0); const percentual = orc.valor > 0 ? (gastos / orc.valor) * 100 : 0; budgetsOverviewDiv.innerHTML += `<div class="budget-item"><p><span>${orc.categoria}</span><span>${formatCurrency(gastos)} / ${formatCurrency(orc.valor)}</span></p><div class="progress-bar"><div class="progress" style="width: ${Math.min(percentual, 100)}%;"></div></div></div>`; }); } else { budgetsOverviewDiv.innerHTML = '<p>Nenhum orçamento definido.</p>'; }
    }

    window.deleteTransaction = (id) => { if (confirm('Tem certeza?')) { transacoes = transacoes.filter(t => t.id !== id); saveData(); iniciarApp(); } };

    function renderizarCategorias({ listaCategorias, orcCategoriaSelect, mCategoriaSelect }) { listaCategorias.innerHTML = ''; if (categorias.length === 0 || (categorias.length === 1 && categorias[0] === 'Geral')) { listaCategorias.innerHTML = '<li>Nenhuma categoria personalizada.</li>'; } else { categorias.filter(c => c !== 'Geral').forEach(cat => listaCategorias.innerHTML += `<li>${cat}</li>`); } atualizarSelectsDeCategoria({ orcCategoriaSelect, mCategoriaSelect }); }
    function atualizarSelectsDeCategoria({ orcCategoriaSelect, mCategoriaSelect }) { orcCategoriaSelect.innerHTML = ''; if (mCategoriaSelect) mCategoriaSelect.innerHTML = ''; categorias.forEach(cat => { const option = `<option value="${cat}">${cat}</option>`; orcCategoriaSelect.innerHTML += option; if (mCategoriaSelect) mCategoriaSelect.innerHTML += option; }); }
    function renderizarOrcamentos({ listaOrcamentos }) { listaOrcamentos.innerHTML = ''; orcamentos.forEach(orc => listaOrcamentos.innerHTML += `<li>${orc.categoria}: ${formatCurrency(orc.valor)}</li>`); }
    function renderizarRecorrencias({ listaRecorrencias }) { listaRecorrencias.innerHTML = ''; recorrencias.forEach(rec => listaRecorrencias.innerHTML += `<li>${rec.nome} - ${formatCurrency(rec.valor)} (${rec.tipo}) - Dia ${rec.dia}</li>`); }

    // --- INICIA O APP ---
    initTheme();
    initLogin();
});