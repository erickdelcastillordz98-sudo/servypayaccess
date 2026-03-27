const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🧠 BASE DE DATOS (memoria)
let usuarios = {};
let consultas = {};
let sesionesAdmin = {};

// 💰 CONFIG PRECIOS
const PRECIOS = {
  telcel: 5,
  cfe: 10
};

// 🔹 OBTENER USUARIO
function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = {
      saldo: 0,
      vip: false,
      consultas: []
    };
  }
  return usuarios[id];
}

// 🌐 API
app.get('/', (req, res) => {
  res.send('SERVYPAY ACCESS ACTIVO 🚀');
});

// 🚀 START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💸 SERVYPAY ACCESS\n\nSelecciona servicio:', {
    reply_markup: {
      keyboard: [
        ['📱 Telcel', '💡 CFE'],
        ['💳 Mi saldo', '👤 Mi cuenta']
      ],
      resize_keyboard: true
    }
  });
});

// 👑 ADMIN PANEL
bot.onText(/\/admin/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;

  const total = Object.keys(consultas).length;
  const users = Object.keys(usuarios).length;

  bot.sendMessage(msg.chat.id,
`👑 PANEL ADMIN

📩 Pendientes: ${total}
👤 Usuarios: ${users}

Selecciona:`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: '📩 Ver consultas', callback_data: 'ver_consultas' }],
      [{ text: '💰 Agregar saldo', callback_data: 'add_saldo' }]
    ]
  }
});
});

// 🔘 BOTONES
bot.on('callback_query', (query) => {
  const data = query.data;
  const userId = query.from.id;

  // 👑 VER CONSULTAS
  if (data === 'ver_consultas') {
    if (userId !== ADMIN_ID) return;

    const lista = Object.entries(consultas);

    if (lista.length === 0) {
      return bot.sendMessage(userId, 'Sin consultas');
    }

    lista.forEach(([id, c]) => {
      bot.sendMessage(userId,
        `📩 ${c.tipo.toUpperCase()}\n📞 ${c.numero}\n👤 ${c.usuario}`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚡ Responder', callback_data: `responder_${id}` }]
            ]
          }
        }
      );
    });
  }

  // ⚡ RESPONDER
  if (data.startsWith('responder_')) {
    const id = data.split('_')[1];

    sesionesAdmin[userId] = {
      id,
      paso: 1,
      data: {}
    };

    return bot.sendMessage(userId, '💰 Saldo a enviar:');
  }

  // 💰 RESPUESTA RÁPIDA
  if (data.startsWith('saldo_')) {
    const parts = data.split('_');
    const id = parts[1];
    const saldo = parts[2];

    const c = consultas[id];

    bot.sendMessage(c.chatId,
`📱 RESULTADO

📞 ${c.numero}
💰 $${saldo}

👤 ${c.usuario}
`);

    delete consultas[id];
  }
});

// 🤖 MENSAJES
bot.on('message', (msg) => {
  const text = (msg.text || '').trim();
  const userId = msg.from.id;
  const user = getUser(userId);

  // 💳 SALDO
  if (text === '💳 Mi saldo') {
    return bot.sendMessage(msg.chat.id, `💰 Saldo: $${user.saldo}`);
  }

  // 👤 CUENTA
  if (text === '👤 Mi cuenta') {
    return bot.sendMessage(msg.chat.id,
`👤 Cuenta

💰 Saldo: $${user.saldo}
👑 VIP: ${user.vip ? 'Sí' : 'No'}
`);
  }

  // 📱 TELCEL
  if (text === '📱 Telcel') {
    return bot.sendMessage(msg.chat.id, '📞 Ingresa número Telcel:');
  }

  // 💡 CFE
  if (text === '💡 CFE') {
    return bot.sendMessage(msg.chat.id, '🔢 Ingresa número de servicio:');
  }

  // 🔥 DETECTAR NÚMERO
  const numero = text.replace(/[^0-9]/g, '');

  if (numero.length >= 10 && userId !== ADMIN_ID) {

    if (user.saldo < 5 && !user.vip) {
      return bot.sendMessage(msg.chat.id, '❌ Saldo insuficiente');
    }

    const id = Date.now();

    const usuario = msg.from.username 
      ? '@' + msg.from.username 
      : msg.from.first_name;

    consultas[id] = {
      chatId: msg.chat.id,
      numero,
      usuario,
      tipo: 'telcel'
    };

    if (!user.vip) user.saldo -= 5;

    bot.sendMessage(ADMIN_ID,
`📩 NUEVA CONSULTA

📞 ${numero}
👤 ${usuario}
💰 $5`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: '⚡ Responder', callback_data: `responder_${id}` }]
    ]
  }
});

    return bot.sendMessage(msg.chat.id, '⏳ Procesando...');
  }

  // 👑 RESPUESTA ADMIN
  if (sesionesAdmin[userId]) {
    const estado = sesionesAdmin[userId];

    switch (estado.paso) {
      case 1:
        estado.data.saldo = text;

        const c = consultas[estado.id];

        bot.sendMessage(c.chatId,
`📱 RESULTADO

📞 ${c.numero}
💰 $${estado.data.saldo}

👤 ${c.usuario}
`);

        delete sesionesAdmin[userId];
        delete consultas[estado.id];

        return bot.sendMessage(userId, '✅ Enviado');
    }
  }
});

// 🚀 SERVER
app.listen(PORT, () => {
  console.log('🚀 SERVYPAY ACCESS ACTIVO');
});
