document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginButton = document.getElementById('login-button');
    const userInput = document.getElementById('usuario');
    const passInput = document.getElementById('senha');
    
    // Modal (elementos originais)
    const modal = document.getElementById("modal");
    const btnNew = document.getElementById("btnNew");
    
    // --- LÓGICA DE LOGIN (Original) ---
    loginButton.addEventListener('click', () => {
        if (userInput.value.trim() === 'admin' && passInput.value.trim() === '1234') {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });

    // --- LÓGICA DO MODAL (Original - Apenas para abrir e fechar) ---
    // Você vai adicionar a lógica de salvar depois
    if (btnNew) {
        btnNew.onclick = () => {
            modal.style.display = "flex";
        };
    }
    
    // --- NOVA LÓGICA PARA O SELETOR DE TEMA ---
    const themeSwitch = document.getElementById('checkbox');
    
    // 1. Verifica se já existe um tema salvo no localStorage
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
            themeSwitch.checked = true;
        }
    }

    // 2. Adiciona o listener para a troca de tema
    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light'); // Salva a preferência
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark'); // Salva a preferência
        }
    });
});