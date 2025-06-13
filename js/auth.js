document.addEventListener('DOMContentLoaded', () => {
    // === LÓGICA DE LOGIN (SIMULADO) ===
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-message');

            // !!! AVISO: ISSO NÃO É SEGURO !!!
            // A senha está visível no código-fonte.
            if (user === 'admin' && pass === 'admin123') {
                sessionStorage.setItem('loggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                errorMsg.style.display = 'block';
            }
        });
    }

    // === LÓGICA DE LOGOUT ===
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('loggedIn');
            window.location.href = 'login.html';
        });
    }
    
    // === LÓGICA DE TEMA (DARK/LIGHT MODE) ===
    const themeToggle = document.getElementById('theme-toggle');
    const setTema = (tema) => {
        document.documentElement.setAttribute('data-theme', tema);
        localStorage.setItem('tema_v3', tema);
        if(themeToggle) themeToggle.checked = tema === 'dark';
    };

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            setTema(themeToggle.checked ? 'dark' : 'light');
        });
    }
    
    // Carrega o tema salvo ao iniciar qualquer página
    const temaSalvo = localStorage.getItem('tema_v3') || 'light';
    setTema(temaSalvo);
});