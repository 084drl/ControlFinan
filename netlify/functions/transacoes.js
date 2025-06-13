import { getStore } from "@netlify/blobs";

const sendResponse = (statusCode, body) => {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
};

// MUDANÇA CRÍTICA: Adicionamos 'context' como segundo parâmetro
export default async (req, context) => {
  // MUDANÇA CRÍTICA: Passando o 'context' para getStore
  const store = getStore({ name: "dados-financeiros", siteID: context.site.id });
  
  const userId = "dados_do_casal";

  try {
    switch (req.method) {
      case "GET": {
        let dados = await store.get(userId, { type: "json" });

        if (!dados) {
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