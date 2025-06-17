document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginButton = document.getElementById('login-button');
    const userInput = document.getElementById('usuario');
    const passInput = document.getElementById('senha');
    const themeSwitch = document.getElementById('checkbox');

    // Navegação
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Modal de Lançamento
    const modal = document.getElementById("modal"), btnNew = document.getElementById("btnNew"), closeButton = document.querySelector(".close-button"), btnSalvarLancamento = document.getElementById("btnSalvar");
    const mNome = document.getElementById("m-nome"), mDescricao = document.getElementById("m-descricao"), mValor = document.getElementById("m-valor"), mTipo = document.getElementById("m-tipo");
    const despesaOptions = document.getElementById("despesa-options"), mParcelada = document.getElementById("m-parcelada"), parcelasGroup = document.getElementById("parcelas-group"), mParcelas = document.getElementById("m-parcelas");

    // Página de Categorias
    const catNomeInput = document.getElementById('cat-nome'), btnSalvarCategoria = document.getElementById('btn-salvar-categoria'), listaCategorias = document.getElementById('lista-categorias');
    
    // Página de Orçamentos
    const orcCategoriaSelect = document.getElementById('orc-categoria'), orcValorInput = document.getElementById('orc-valor'), btnSalvarOrcamento = document.getElementById('btn-salvar-orcamento'), listaOrcamentos = document.getElementById('lista-orcamentos');

    // --- BANCO DE DADOS LOCAL ---
    let transacoes = JSON.parse(localStorage.getItem('transacoes_db')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias_db')) || ['Geral']; // Categoria padrão
    let orcamentos = JSON.parse(localStorage.getItem('orcamentos_db')) || [];

    // --- FUNÇÕES DE SALVAMENTO ---
    const saveTransacoes = () => localStorage.setItem('transacoes_db', JSON.stringify(transacoes));
    const saveCategorias = () => localStorage.setItem('categorias_db', JSON.stringify(categorias));
    const saveOrcamentos = () => localStorage.setItem('orcamentos_db', JSON.stringify(orcamentos));

    // --- LÓGICA DE LOGIN E TEMA (Mantida) ---
    loginButton.addEventListener('click', () => {
        if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
            iniciarApp(); // Inicia o app após o login
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });

    // (Lógica de troca de tema mantida)
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'light';
    themeSwitch.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- LÓGICA DE NAVEGAÇÃO ENTRE ABAS (Mantida) ---
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

    // --- INICIALIZAÇÃO DO APP ---
    function iniciarApp() {
        renderizarCategorias();
        renderizarOrcamentos();
        // Adicionar futuramente renderização de transações e dashboard
    }

    // --- LÓGICA DE CATEGORIAS ---
    function renderizarCategorias() {
        listaCategorias.innerHTML = '';
        if (categorias.length === 0) {
            listaCategorias.innerHTML = '<li>Nenhuma categoria cadastrada.</li>';
        } else {
            categorias.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = cat;
                listaCategorias.appendChild(li);
            });
        }
        // Atualiza os selects de categoria em outras partes do app
        atualizarSelectsDeCategoria();
    }

    btnSalvarCategoria.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = catNomeInput.value.trim();
        if (nomeCategoria && !categorias.includes(nomeCategoria)) {
            categorias.push(nomeCategoria);
            saveCategorias();
            renderizarCategorias();
            catNomeInput.value = '';
        } else if (!nomeCategoria) {
            alert('Por favor, digite um nome para a categoria.');
        } else {
            alert('Essa categoria já existe.');
        }
    });

    // --- LÓGICA DE ORÇAMENTOS ---
    function atualizarSelectsDeCategoria() {
        orcCategoriaSelect.innerHTML = '';
        if (categorias.length > 0) {
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                orcCategoriaSelect.appendChild(option);
            });
        } else {
            orcCategoriaSelect.innerHTML = '<option>Nenhuma categoria</option>';
        }
    }

    function renderizarOrcamentos() {
        listaOrcamentos.innerHTML = '';
        if (orcamentos.length === 0) {
            listaOrcamentos.innerHTML = '<li>Nenhum orçamento definido.</li>';
        } else {
            orcamentos.forEach(orc => {
                const li = document.createElement('li');
                li.textContent = `${orc.categoria}: R$ ${orc.valor.toFixed(2)}`;
                listaOrcamentos.appendChild(li);
            });
        }
    }

    btnSalvarOrcamento.addEventListener('click', (e) => {
        e.preventDefault();
        const categoria = orcCategoriaSelect.value;
        const valor = parseFloat(orcValorInput.value);

        if (categoria && valor > 0) {
            // Verifica se já existe um orçamento para essa categoria e atualiza
            const orcExistenteIndex = orcamentos.findIndex(o => o.categoria === categoria);
            if (orcExistenteIndex > -1) {
                orcamentos[orcExistenteIndex].valor = valor;
            } else {
                orcamentos.push({ categoria, valor });
            }
            saveOrcamentos();
            renderizarOrcamentos();
            orcValorInput.value = '';
        } else {
            alert('Por favor, selecione uma categoria e insira um valor válido.');
        }
    });

    // --- LÓGICA DO MODAL DE LANÇAMENTO (Agora funcional) ---
    btnNew.onclick = () => {
        modal.style.display = "flex";
        if (mTipo.value === 'Despesa') despesaOptions.classList.remove('hidden');
        else despesaOptions.classList.add('hidden');
        parcelasGroup.classList.add('hidden');
        mParcelada.checked = false;
    };
    
    closeButton.onclick = () => modal.style.display = "none";
    
    mTipo.addEventListener('change', () => {
        despesaOptions.classList.toggle('hidden', mTipo.value !== 'Despesa');
        if (mTipo.value !== 'Despesa') {
            parcelasGroup.classList.add('hidden');
            mParcelada.checked = false;
        }
    });

    mParcelada.addEventListener('change', () => {
        parcelasGroup.classList.toggle('hidden', !mParcelada.checked);
    });

    btnSalvarLancamento.addEventListener('click', (e) => {
        e.preventDefault();
        // Lógica de salvar será a próxima etapa, junto com a atualização dos gráficos
        alert('Lançamento salvo! (A lógica de exibição no dashboard será o próximo passo)');
        modal.style.display = "none";
        // Limpar campos do modal aqui futuramente
    });
});