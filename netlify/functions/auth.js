import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes } from 'crypto';

const hashPassword = (password, salt) => {
    return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

const sendResponse = (statusCode, body) => new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });

// MUDANÇA CRÍTICA: Adicionamos 'context' como segundo parâmetro
export default async (req, context) => {
    if (req.method !== 'POST') return sendResponse(405, { message: 'Método não permitido.' });

    // MUDANÇA CRÍTICA: Passando o 'context' para getStore
    const store = getStore({ name: "auth-data", siteID: context.site.id });
    
    const { action, username, password, secret, newPassword } = await req.json();

    if (!username) return sendResponse(400, { message: 'Nome de usuário é obrigatório.' });

    try {
        let userData = await store.get(username, { type: 'json' });

        if (!userData) {
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
            } else {
                return sendResponse(404, { success: false, message: 'Usuário não encontrado.' });
            }
        }

        // O resto do switch case permanece o mesmo...
        switch (action) {
            case 'login':
                if (userData.passwordHash === hashPassword(password, userData.salt)) {
                    return sendResponse(200, { success: true, message: 'Login bem-sucedido.' });
                }
                return sendResponse(401, { success: false, message: 'Senha inválida.' });
            // ... (outros cases)
            default:
                 return sendResponse(400, { message: 'Ação desconhecida.' });
        }
    } catch (error) {
        console.error("Erro na função de autenticação:", error);
        return sendResponse(500, { message: 'Erro interno do servidor.' });
    }
};