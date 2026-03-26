const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API_URL;

// MENÚ PRINCIPAL
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💸 Bienvenido a ServyPayAccess', {
    reply_markup: {
      keyboard: [
        ['💰 Crear pago'],
        ['📊 Ver saldo']
      ],
      resize_keyboard: true
    }
  });
});

// RESPUESTAS
bot.on('message', async (msg) => {
  const text = msg.text;

  if (text === '💰 Crear pago') {
    bot.sendMessage(msg.chat.id, 'Escribe el monto así:\nEjemplo: 100');
  }

  else if (text === '📊 Ver saldo') {
    const res = await axios.get(`${API}/saldo`);
    bot.sendMessage(msg.chat.id, `💰 Saldo actual: ${res.data.saldo}`);
  }

  // SI ES NÚMERO (CREA PAGO)
  else if (!isNaN(text)) {
    const monto = parseFloat(text);

    const res = await axios.post(`${API}/pago`, {
      monto
    });

    bot.sendMessage(msg.chat.id, `✅ Pago creado\n💰 Nuevo saldo: ${res.data.saldo}`);
  }
});
