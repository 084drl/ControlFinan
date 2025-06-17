document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginButton = document.getElementById('login-button');
    const userInput = document.getElementById('usuario');
    const passInput = document.getElementById('senha');
    const themeSwitch = document.getElementById('checkbox');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const modal = document.getElementById("modal"), btnNew = document.getElementById("btnNew"), closeButton = document.querySelector(".close-button"), btnSalvarLancamento = document.getElementById("btnSalvar");
    const mTipo = document.getElementById("m-tipo"), despesaOptions = document.getElementById("despesa-options"), mParcelada = document.getElementById("m-parcelada"), parcelasGroup = document.getElementById("parcelas-group");
    const btnSalvarCategoria = document.getElementById('btn-salvar-categoria');
    const btnSalvarOrcamento = document.getElementById('btn-salvar-orcamento');
    const btnSalvarRecorrencia = document.getElementById('btn-salvar-recorrencia'); // Novo elemento

    // --- LÓGICA DE LOGIN E TEMA ---
    loginButton.addEventListener('click', () => {
        if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'light';
    themeSwitch.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- LÓGICA DE NAVEGAÇÃO ENTRE ABAS ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            const activePage = document.getElementById(`${pageId}-page`);
            if (activePage) activePage.classList.add('active');
        });
    });

    // --- LÓGICA INTERATIVA DO MODAL DE LANÇAMENTO ---
    btnNew.onclick = () => { modal.style.display = "flex"; };
    const closeModal = () => { modal.style.display = "none"; }
    closeButton.onclick = closeModal;
    window.onclick = (event) => { if (event.target == modal) closeModal(); };
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

    // --- AÇÕES DOS BOTÕES (PLACEHOLDERS) ---
    btnSalvarLancamento.onclick = (e) => { e.preventDefault(); alert('Lógica de salvar o lançamento será implementada na próxima etapa!'); closeModal(); };
    btnSalvarCategoria.onclick = (e) => { e.preventDefault(); alert('Lógica de salvar categoria será implementada na próxima etapa!'); };
    btnSalvarOrcamento.onclick = (e) => { e.preventDefault(); alert('Lógica de salvar orçamento será implementada na próxima etapa!'); };
    btnSalvarRecorrencia.onclick = (e) => { e.preventDefault(); alert('Lógica de salvar recorrência será implementada na próxima etapa!'); };
});