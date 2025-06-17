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

    // Modal de Lançamento (Novos e Antigos)
    const modal = document.getElementById("modal");
    const btnNew = document.getElementById("btnNew");
    const closeButton = document.querySelector(".close-button");
    const sTipo = document.getElementById("m-tipo");
    const despesaOptions = document.getElementById("despesa-options");
    const mParcelada = document.getElementById("m-parcelada");
    const parcelasGroup = document.getElementById("parcelas-group");
    const btnSalvarLancamento = document.getElementById("btnSalvar");

    // --- LÓGICA DE LOGIN ---
    loginButton.addEventListener('click', () => {
        if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });

    // --- LÓGICA DE TEMA ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
            themeSwitch.checked = true;
        } else {
            themeSwitch.checked = false;
        }
    } else {
        // Se não houver tema salvo, define o padrão (escuro)
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = false;
    }

    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // --- LÓGICA DE NAVEGAÇÃO ENTRE ABAS ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            pages.forEach(p => p.classList.remove('active'));
            // Adiciona a classe active à página correta
            const activePage = document.getElementById(`${pageId}-page`);
            if (activePage) {
                activePage.classList.add('active');
            }
        });
    });

    // --- LÓGICA INTERATIVA DO MODAL DE LANÇAMENTO ---
    btnNew.onclick = () => {
        modal.style.display = "flex";
        // Garante que o modal comece com as opções certas visíveis para "Despesa"
        if (sTipo.value === 'Despesa') {
            despesaOptions.classList.remove('hidden');
        } else {
            despesaOptions.classList.add('hidden');
        }
        parcelasGroup.classList.add('hidden'); // Parcelas sempre começam escondidas
        mParcelada.checked = false; // E desmarcadas
    };
    
    // Função para fechar o modal
    const closeModal = () => {
        modal.style.display = "none";
    }
    
    closeButton.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };
    
    sTipo.addEventListener('change', () => {
        if (sTipo.value === 'Despesa') {
            despesaOptions.classList.remove('hidden');
        } else {
            despesaOptions.classList.add('hidden');
            parcelasGroup.classList.add('hidden');
            mParcelada.checked = false;
        }
    });

    mParcelada.addEventListener('change', () => {
        if (mParcelada.checked) {
            parcelasGroup.classList.remove('hidden');
        } else {
            parcelasGroup.classList.add('hidden');
        }
    });

    // --- AÇÕES DOS BOTÕES (AINDA SEM SALVAR) ---
    btnSalvarLancamento.onclick = (e) => {
        e.preventDefault();
        alert('Lógica de salvar o lançamento será implementada na próxima etapa!');
        closeModal();
    };

    document.getElementById('btn-salvar-categoria').onclick = (e) => {
        e.preventDefault();
        alert('Lógica de salvar categoria será implementada na próxima etapa!');
    };

    document.getElementById('btn-salvar-orcamento').onclick = (e) => {
        e.preventDefault();
        alert('Lógica de salvar orçamento será implementada na próxima etapa!');
    };
});