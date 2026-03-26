const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API_URL;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💸 ServyPayAccess PRO', {
    reply_markup: {
      keyboard: [
        ['💰 Crear pago'],
        ['📊 Ver saldo'],
        ['📜 Historial']
      ],
      resize_keyboard: true
    }
  });
});

bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  if (text === '💰 Crear pago') {
    bot.sendMessage(msg.chat.id, 'Escribe el monto');
  }

  else if (text === '📊 Ver saldo') {
    const res = await axios.get(`${API}/saldo/${userId}`);
    bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
  }

  else if (text === '📜 Historial') {
    const res = await axios.get(`${API}/pagos/${userId}`);

    if (res.data.length === 0) {
      return bot.sendMessage(msg.chat.id, 'Sin pagos aún');
    }

    let lista = res.data.map(p => `ID:${p.id} - $${p.monto}`).join('\n');

    bot.sendMessage(msg.chat.id, `📜 Historial:\n${lista}`);
  }

  else if (!isNaN(text)) {
    const monto = parseFloat(text);

    const res = await axios.post(`${API}/pago`, {
      userId,
      monto
    });

    bot.sendMessage(msg.chat.id, `✅ Pago creado\n💰 Saldo: ${res.data.saldo}`);
  }
});
