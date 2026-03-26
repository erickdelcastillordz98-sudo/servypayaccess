const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API_URL;

const ADMIN_ID = 6761870413; // 👑 TU ID

// START
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

// MENSAJES
bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  try {
    // CREAR PAGO
    if (text === '💰 Crear pago') {
      return bot.sendMessage(msg.chat.id, 'Escribe el monto');
    }

    // SALDO
    if (text === '📊 Ver saldo') {
      const res = await axios.get(`${API}/saldo/${userId}`);
      return bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
    }

    // HISTORIAL
    if (text === '📜 Historial') {
      const res = await axios.get(`${API}/pagos/${userId}`);

      if (res.data.length === 0) {
        return bot.sendMessage(msg.chat.id, 'Sin pagos');
      }

      let lista = res.data.map(p => `ID:${p.id} - $${p.monto}`).join('\n');

      return bot.sendMessage(msg.chat.id, `📜 Historial:\n${lista}`);
    }

    // SI ES NÚMERO
    if (!isNaN(text)) {
      const monto = parseFloat(text);

      const res = await axios.post(`${API}/pago`, {
        userId,
        monto
      });

      return bot.sendMessage(msg.chat.id, `✅ Pago creado`);
    }

  } catch (error) {
    console.log(error.message);
    bot.sendMessage(msg.chat.id, '❌ Error en el sistema');
  }
});

// 👑 ADMIN
bot.onText(/\/admin/, async (msg) => {
  if (msg.from.id !== ADMIN_ID) return;

  try {
    const res = await axios.get(`${API}/admin/pagos`);

    if (res.data.length === 0) {
      return bot.sendMessage(msg.chat.id, 'No hay pagos');
    }

    let lista = res.data
      .map(p => `ID:${p.id} - $${p.monto} - ${p.estado}`)
      .join('\n');

    bot.sendMessage(msg.chat.id, `👑 PANEL ADMIN\n${lista}`);

  } catch (error) {
    console.log(error.message);
    bot.sendMessage(msg.chat.id, '❌ Error admin');
  }
});

// 👑 APROBAR
bot.onText(/\/aprobar (.+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;

  try {
    const id = match[1];

    await axios.post(`${API}/admin/aprobar/${id}`);

    bot.sendMessage(msg.chat.id, `✅ Pago ${id} aprobado`);

  } catch (error) {
    console.log(error.message);
    bot.sendMessage(msg.chat.id, '❌ Error al aprobar');
  }
});
