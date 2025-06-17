document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Cards do Dashboard
    const mesReceitas = document.getElementById('mes-receitas');
    const mesDespesas = document.getElementById('mes-despesas');
    const mesInvestimentos = document.getElementById('mes-investimentos');
    const mesSaldo = document.getElementById('mes-saldo');
    const saldoDevedor = document.getElementById('saldo-devedor');
    const proxMes = document.getElementById('prox-mes');

    // Modal
    const modal = document.getElementById("modal");
    const btnNew = document.getElementById("btnNew");
    const btnSalvar = document.getElementById("btnSalvar");
    const closeModalBtn = document.querySelector(".close-button");
    const sDesc = document.getElementById("m-desc"), sAmount = document.getElementById("m-amount"),
          sDate = document.getElementById("m-date"), sType = document.getElementById("m-type"),
          sInstallments = document.getElementById("m-installments"), sBudgetCategory = document.getElementById("m-budget");

    // --- NAVEGAÇÃO SPA (Single Page Application) ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');

            // Troca a classe .active nos links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Mostra a página correta e esconde as outras
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`${pageId}-page`).classList.add('active');
        });
    });

    // --- LÓGICA FINANCEIRA ---
    let items = [];
    const getItensBD = () => JSON.parse(localStorage.getItem('db_items_v2')) ?? [];
    const setItensBD = () => localStorage.setItem('db_items_v2', JSON.stringify(items));

    function loadAll() {
        items = getItensBD();
        updateDashboard();
        // Futuramente, chamaremos as funções de gráfico e outras páginas aqui
    }

    function updateDashboard() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        // 1. Visão Geral do Mês
        const transacoesMes = items.filter(item => {
            const dataItem = new Date(item.date + 'T00:00:00');
            return dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual;
        });

        const receitas = transacoesMes.filter(i => i.type === 'Entrada').reduce((acc, i) => acc + i.amount, 0);
        const despesas = transacoesMes.filter(i => i.type === 'Saída').reduce((acc, i) => acc + i.amount, 0);
        const investimentos = transacoesMes.filter(i => i.type === 'Investimento').reduce((acc, i) => acc + i.amount, 0);
        const saldo = receitas - despesas;
        
        mesReceitas.textContent = formatCurrency(receitas);
        mesDespesas.textContent = formatCurrency(despesas);
        mesInvestimentos.textContent = formatCurrency(investimentos);
        mesSaldo.textContent = formatCurrency(saldo);
        mesSaldo.className = saldo < 0 ? 'valor-negativo' : 'valor-positivo';

        // 2. Planejamento Futuro
        const transacoesFuturas = items.filter(item => new Date(item.date + 'T00:00:00') > hoje);
        
        const devedor = transacoesFuturas.filter(i => i.type === 'Saída').reduce((acc, i) => acc + i.amount, 0);
        saldoDevedor.textContent = formatCurrency(devedor);

        const proxMesDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
        const mesSeguinte = proxMesDate.getMonth();
        const anoSeguinte = proxMesDate.getFullYear();
        
        const compromisso = items.filter(item => {
            const dataItem = new Date(item.date + 'T00:00:00');
            return dataItem.getMonth() === mesSeguinte && dataItem.getFullYear() === anoSeguinte && i.type === 'Saída';
        }).reduce((acc, i) => acc + i.amount, 0);
        proxMes.textContent = formatCurrency(compromisso);
    }
    
    // --- LÓGICA DO MODAL ---
    btnNew.onclick = () => { modal.style.display = "flex"; };
    closeModalBtn.onclick = () => { modal.style.display = "none"; };
    
    btnSalvar.onclick = (e) => {
        e.preventDefault();
        // (Lógica de salvar transação, igual à versão anterior)
        if (sDesc.value === '' || sAmount.value === '' || sDate.value === '') {
            return alert("Preencha Descrição, Valor e Data.");
        }
        const amount = parseFloat(sAmount.value);
        const installmentsCount = parseInt(sInstallments.value, 10);
        const isExpense = sType.value === 'Saída';

        if (isExpense && installmentsCount > 1) {
            const installmentAmount = amount / installmentsCount;
            const baseDate = new Date(sDate.value + "T00:00:00");
            for (let i = 1; i <= installmentsCount; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(baseDate.getMonth() + (i - 1));
                items.push({
                    id: Date.now() + i, desc: `${sDesc.value} (${i}/${installmentsCount})`, amount: installmentAmount,
                    type: sType.value, date: installmentDate.toISOString().split('T')[0],
                    category: sBudgetCategory.value, installmentInfo: { current: i, total: installmentsCount }
                });
            }
        } else {
            items.push({
                id: Date.now(), desc: sDesc.value, amount: amount, type: sType.value,
                date: sDate.value, category: sBudgetCategory.value
            });
        }
        setItensBD();
        modal.style.display = "none";
        sDesc.value = ''; sAmount.value = '';
        loadAll();
    };

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- INICIALIZAÇÃO ---
    loadAll();
});