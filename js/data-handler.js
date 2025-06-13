// js/data-handler.js

// Este objeto vai guardar todos os dados da aplicação
const appData = {
    transacoes: [],
    comprasParceladas: [],
    categorias: [],
    orcamentos: []
};

// Função para buscar TODOS os dados do backend
async function carregarDadosDoBackend() {
    try {
        const response = await fetch('/.netlify/functions/transacoes');
        if (!response.ok) throw new Error('Falha na resposta do servidor.');
        const dados = await response.json();
        
        // Atualiza o objeto global com os dados do backend ou valores padrão
        appData.transacoes = dados.transacoes || [];
        appData.comprasParceladas = dados.comprasParceladas || [];
        appData.categorias = dados.categorias || [{ id: Date.now(), nome: 'Salário', tipo: 'receita' }];
        appData.orcamentos = dados.orcamentos || [];

        return true;
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return false;
    }
}

// Função para salvar TODOS os dados no backend
async function salvarDadosNoBackend() {
    try {
        await fetch('/.netlify/functions/transacoes', {
            method: 'POST',
            body: JSON.stringify(appData)
        });
    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        alert('Falha ao salvar. Verifique sua conexão.');
    }
}