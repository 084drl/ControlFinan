document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen'), mainContent = document.getElementById('main-content'), loginButton = document.getElementById('login-button'), userInput = document.getElementById('usuario'), passInput = document.getElementById('senha');
    const themeSwitch = document.getElementById('checkbox');
    const navLinks = document.querySelectorAll('.nav-link'), pages = document.querySelectorAll('.page');
    // Cards do Dashboard
    const incomesDisplay = document.querySelector('#main-content .income-value'), expensesDisplay = document.querySelector('#main-content .expense-value'), investmentsDisplay = document.querySelector('#main-content .investment-value'), totalDisplay = document.querySelector('#main-content .total-value');
    const futureExpensesDisplay = document.querySelector('.planning-item:nth-child(1) span'), lastInstallmentDisplay = document.querySelector('.planning-item:nth-child(2) span');
    // Seções do Dashboard
    const installmentsProjectionDiv = document.querySelector('#installments-projection'), budgetsOverviewDiv = document.querySelector('#budgets-overview');
    // Tabela
    const tbody = document.querySelector('.div-table tbody');
    // Modal
    const modal = document.getElementById("modal"), btnNew = document.getElementById("btnNew"), closeButton = document.querySelector(".close-button"), btnSalvarLancamento = document.getElementById("btnSalvar");
    const mNome = document.getElementById("m-nome"), mDescricao = document.getElementById("m-descricao"), mValor = document.getElementById("m-valor"), mTipo = document.getElementById("m-tipo");
    const despesaOptions = document.getElementById("despesa-options"), mParcelada = document.getElementById("m-parcelada"), parcelasGroup = document.getElementById("parcelas-group"), mParcelas = document.getElementById("m-parcelas");
    // Páginas de Gerenciamento
    const catNomeInput = document.getElementById('cat-nome'), btnSalvarCategoria = document.getElementById('btn-salvar-categoria'), listaCategorias = document.getElementById('lista-categorias');
    const orcCategoriaSelect = document.getElementById('orc-categoria'), orcValorInput = document.getElementById('orc-valor'), btnSalvarOrcamento = document.getElementById('btn-salvar-orcamento'), listaOrcamentos = document.getElementById('lista-orcamentos');
    const recNomeInput = document.getElementById('rec-nome'), recValorInput = document.getElementById('rec-valor'), recTipoSelect = document.getElementById('rec-tipo'), recDiaInput = document.getElementById('rec-dia'), btnSalvarRecorrencia = document.getElementById('btn-salvar-recorrencia'), listaRecorrencias = document.getElementById('lista-recorrencias');

    // --- BANCO DE DADOS LOCAL (Chaves Estáveis) ---
    let transacoes = JSON.parse(localStorage.getItem('financeApp_transacoes')) || [];
    let categorias = JSON.parse(localStorage.getItem('financeApp_categorias')) || ['Geral'];
    let orcamentos = JSON.parse(localStorage.getItem('financeApp_orcamentos')) || [];
    let recorrencias = JSON.parse(localStorage.getItem('financeApp_recorrencias')) || [];
    const saveData = () => { localStorage.setItem('financeApp_transacoes', JSON.stringify(transacoes)); localStorage.setItem('financeApp_categorias', JSON.stringify(categorias)); localStorage.setItem('financeApp_orcamentos', JSON.stringify(orcamentos)); localStorage.setItem('financeApp_recorrencias', JSON.stringify(recorrencias)); };

    // --- LÓGICA DE LOGIN E TEMA ---
    loginButton.addEventListener('click', () => { if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') { loginScreen.style.display = 'none'; mainContent.style.display = 'block'; iniciarApp(); } else { alert('Usuário ou senha incorretos!'); } });
    const currentTheme = localStorage.getItem('financeApp_theme') || 'dark'; document.body.setAttribute('data-theme', currentTheme); themeSwitch.checked = currentTheme === 'light';
    themeSwitch.addEventListener('change', (e) => { const newTheme = e.target.checked ? 'light' : 'dark'; document.body.setAttribute('data-theme', newTheme); localStorage.setItem('financeApp_theme', newTheme); });

    // --- NAVEGAÇÃO ENTRE ABAS ---
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const pageId = link.dataset.page; navLinks.forEach(l => l.classList.remove('active')); link.classList.add('active'); pages.forEach(p => p.classList.remove('active')); document.getElementById(`${pageId}-page`).classList.add('active'); }); });

    // --- INICIALIZAÇÃO E RENDERIZAÇÃO GERAL ---
    function iniciarApp() {
        renderizarTudo();
    }

    function renderizarTudo() {
        renderizarDashboard();
        renderizarCategorias();
        renderizarOrcamentos();
        renderizarRecorrencias();
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO DO DASHBOARD ---
    function formatCurrency(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    
    function renderizarDashboard() {
        // 1. Cards de Totais
        const totalReceitas = transacoes.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0);
        const totalDespesas = transacoes.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0);
        const totalInvestimentos = transacoes.filter(t => t.tipo === 'Investimento').reduce((acc, t) => acc + t.valor, 0);
        incomesDisplay.textContent = formatCurrency(totalReceitas);
        expensesDisplay.textContent = formatCurrency(totalDespesas);
        investmentsDisplay.textContent = formatCurrency(totalInvestimentos);
        totalDisplay.textContent = formatCurrency(totalReceitas - totalDespesas);

        // 2. Tabela de Transações
        tbody.innerHTML = '';
        transacoes.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach((t, index) => {
            tbody.innerHTML += `<tr><td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td>${t.nome}</td><td>${formatCurrency(t.valor)}</td><td class="columnType">${t.tipo}</td><td class="columnAction"><button onclick="deleteTransaction(${t.id})"><i class='fa-solid fa-trash'></i></button></td></tr>`;
        });
        
        // 3. Planejamento Futuro
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const lancamentosFuturos = transacoes.filter(t => new Date(t.data) > hoje && t.tipo === 'Despesa');
        const totalFuturo = lancamentosFuturos.reduce((acc, t) => acc + t.valor, 0);
        futureExpensesDisplay.textContent = formatCurrency(totalFuturo);
        if (lancamentosFuturos.length > 0) {
            const ultimaData = new Date(Math.max.apply(null, lancamentosFuturos.map(t => new Date(t.data))));
            lastInstallmentDisplay.textContent = ultimaData.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric'});
        } else {
            lastInstallmentDisplay.textContent = '-';
        }

        // 4. Projeção de Parcelas por Mês
        const projecoes = {};
        lancamentosFuturos.forEach(t => {
            const mesAno = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric'});
            if (!projecoes[mesAno]) projecoes[mesAno] = 0;
            projecoes[mesAno] += t.valor;
        });
        installmentsProjectionDiv.innerHTML = '';
        if (Object.keys(projecoes).length > 0) {
            for (const mes in projecoes) {
                installmentsProjectionDiv.innerHTML += `<p>${mes.charAt(0).toUpperCase() + mes.slice(1)}: ${formatCurrency(projecoes[mes])}</p>`;
            }
        } else {
            installmentsProjectionDiv.innerHTML = '<p>Nenhuma despesa futura.</p>';
        }

        // 5. Orçamentos Mensais
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        budgetsOverviewDiv.innerHTML = '';
        if (orcamentos.length > 0) {
            orcamentos.forEach(orc => {
                const gastos = transacoes.filter(t => t.categoria === orc.categoria && t.tipo === 'Despesa' && new Date(t.data + 'T00:00:00').getMonth() === mesAtual && new Date(t.data + 'T00:00:00').getFullYear() === anoAtual).reduce((acc, t) => acc + t.valor, 0);
                const percentual = (gastos / orc.valor) * 100;
                budgetsOverviewDiv.innerHTML += `<div class="budget-item"><p><span>${orc.categoria}</span><span>${formatCurrency(gastos)} / ${formatCurrency(orc.valor)}</span></p><div class="progress-bar"><div class="progress" style="width: ${Math.min(percentual, 100)}%;"></div></div></div>`;
            });
        } else {
            budgetsOverviewDiv.innerHTML = '<p>Nenhum orçamento definido.</p>';
        }
    }

    window.deleteTransaction = (id) => {
        if (confirm('Tem certeza que deseja apagar esta transação?')) {
            transacoes = transacoes.filter(t => t.id !== id);
            saveData();
            renderizarTudo();
        }
    }

    // --- GERENCIAMENTO DE CADASTROS (Categorias, Orçamentos, Recorrências) ---
    function renderizarCategorias() { /* ... código mantido da etapa anterior ... */ }
    btnSalvarCategoria.addEventListener('click', (e) => { e.preventDefault(); const nome = catNomeInput.value.trim(); if (nome && !categorias.find(c => c.toLowerCase() === nome.toLowerCase())) { categorias.push(nome); saveData(); renderizarCategorias(); catNomeInput.value = ''; } else { alert('Nome inválido ou categoria já existe.'); } });
    function atualizarSelectsDeCategoria() { /* ... código mantido ... */ }
    function renderizarOrcamentos() { /* ... código mantido ... */ }
    btnSalvarOrcamento.addEventListener('click', (e) => { e.preventDefault(); const cat = orcCategoriaSelect.value; const val = parseFloat(orcValorInput.value); if (cat && val > 0) { const index = orcamentos.findIndex(o => o.categoria === cat); if (index > -1) orcamentos[index].valor = val; else orcamentos.push({ categoria: cat, valor: val }); saveData(); renderizarOrcamentos(); orcValorInput.value = ''; } else { alert('Selecione uma categoria e um valor válido.'); } });
    function renderizarRecorrencias() { /* ... código mantido ... */ }
    btnSalvarRecorrencia.addEventListener('click', (e) => { e.preventDefault(); const nome = recNomeInput.value.trim(); const valor = parseFloat(recValorInput.value); const tipo = recTipoSelect.value; const dia = parseInt(recDiaInput.value); if (nome && valor > 0 && dia >= 1 && dia <= 31) { recorrencias.push({ id: Date.now(), nome, valor, tipo, dia }); saveData(); renderizarRecorrencias(); recNomeInput.value = ''; recValorInput.value = ''; recDiaInput.value = ''; } else { alert('Preencha todos os campos corretamente.'); } });
    
    // --- MODAL DE LANÇAMENTO (AVULSO) ---
    btnNew.onclick = () => { modal.style.display = "flex"; };
    const closeModal = () => { modal.style.display = "none"; mNome.value = ''; mDescricao.value = ''; mValor.value = ''; mParcelas.value = ''; mParcelada.checked = false; parcelasGroup.classList.add('hidden'); };
    closeButton.onclick = closeModal;
    mTipo.addEventListener('change', () => despesaOptions.classList.toggle('hidden', mTipo.value !== 'Despesa'));
    mParcelada.addEventListener('change', () => parcelasGroup.classList.toggle('hidden', !mParcelada.checked));

    btnSalvarLancamento.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = mNome.value.trim();
        const valor = parseFloat(mValor.value);
        const tipo = mTipo.value;
        const descricao = mDescricao.value.trim();
        const hoje = new Date().toISOString().slice(0, 10); // Lançamentos avulsos são datados como hoje

        if (!nome || !valor) return alert('Nome e Valor são obrigatórios.');

        if (mParcelada.checked && mTipo.value === 'Despesa') {
            const qtdParcelas = parseInt(mParcelas.value);
            if (qtdParcelas > 1) {
                const valorParcela = valor / qtdParcelas;
                for (let i = 1; i <= qtdParcelas; i++) {
                    const dataParcela = new Date();
                    dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
                    transacoes.push({ id: Date.now() + i, nome: `${nome} (${i}/${qtdParcelas})`, descricao, valor: valorParcela, tipo, data: dataParcela.toISOString().slice(0, 10), installmentInfo: { current: i, total: qtdParcelas } });
                }
            }
        } else {
            transacoes.push({ id: Date.now(), nome, descricao, valor, tipo, data: hoje });
        }
        
        saveData();
        renderizarTudo();
        closeModal();
    });
});