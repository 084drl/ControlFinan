// Elementos do DOM
const modal = document.getElementById("modal");
const btnNew = document.getElementById("btnNew");
const btnSalvar = document.getElementById("btnSalvar");
const closeModal = document.querySelector(".close-button");

const sDesc = document.getElementById("m-desc");
const sAmount = document.getElementById("m-amount");
const sDate = document.getElementById("m-date");
const sType = document.getElementById("m-type");
const sInstallments = document.getElementById("m-installments");
const sInstallmentsGroup = document.getElementById("installments-group");
const sBudgetCategory = document.getElementById("m-budget");

const incomesDisplay = document.getElementById("incomes");
const expensesDisplay = document.getElementById("expenses");
const investmentsDisplay = document.getElementById("investments");
const totalDisplay = document.getElementById("total");
const tbody = document.querySelector("tbody");

const installmentsProjectionDiv = document.getElementById("installments-projection");
const budgetsOverviewDiv = document.getElementById("budgets-overview");

// --- BANCO DE DADOS E ORÇAMENTOS ---
let items = [];
const budgets = [
    { name: 'Alimentação', limit: 1000 },
    { name: 'Transporte', limit: 300 },
    { name: 'Moradia', limit: 1500 },
    { name: 'Lazer', limit: 400 },
    { name: 'Saúde', limit: 500 },
    { name: 'Diarista', limit: 400 }
];

// Funções de persistência com LocalStorage
const getItensBD = () => JSON.parse(localStorage.getItem('db_items')) ?? [];
const setItensBD = () => localStorage.setItem('db_items', JSON.stringify(items));

// --- LÓGICA PRINCIPAL DE CARREGAMENTO ---
function loadAll() {
    items = getItensBD();
    updateDashboard();
    renderTransactions();
    updateInstallmentProjection();
    updateBudgets();
    populateBudgetOptions();
}

// --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI) ---

// 1. Atualiza os cards do topo (Dashboard)
function updateDashboard() {
    const incomes = items
        .filter(item => item.type === 'Entrada')
        .reduce((acc, item) => acc + item.amount, 0);

    const expenses = items
        .filter(item => item.type === 'Saída')
        .reduce((acc, item) => acc + item.amount, 0);
    
    const investments = items
        .filter(item => item.type === 'Investimento')
        .reduce((acc, item) => acc + item.amount, 0);

    const total = incomes - expenses;

    incomesDisplay.textContent = formatCurrency(incomes);
    expensesDisplay.textContent = formatCurrency(expenses);
    investmentsDisplay.textContent = formatCurrency(investments);
    totalDisplay.textContent = formatCurrency(total);
    
    // Mudar cor do saldo
    totalDisplay.parentElement.classList.toggle('expense-value', total < 0);
    totalDisplay.parentElement.classList.toggle('income-value', total > 0);
}

