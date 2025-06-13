document.addEventListener('DOMContentLoaded', () => {
    const errorMsgEl = document.getElementById('error-message');

    const showError = (message) => {
        if (errorMsgEl) {
            errorMsgEl.textContent = message;
            errorMsgEl.style.display = 'block';
        }
    };
    const hideError = () => { if (errorMsgEl) errorMsgEl.style.display = 'none'; };

    // --- LÓGICA DA TELA DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/.netlify/functions/auth', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', username, password }),
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    sessionStorage.setItem('loggedIn', 'true');
                    window.location.href = 'index.html';
                } else {
                    showError(result.message || 'Usuário ou senha inválidos.');
                }
            } catch (error) { showError('Erro de conexão. Tente novamente.'); }
        });
    }
    
    // --- LÓGICA DA TELA DE RECUPERAÇÃO ---
    const formStep1 = document.getElementById('form-step1');
    const formStep2 = document.getElementById('form-step2');
    if (formStep1) {
        formStep1.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            const username = document.getElementById('username').value;
            try {
                const response = await fetch('/.netlify/functions/auth', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'get_secret_question', username }),
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    sessionStorage.setItem('username_for_reset', username);
                    document.getElementById('pergunta-secreta').textContent = result.question;
                    formStep1.style.display = 'none';
                    formStep2.style.display = 'block';
                    document.getElementById('form-title').textContent = 'Pergunta de Segurança';
                } else {
                    showError(result.message || 'Usuário não encontrado.');
                }
            } catch (error) { showError('Erro de conexão.'); }
        });

        formStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            const username = sessionStorage.getItem('username_for_reset');
            const secret = document.getElementById('resposta').value;
            try {
                const response = await fetch('/.netlify/functions/auth', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'verify_secret_answer', username, secret }),
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    sessionStorage.setItem('reset_token', result.token);
                    window.location.href = 'resetar.html';
                } else {
                    showError(result.message || 'Resposta incorreta.');
                }
            } catch (error) { showError('Erro de conexão.'); }
        });
    }

    // --- LÓGICA DA TELA DE RESET ---
    const formReset = document.getElementById('form-reset');
    if (formReset) {
        const username = sessionStorage.getItem('username_for_reset');
        const token = sessionStorage.getItem('reset_token');
        if (!username || !token) {
            showError('Sessão de reset inválida. Por favor, comece novamente.');
            formReset.querySelector('button').disabled = true;
        }

        formReset.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (newPassword.length < 6) { showError('A senha deve ter no mínimo 6 caracteres.'); return; }
            if (newPassword !== confirmPassword) { showError('As senhas não coincidem.'); return; }

            try {
                const response = await fetch('/.netlify/functions/auth', {
                    method: 'POST',
                    headers: { 'x-reset-token': token },
                    body: JSON.stringify({ action: 'reset_password', username, newPassword }),
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert('Senha alterada com sucesso! Você será redirecionado para o login.');
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                } else {
                    showError(result.message || 'Não foi possível resetar a senha.');
                }
            } catch (error) { showError('Erro de conexão.'); }
        });
    }
    
    // --- LÓGICA DE LOGOUT E TEMA (para páginas internas) ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) { logoutBtn.addEventListener('click', () => { sessionStorage.clear(); window.location.href = 'login.html'; }); }
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const setTema = (tema) => { document.documentElement.setAttribute('data-theme', tema); localStorage.setItem('tema', tema); themeToggle.checked = tema === 'dark'; };
        themeToggle.addEventListener('change', () => setTema(themeToggle.checked ? 'dark' : 'light'));
        setTema(localStorage.getItem('tema') || 'light');
    }
});