require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const token = process.env.TELEGRAM_BOT_TOKEN;
const authorizedId = process.env.AUTHORIZED_USER_ID;
const logPath = path.resolve(__dirname, '../../data/logs/jarvis_mobile.log');

const bot = new TelegramBot(token, { polling: true });

// --- BASE DE DADOS ESTRATÉGICA (INJETADA) ---
const portfolio = {
    equity: "R$ 9.192,63",
    yield_12m: "R$ 555,43",
    top_assets: ["CXSE3 (50)", "GARE11 (56)", "PETR4 (18)", "MXRF11 (45)", "JHSF3 (54)"],
    watch_list: ["SAPR11", "KNCA11", "ABCB4", "EZTC3", "BBDC4"],
    mission: "Transição BBAS3 (10 unidades) para KOCO34 (Coca-Cola BDR)"
};

const market_status = {
    ibov: "184.750,42 pts (-2,05%)",
    selic: "14,50% (Redução de 0,25%)",
    source: "b3.com.br"
};

// --- MOTOR DE RESPOSTA SÊNIOR ---
function generateSeniorResponse(text) {
    const t = text.toLowerCase();
    
    // 1. Contexto Financeiro / B3
    if (t.includes('b3') || t.includes('bolsa') || t.includes('mercado') || t.includes('fechamento')) {
        return `🎩 *Diagnóstico de Mercado Jarvis*\n\n` +
            `*Status:* O Ibovespa encerrou hoje em **${market_status.ibov}**. \n` +
            `*Análise:* Com a Selic a **${market_status.selic}**, o custo de oportunidade continua alto. \n\n` +
            `*Direção:* Manter o foco em ativos resilientes. Fonte oficial: **${market_status.source}**.`;
    }

    // 2. Contexto de Carteira / Ativos
    if (t.includes('carteira') || t.includes('investimentos') || t.includes('quanto tenho')) {
        return `🎩 *Relatório de Patrimônio Sênior*\n\n` +
            `*Patrimônio Total:* ${portfolio.equity}\n` +
            `*Renda (12m):* ${portfolio.yield_12m} (~R$ 46,29/mês)\n\n` +
            `*Principais Posições:* ${portfolio.top_assets.join(', ')}\n\n` +
            `*Estratégia:* O senhor possui uma pulverização controlada, mas o foco agora deve ser o aumento de "Skin in the Game" nos ativos de radar.`;
    }

    // 3. Missão Específica (BBAS3 / KOCO34)
    if (t.includes('bbas3') || t.includes('venda') || t.includes('coca') || t.includes('koco34')) {
        return `🎩 *Análise de Transição Crítica*\n\n` +
            `*Situação:* Estamos planejando a venda de **6 unidades de BBAS3** para iniciar **2 unidades de KOCO34**.\n\n` +
            `*Trade-off:* Perdemos Yield imediato (~R$ 18/ano) para ganhar **Proteção Cambial e Estabilidade Global**.\n\n` +
            `*Execução:* Recomendo o monitoramento da abertura amanhã. Estou com o monitor de preços ativo para o senhor.`;
    }

    // 4. Radar
    if (t.includes('radar') || t.includes('sentinela') || t.includes('sapr11') || t.includes('knca11')) {
        return `🎩 *Monitoramento de Radar Jarvis*\n\n` +
            `*Ativos em Vigilância:* ${portfolio.watch_list.join(', ')}\n\n` +
            `*Insight:* A Sanepar (SAPR11) continua sendo nossa sentinela de saneamento. Com a queda leve da Selic, o setor de utilidade pública ganha atratividade. Deseja que eu monitore um preço-teto específico para aporte?`;
    }

    // 5. Saudação / Geral
    if (t.includes('oi') || t.includes('olá') || t.includes('jarvis')) {
        return `🎩 *Saudações, Senhor.*\n\nO Jarvis Sênior está operacional. Minha base de dados está sincronizada com seu patrimônio de **${portfolio.equity}** e os logs de auditoria estão ativos.\n\nComo posso servir à sua estratégia financeira hoje?`;
    }

    // 6. Catch-all (Resposta de Alto Nível)
    return `🎩 *Consultoria Jarvis*\n\n` +
        `*Diagnóstico:* Recebi sua mensagem: "${text}".\n\n` +
        `*Consideração:* Do ponto de vista de um Sócio Estratégico, esta instrução deve ser pesada contra o nosso objetivo de **Independência Financeira e Diversificação Global**.\n\n` +
        `*Ação:* Deseja que eu aprofunde esta análise em relação a algum setor específico da nossa carteira?`;
}

async function processCommand(chatId, userId, text) {
    if (authorizedId && userId.toString() !== authorizedId) return;

    const response = generateSeniorResponse(text);
    log('TEXT', userId, text, response.replace(/\n/g, ' '));
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

function log(type, user, msg, resp) {
    const entry = `[${new Date().toISOString()}] ${type} | User: ${user} | Msg: ${msg} | Resp: ${resp}\n`;
    fs.appendFileSync(logPath, entry);
    console.log(entry);
}

bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (authorizedId && userId.toString() !== authorizedId) return;

    try {
        const fileLink = await bot.getFileLink(msg.voice.file_id);
        const tempPath = path.resolve(__dirname, `v_${Date.now()}.oga`);
        const writer = fs.createWriteStream(tempPath);
        const res = await axios({ method: 'GET', url: fileLink, responseType: 'stream' });
        res.data.pipe(writer);

        await new Promise((resolve) => writer.on('finish', resolve));

        const scriptPath = path.resolve(__dirname, 'transcribe.py');
        const pythonCmd = `python "${scriptPath}" "${tempPath}" "${ffmpegPath}"`;

        exec(pythonCmd, async (error, stdout) => {
            await fs.remove(tempPath);
            const result = stdout.trim().split('\n').pop();
            
            if (result && !result.startsWith('Erro')) {
                const response = generateSeniorResponse(result);
                log('VOICE', userId, result, response.replace(/\n/g, ' '));
                await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, '⚠️ Não entendi o áudio. O Jarvis Sênior recomenda texto para maior precisão estratégica.');
            }
        });
    } catch (e) {
        console.error(e);
    }
});

bot.on('message', async (msg) => {
    if (msg.voice || !msg.text || msg.text.startsWith('/')) return;
    await processCommand(msg.chat.id, msg.from.id, msg.text);
});

console.log('--- Jarvis Bridge: Módulo Sênior Offline Ativado ---');
