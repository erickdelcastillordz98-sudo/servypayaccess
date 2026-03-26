const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API_URL;

const ADMIN_ID = 7161225748; // 👑 TU ID

// MENÚ PRINCIPAL
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

// MENSAJES GENERALES
bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  // CREAR PAGO
  if (text === '💰 Crear pago') {
    return bot.sendMessage(msg.chat.id, 'Escribe el monto');
  }

  // VER SALDO
  if (text === '📊 Ver saldo') {
    const res = await axios.get(`${API}/saldo/${userId}`);
    return bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
  }

  // HISTORIAL
  if (text === '📜 Historial') {
    const res = await axios.get(`${API}/pagos/${userId}`);

    if (res.data.length === 0) {
      return bot.sendMessage(msg.chat.id, 'Sin pagos aún');
    }

    let lista = res.data.map(p => `ID:${p.id} - $${p.monto}`).join('\n');

    return bot.sendMessage(msg.chat.id, `📜 Historial:\n${lista}`);
  }

  // SI ES NÚMERO = CREAR PAGO
  if (!isNaN(text)) {
    const monto = parseFloat(text);

    const res = await axios.post(`${API}/pago`, {
      userId,
      monto
    });

    return bot.sendMessage(msg.chat.id, `✅ Pago creado\n💰 Saldo: ${res.data.saldo}`);
  }
});

// 👑 PANEL ADMIN
bot.onText(/\/admin/, async (msg) => {
  if (msg.from.id !== ADMIN_ID) return;

  const res = await axios.get(`${API}/admin/pagos`);

  if (res.data.length === 0) {
    return bot.sendMessage(msg.chat.id, 'No hay pagos');
  }

  let lista = res.data
    .map(p => `ID:${p.id} - $${p.monto} - ${p.estado}`)
    .join('\n');

  bot.sendMessage(msg.chat.id, `👑 PANEL ADMIN\n${lista}`);
});

// 👑 APROBAR PAGO
bot.onText(/\/aprobar (.+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;

  const id = match[1];

  await axios.post(`${API}/admin/aprobar/${id}`);

  bot.sendMessage(msg.chat.id, `✅ Pago ${id} aprobado`);
});