// 2. Renderiza a tabela de transações
function renderTransactions() {
    tbody.innerHTML = '';
    // Ordena os itens por data, do mais recente para o mais antigo
    const sortedItems = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedItems.forEach((item, index) => {
        // Encontra o índice original para a função de deletar
        const originalIndex = items.findIndex(originalItem => originalItem.id === item.id);
        tbody.innerHTML += `
            <tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.desc}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td class="columnType">${item.type}</td>
                <td class="columnAction">
                    <button onclick="deleteItem(${originalIndex})"><i class='fa-solid fa-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

// 3. Atualiza a projeção de parcelas futuras
function updateInstallmentProjection() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar só a data

    const futureInstallments = items.filter(item => 
        item.type === 'Saída' && new Date(item.date) >= today && item.installmentInfo
    );

    if (futureInstallments.length === 0) {
        installmentsProjectionDiv.innerHTML = '<p>Nenhuma despesa parcelada futura.</p>';
        return;
    }

    const projectionByMonth = {};
    futureInstallments.forEach(item => {
        const monthYear = new Date(item.date).toLocaleString('pt-br', { month: 'long', year: 'numeric' });
        if (!projectionByMonth[monthYear]) {
            projectionByMonth[monthYear] = 0;
        }
        projectionByMonth[monthYear] += item.amount;
    });
    
    let html = '<ul>';
    for (const month in projectionByMonth) {
        html += `<li><strong>${capitalize(month)}:</strong> ${formatCurrency(projectionByMonth[month])}</li>`;
    }
    html += '</ul>';
    
    installmentsProjectionDiv.innerHTML = html;
}

// 4. Atualiza a visão geral dos orçamentos
function updateBudgets() {
    budgetsOverviewDiv.innerHTML = '';

    if(budgets.length === 0) {
        budgetsOverviewDiv.innerHTML = '<p>Nenhum orçamento configurado.</p>';
        return;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    budgets.forEach(budget => {
        const spent = items
            .filter(item => {
                const itemDate = new Date(item.date);
                return item.budgetCategory === budget.name && 
                       itemDate.getMonth() === currentMonth && 
                       itemDate.getFullYear() === currentYear &&
                       item.type === 'Saída';
            })
            .reduce((acc, item) => acc + item.amount, 0);
        
        const percentage = (spent / budget.limit) * 100;
        
        budgetsOverviewDiv.innerHTML += `
            <div class="budget-item">
                <p>
                    <span><strong>${budget.name}</strong></span>
                    <span>${formatCurrency(spent)} / ${formatCurrency(budget.limit)}</span>
                </p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${Math.min(percentage, 100)}%; background-color: ${percentage > 100 ? '#dc3545' : '#007bff'};">
                        ${percentage.toFixed(0)}%
                    </div>
                </div>
            </div>
        `;
    });
}

// --- FUNÇÕES DE AÇÃO (CRUD) ---

// Deletar um item
function deleteItem(index) {
    items.splice(index, 1);
    setItensBD();
    loadAll();
}

// Salvar um novo item (com lógica de parcelas)
btnSalvar.onclick = (e) => {
    e.preventDefault();

    if (sDesc.value === '' || sAmount.value === '' || sDate.value === '') {
        return alert("Por favor, preencha todos os campos obrigatórios (Descrição, Valor e Data).");
    }

    const amount = parseFloat(sAmount.value);
    const installmentsCount = parseInt(sInstallments.value, 10);
    const isExpense = sType.value === 'Saída';

    if (isExpense && installmentsCount > 1) {
        const installmentAmount = amount / installmentsCount;
        const baseDate = new Date(sDate.value + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso

        for (let i = 1; i <= installmentsCount; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + (i - 1));
            
            items.push({
                id: Date.now() + i, // ID único para cada parcela
                desc: `${sDesc.value} (${i}/${installmentsCount})`,
                amount: installmentAmount,
                type: sType.value,
                date: installmentDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
                budgetCategory: sBudgetCategory.value,
                installmentInfo: {
                    current: i,
                    total: installmentsCount
                }
            });
        }
    } else {
        items.push({
            id: Date.now(), // ID único
            desc: sDesc.value,
            amount: amount,
            type: sType.value,
            date: sDate.value,
            budgetCategory: sBudgetCategory.value
        });
    }

    setItensBD();
    modal.style.display = "none";
    clearModalFields();
    loadAll();
};

// --- FUNÇÕES AUXILIARES ---

// Formata número para moeda (R$)
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata data para dd/mm/aaaa
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Deixa a primeira letra maiúscula
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Limpa campos do modal
function clearModalFields() {
    sDesc.value = '';
    sAmount.value = '';
    sDate.value = new Date().toISOString().split('T')[0]; // Data de hoje
    sType.value = 'Saída';
    sInstallments.value = '1';
    sBudgetCategory.value = 'Nenhum';
    sInstallmentsGroup.style.display = 'block'; // Mostra por padrão ao limpar
}

// Preenche as opções de categoria no modal
function populateBudgetOptions() {
    sBudgetCategory.innerHTML = '<option value="Nenhum">Nenhum</option>';
    budgets.forEach(budget => {
        sBudgetCategory.innerHTML += `<option value="${budget.name}">${budget.name}</option>`;
    });
}

// --- EVENT LISTENERS ---

// Abrir e fechar modal
btnNew.onclick = () => {
    clearModalFields();
    modal.style.display = "flex";
};

closeModal.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Mostrar/Esconder campo de parcelas
sType.onchange = () => {
    sInstallmentsGroup.style.display = sType.value === 'Saída' ? 'block' : 'none';
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', loadAll);