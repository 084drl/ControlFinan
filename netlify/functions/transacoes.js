import { getStore } from "@netlify/blobs";

const sendResponse = (statusCode, body) => {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
};

export default async (req, context) => {
  const store = getStore({ name: "dados-financeiros", siteID: context.site.id });
  const userId = "dados_do_casal";

  try {
    switch (req.method) {
      case "GET": {
        const dados = await store.get(userId, { type: "json" });
        return sendResponse(200, dados || {}); // Retorna os dados ou um objeto vazio se não existir
      }
      
      case "POST": {
        const novosDados = await req.json();
        if (!novosDados) {
          return sendResponse(400, { message: "Nenhum dado recebido para salvar." });
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