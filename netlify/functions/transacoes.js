import { getStore } from "@netlify/blobs";

const sendResponse = (statusCode, body) => {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
};

export default async (req) => {
  // 'dados-financeiros' é o nome do nosso "banco de dados" de transações
  const store = getStore("dados-financeiros");
  
  // Em um sistema real, o userId viria de um login seguro.
  // Por enquanto, todos os dados são salvos sob uma única chave.
  const userId = "dados_do_casal";

  try {
    switch (req.method) {
      case "GET": {
        let dados = await store.get(userId, { type: "json" });

        // --- CORREÇÃO PRINCIPAL APLICADA AQUI ---
        // Se não houver dados salvos para este usuário (primeiro acesso),
        // criamos e retornamos um conjunto de dados padrão.
        if (!dados) {
          console.log(`[DADOS] Nenhum dado encontrado para '${userId}'. Criando dados padrão.`);
          dados = {
            transacoes: [],
            comprasParceladas: [],
            categorias: [
              { id: 1, nome: 'Salário', tipo: 'receita' },
              { id: 2, nome: 'Moradia', tipo: 'despesa' },
              { id: 3, nome: 'Alimentação', tipo: 'despesa' }
            ],
            orcamentos: []
          };
          // Salva os dados padrão para que existam na próxima vez
          await store.setJSON(userId, dados);
        }

        return sendResponse(200, dados);
      }
      
      case "POST": {
        const novosDados = await req.json();
        if (!novosDados) {
          return sendResponse(400, { message: "Nenhum dado recebido." });
        }
        await store.setJSON(userId, novosDados);
        return sendResponse(200, { message: "Dados salvos com sucesso!" });
      }

      default:
        return sendResponse(405, { message: "Método não permitido." });
    }
  } catch (error) {
    console.error("Erro na função de transacoes:", error);
    return sendResponse(500, { message: `Erro interno do servidor: ${error.message}` });
  }
};