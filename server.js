const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🧠 MEMORIA
let consultas = {};
let sesionesAdmin = {};

// API
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💸 ServyPayAccess', {
    reply_markup: {
      keyboard: [['📱 Consultar Telcel']],
      resize_keyboard: true
    }
  });
});

// 📱 CREAR CONSULTA
bot.on('message', (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  // BOTÓN USUARIO
  if (text === '📱 Consultar Telcel') {
    return bot.sendMessage(msg.chat.id, '📞 Envía el número:');
  }

  // USUARIO ENVÍA NÚMERO
  if (!isNaN(text) && text.length >= 10 && userId !== ADMIN_ID) {
    const id = Date.now();

    const usuario = msg.from.username 
      ? '@' + msg.from.username 
      : msg.from.first_name;

    consultas[id] = {
      chatId: msg.chat.id,
      numero: text,
      usuario
    };

    // ENVÍA AL ADMIN
    bot.sendMessage(ADMIN_ID,
      `📩 NUEVA CONSULTA\n\n📞 ${text}\n👤 ${usuario}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✏️ Editar', callback_data: `edit_${id}` }],
            [{ text: '⚡ Respuesta rápida', callback_data: `fast_${id}` }],
            [{ text: '❌ Rechazar', callback_data: `cancel_${id}` }]
          ]
        }
      }
    );

    return bot.sendMessage(msg.chat.id, '⏳ Consulta enviada...');
  }
});

// 🔘 BOTONES ADMIN
bot.on('callback_query', async (query) => {
  const data = query.data;
  const adminId = query.from.id;

  if (adminId !== ADMIN_ID) return;

  const id = data.split('_')[1];
  const consulta = consultas[id];

  if (!consulta) return;

  // ✏️ EDITAR
  if (data.startsWith('edit_')) {
    sesionesAdmin[adminId] = {
      id,
      paso: 1,
      data: {}
    };

    return bot.sendMessage(adminId, '📞 Número:');
  }

  // ⚡ RESPUESTA RÁPIDA
  if (data.startsWith('fast_')) {
    return bot.sendMessage(adminId, 'Selecciona saldo:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '$50', callback_data: `saldo_${id}_50` },
            { text: '$100', callback_data: `saldo_${id}_100` },
            { text: '$200', callback_data: `saldo_${id}_200` }
          ],
          [
            { text: '$500', callback_data: `saldo_${id}_500` },
            { text: '$1000', callback_data: `saldo_${id}_1000` }
          ]
        ]
      }
    });
  }

  // 💰 SALDO RÁPIDO
  if (data.startsWith('saldo_')) {
    const parts = data.split('_');
    const id = parts[1];
    const saldo = parts[2];

    const c = consultas[id];

    const mensaje = `
📱 TELCEL CHECK

📞 ${c.numero}
💰 $${saldo}

👤 ${c.usuario}
`;

    bot.sendMessage(c.chatId, mensaje);
    delete consultas[id];

    return bot.sendMessage(adminId, '✅ Enviado');
  }

  // ❌ CANCELAR
  if (data.startsWith('cancel_')) {
    delete consultas[id];
    return bot.sendMessage(adminId, '❌ Cancelado');
  }
});

// 🧠 FLUJO EDITAR
bot.on('message', (msg) => {
  const userId = msg.from.id;
  const text = msg.text;

  if (!sesionesAdmin[userId]) return;

  const estado = sesionesAdmin[userId];

  switch (estado.paso) {
    case 1:
      estado.data.numero = text;
      estado.paso++;
      return bot.sendMessage(userId, '💰 Saldo:');

    case 2:
      estado.data.saldo = text;

      const consulta = consultas[estado.id];

      const mensaje = `
📱 TELCEL CHECK

📞 ${estado.data.numero}
💰 $${estado.data.saldo}

👤 ${consulta.usuario}
`;

      bot.sendMessage(consulta.chatId, mensaje);

      delete sesionesAdmin[userId];
      delete consultas[estado.id];

      return bot.sendMessage(userId, '✅ Enviado');
  }
});

// SERVER
app.listen(PORT, () => {
  console.log('Servidor activo');
});
