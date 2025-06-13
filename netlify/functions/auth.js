import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes } from 'crypto';

// Função para criar um hash seguro da senha
const hashPassword = (password, salt) => {
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return hash.toString('hex');
};

const sendResponse = (statusCode, body) => new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
    if (req.method !== 'POST') return sendResponse(405, { message: 'Método não permitido.' });

    const store = getStore('auth-data');
    const { action, username, password, secret, newPassword } = await req.json();
    if (!username) return sendResponse(400, { message: 'Nome de usuário é obrigatório.' });

    try {
        let userData = await store.get(username, { type: 'json' });

        // Se o usuário não existir, cria um com dados padrão na primeira vez
        if (!userData && action === 'login') {
            const salt = randomBytes(16).toString('hex');
            const defaultPasswordHash = hashPassword('admin123', salt);
            const secretSalt = randomBytes(16).toString('hex');
            const secretHash = hashPassword('azul', secretSalt); // Resposta secreta padrão

            userData = {
                salt, passwordHash: defaultPasswordHash,
                secretQuestion: 'Qual sua cor favorita?',
                secretSalt, secretHash
            };
            await store.setJSON(username, userData);
        } else if (!userData) {
            return sendResponse(404, { success: false, message: 'Usuário não encontrado.' });
        }

        switch (action) {
            case 'login':
                if (userData.passwordHash === hashPassword(password, userData.salt)) {
                    return sendResponse(200, { success: true, message: 'Login bem-sucedido.' });
                }
                return sendResponse(401, { success: false, message: 'Senha inválida.' });

            case 'get_secret_question':
                return sendResponse(200, { success: true, question: userData.secretQuestion });

            case 'verify_secret_answer':
                if (userData.secretHash === hashPassword(secret.toLowerCase().trim(), userData.secretSalt)) {
                    const resetToken = randomBytes(32).toString('hex');
                    const tokenExpiry = Date.now() + 10 * 60 * 1000; // Válido por 10 minutos
                    await store.setJSON(username, { ...userData, resetToken, tokenExpiry });
                    return sendResponse(200, { success: true, token: resetToken });
                }
                return sendResponse(401, { success: false, message: 'Resposta secreta incorreta.' });

            case 'reset_password':
                const token = req.headers.get('x-reset-token');
                if (!token || token !== userData.resetToken || Date.now() > userData.tokenExpiry) {
                    return sendResponse(401, { success: false, message: 'Token de reset inválido ou expirado.' });
                }
                const newSalt = randomBytes(16).toString('hex');
                const newPasswordHash = hashPassword(newPassword, newSalt);
                await store.setJSON(username, { ...userData, salt: newSalt, passwordHash: newPasswordHash, resetToken: null, tokenExpiry: null });
                return sendResponse(200, { success: true, message: 'Senha alterada com sucesso!' });

            default:
                return sendResponse(400, { message: 'Ação desconhecida.' });
        }
    } catch (error) {
        console.error("Erro na função de autenticação:", error);
        return sendResponse(500, { message: 'Erro interno do servidor.' });
    }
};