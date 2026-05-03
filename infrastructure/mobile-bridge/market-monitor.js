require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.AUTHORIZED_USER_ID;
const bot = new TelegramBot(token);

const targets = [
    { symbol: 'BBAS3.SA', name: 'Banco do Brasil', targetPrice: 22.62, type: 'Venda' },
    { symbol: 'COCA34.SA', name: 'Coca-Cola BDR', targetPrice: 65.99, type: 'Compra' }
];

async function getPrice(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const res = await axios.get(url);
    return res.data.chart.result[0].meta.regularMarketPrice;
}

async function checkPrices() {
    try {
        console.log("Monitorando...");
        for (const asset of targets) {
            const currentPrice = await getPrice(asset.symbol);
            console.log(`${asset.name}: R$ ${currentPrice}`);
            
            if (Math.abs(currentPrice - asset.targetPrice) / asset.targetPrice <= 0.02) {
                await bot.sendMessage(chatId, `🔔 *Alerta Jarvis*\n*${asset.name}* no alvo!\n💰 Preço: R$ ${currentPrice.toFixed(2)}\n🎯 Alvo: R$ ${asset.targetPrice.toFixed(2)}`, { parse_mode: 'Markdown' });
            }
        }
    } catch (e) {
        console.error('Erro Monitor:', e.message);
    }
}

checkPrices().then(() => {
    bot.sendMessage(chatId, "🎩 *Monitor Jarvis Ativado*\n\nEstou vigiando BBAS3 e COCA34 para o senhor.", { parse_mode: 'Markdown' });
});

setInterval(checkPrices, 30 * 60 * 1000);
