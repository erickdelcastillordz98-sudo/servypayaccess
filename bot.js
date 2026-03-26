const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const API = process.env.API_URL;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💸 Bienvenido a ServyPayAccess');
});

bot.onText(/\/pago (.+)/, async (msg, match) => {
  const monto = parseFloat(match[1]);

  const res = await axios.post(`${API}/pago`, {
    monto
  });

  bot.sendMessage(msg.chat.id, `✅ Pago simulado\n💰 Saldo: ${res.data.saldo}`);
});

bot.onText(/\/saldo/, async (msg) => {
  const res = await axios.get(`${API}/saldo`);
  bot.sendMessage(msg.chat.id, `💰 Saldo actual: ${res.data.saldo}`);
});
