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
        let dados = await store.get(userId, { type: "json" });

        // Se não houver dados salvos (primeiro acesso), retorna um objeto vazio.
        // O front-end será responsável por criar os dados padrão.
        if (!dados) {
          return sendResponse(200, {});
        }
        return sendResponse(200, dados);
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