document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen'), mainContent = document.getElementById('main-content'), loginButton = document.getElementById('login-button'), userInput = document.getElementById('usuario'), passInput = document.getElementById('senha');
    const themeSwitch = document.getElementById('checkbox');
    const navLinks = document.querySelectorAll('.nav-link'), pages = document.querySelectorAll('.page');
    const modal = document.getElementById("modal"), btnNew = document.getElementById("btnNew"), closeButton = document.querySelector(".close-button"), btnSalvarLancamento = document.getElementById("btnSalvar");
    const mNome = document.getElementById("m-nome"), mDescricao = document.getElementById("m-descricao"), mValor = document.getElementById("m-valor"), mTipo = document.getElementById("m-tipo");
    const despesaOptions = document.getElementById("despesa-options"), mParcelada = document.getElementById("m-parcelada"), parcelasGroup = document.getElementById("parcelas-group"), mParcelas = document.getElementById("m-parcelas");
    const catNomeInput = document.getElementById('cat-nome'), btnSalvarCategoria = document.getElementById('btn-salvar-categoria'), listaCategorias = document.getElementById('lista-categorias');
    const orcCategoriaSelect = document.getElementById('orc-categoria'), orcValorInput = document.getElementById('orc-valor'), btnSalvarOrcamento = document.getElementById('btn-salvar-orcamento'), listaOrcamentos = document.getElementById('lista-orcamentos');
    const recNomeInput = document.getElementById('rec-nome'), recValorInput = document.getElementById('rec-valor'), recTipoSelect = document.getElementById('rec-tipo'), recDiaInput = document.getElementById('rec-dia'), btnSalvarRecorrencia = document.getElementById('btn-salvar-recorrencia'), listaRecorrencias = document.getElementById('lista-recorrencias');

    // --- BANCO DE DADOS LOCAL (COM CHAVES ESTÁVEIS) ---
    let transacoes = JSON.parse(localStorage.getItem('financeApp_transacoes')) || [];
    let categorias = JSON.parse(localStorage.getItem('financeApp_categorias')) || ['Geral'];
    let orcamentos = JSON.parse(localStorage.getItem('financeApp_orcamentos')) || [];
    let recorrencias = JSON.parse(localStorage.getItem('financeApp_recorrencias')) || [];

    const saveData = () => {
        localStorage.setItem('financeApp_transacoes', JSON.stringify(transacoes));
        localStorage.setItem('financeApp_categorias', JSON.stringify(categorias));
        localStorage.setItem('financeApp_orcamentos', JSON.stringify(orcamentos));
        localStorage.setItem('financeApp_recorrencias', JSON.stringify(recorrencias));
    };

    // --- LÓGICA DE LOGIN E TEMA ---
    loginButton.addEventListener('click', () => {
        if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
            iniciarApp();
        } else { alert('Usuário ou senha incorretos!'); }
    });
    const currentTheme = localStorage.getItem('financeApp_theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'light';
    themeSwitch.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('financeApp_theme', newTheme);
    });

    // --- NAVEGAÇÃO ENTRE ABAS ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`${pageId}-page`).classList.add('active');
        });
    });

    // --- INICIALIZAÇÃO E RENDERIZAÇÃO GERAL ---
    function iniciarApp() {
        renderizarCategorias();
        renderizarOrcamentos();
        renderizarRecorrencias();
        // Aqui chamaremos as funções de renderização do dashboard
    }

    // --- CATEGORIAS ---
    function renderizarCategorias() {
        listaCategorias.innerHTML = '';
        if (categorias.length === 0 || (categorias.length === 1 && categorias[0] === 'Geral')) {
            listaCategorias.innerHTML = '<li>Nenhuma categoria personalizada.</li>';
        } else {
            categorias.filter(c => c !== 'Geral').forEach(cat => listaCategorias.innerHTML += `<li>${cat}</li>`);
        }
        atualizarSelectsDeCategoria();
    }
    btnSalvarCategoria.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = catNomeInput.value.trim();
        if (nome && !categorias.find(c => c.toLowerCase() === nome.toLowerCase())) {
            categorias.push(nome);
            saveData();
            renderizarCategorias();
            catNomeInput.value = '';
        } else { alert('Nome inválido ou categoria já existe.'); }
    });

    // --- ORÇAMENTOS ---
    function atualizarSelectsDeCategoria() {
        orcCategoriaSelect.innerHTML = '';
        categorias.filter(c => c !== 'Geral').forEach(cat => orcCategoriaSelect.innerHTML += `<option value="${cat}">${cat}</option>`);
    }
    function renderizarOrcamentos() {
        listaOrcamentos.innerHTML = '';
        orcamentos.forEach(orc => listaOrcamentos.innerHTML += `<li>${orc.categoria}: R$ ${orc.valor.toFixed(2)}</li>`);
    }
    btnSalvarOrcamento.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = orcCategoriaSelect.value;
        const val = parseFloat(orcValorInput.value);
        if (cat && val > 0) {
            const index = orcamentos.findIndex(o => o.categoria === cat);
            if (index > -1) orcamentos[index].valor = val;
            else orcamentos.push({ categoria: cat, valor: val });
            saveData();
            renderizarOrcamentos();
            orcValorInput.value = '';
        } else { alert('Selecione uma categoria e um valor válido.'); }
    });

    // --- RECORRÊNCIAS ---
    function renderizarRecorrencias() {
        listaRecorrencias.innerHTML = '';
        recorrencias.forEach(rec => listaRecorrencias.innerHTML += `<li>${rec.nome} - R$ ${rec.valor.toFixed(2)} (${rec.tipo}) - Dia ${rec.dia}</li>`);
    }
    btnSalvarRecorrencia.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = recNomeInput.value.trim();
        const valor = parseFloat(recValorInput.value);
        const tipo = recTipoSelect.value;
        const dia = parseInt(recDiaInput.value);
        if (nome && valor > 0 && dia >= 1 && dia <= 31) {
            recorrencias.push({ id: Date.now(), nome, valor, tipo, dia });
            saveData();
            renderizarRecorrencias();
            recNomeInput.value = '';
            recValorInput.value = '';
            recDiaInput.value = '';
        } else { alert('Preencha todos os campos corretamente.'); }
    });

    // --- MODAL DE LANÇAMENTO (AVULSO) ---
    btnNew.onclick = () => { modal.style.display = "flex"; };
    const closeModal = () => { modal.style.display = "none"; };
    closeButton.onclick = closeModal;
    mTipo.addEventListener('change', () => despesaOptions.classList.toggle('hidden', mTipo.value !== 'Despesa'));
    mParcelada.addEventListener('change', () => parcelasGroup.classList.toggle('hidden', !mParcelada.checked));

    btnSalvarLancamento.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = mNome.value.trim();
        const valor = parseFloat(mValor.value);
        if (!nome || !valor) return alert('Nome e Valor são obrigatórios.');

        // Futuramente, a lógica de salvar e atualizar o dashboard virá aqui
        alert('Lançamento salvo com sucesso!');
        saveData(); // Salva o estado atual (mesmo que transações não mude ainda)
        closeModal();
    });
});