import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes } from 'crypto';

// Função para criar um hash seguro da senha
const hashPassword = (password, salt) => {
    try {
        const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512');
        return hash.toString('hex');
    } catch (e) {
        console.error("Erro ao gerar hash da senha:", e);
        return null;
    }
};

const sendResponse = (statusCode, body) => new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
    if (req.method !== 'POST') return sendResponse(405, { message: 'Método não permitido.' });

    // MUDANÇA CRÍTICA: Usando um novo nome para o "banco de dados" para forçar um recomeço.
    const store = getStore('auth-data-v2');
    const { action, username, password, secret, newPassword } = await req.json();

    console.log(`[AUTH] Recebida ação: ${action} para usuário: ${username}`);

    if (!username) return sendResponse(400, { message: 'Nome de usuário é obrigatório.' });

    try {
        let userData = await store.get(username, { type: 'json' });

        // Se o usuário não existe, cria um com dados padrão.
        if (!userData) {
            console.log(`[AUTH] Usuário '${username}' não encontrado. Criando novo usuário padrão.`);
            if (username === 'admin') {
                const salt = randomBytes(16).toString('hex');
                const defaultPasswordHash = hashPassword('admin123', salt);
                const secretSalt = randomBytes(16).toString('hex');
                const secretHash = hashPassword('azul', secretSalt);

                userData = {
                    salt, passwordHash: defaultPasswordHash,
                    secretQuestion: 'Qual sua cor favorita?',
                    secretSalt, secretHash
                };
                await store.setJSON(username, userData);
                console.log(`[AUTH] Usuário '${username}' criado com sucesso.`);
            } else {
                console.log(`[AUTH] Usuário '${username}' não é 'admin' e não existe.`);
                return sendResponse(404, { success: false, message: 'Usuário não encontrado.' });
            }
        } else {
            console.log(`[AUTH] Usuário '${username}' encontrado no banco de dados.`);
        }

        switch (action) {
            case 'login':
                const attemptHash = hashPassword(password, userData.salt);
                console.log(`[AUTH] Hash Armazenado: ${userData.passwordHash}`);
                console.log(`[AUTH] Hash da Tentativa: ${attemptHash}`);

                if (userData.passwordHash === attemptHash) {
                    console.log(`[AUTH] Login bem-sucedido para '${username}'.`);
                    return sendResponse(200, { success: true, message: 'Login bem-sucedido.' });
                }
                console.log(`[AUTH] Senha inválida para '${username}'.`);
                return sendResponse(401, { success: false, message: 'Senha inválida.' });

            // O resto das ações permanece o mesmo...
            case 'get_secret_question':
                return sendResponse(200, { success: true, question: userData.secretQuestion });
            
            // ... (código para verify_secret_answer e reset_password) ...

            default:
                return sendResponse(400, { message: 'Ação desconhecida.' });
        }
    } catch (error) {
        console.error("[AUTH] Erro catastrófico:", error);
        return sendResponse(500, { message: 'Erro interno do servidor.' });
    }
};