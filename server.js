const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🧠 MEMORIA
let usuarios = {};
let consultas = {};
let sesionesAdmin = {};
let esperandoNumero = {};

// 💰 PRECIOS
const PRECIOS = {
  telcel: 5,
  cfe: 10
};

// 🔹 USUARIO
function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = {
      saldo: 20,
      vip: false
    };
  }
  return usuarios[id];
}

// API
app.get('/', (req, res) => {
  res.send('SERVYPAY ACCESS ACTIVO 🚀');
});

// START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`💸 SERVYPAY ACCESS

Selecciona servicio:`,
{
  reply_markup: {
    keyboard: [
      ['📱 Telcel', '💡 CFE'],
      ['💳 Mi saldo', '👤 Mi cuenta']
    ],
    resize_keyboard: true
  }
});
});

// 👑 ADMIN
bot.onText(/\/admin/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,
`👑 PANEL ADMIN

📩 Pendientes: ${Object.keys(consultas).length}
👤 Usuarios: ${Object.keys(usuarios).length}`);
});

// 🔘 BOTONES ADMIN
bot.on('callback_query', (query) => {
  const data = query.data;
  const adminId = query.from.id;

  if (adminId !== ADMIN_ID) return;

  const parts = data.split('_');
  const action = parts[0];
  const id = parts[1];

  const c = consultas[id];
  if (!c) return;

  // RESPONDER
  if (action === 'responder') {
    sesionesAdmin[adminId] = { id, paso: 1 };
    return bot.sendMessage(adminId, '💰 Ingresa saldo:');
  }

  // RESPUESTA RÁPIDA
  if (action === 'saldo') {
    const saldo = parts[2];

    bot.sendMessage(c.chatId,
`📡 ${c.tipo.toUpperCase()}

📞 ${c.numero}
💰 $${saldo}

👤 ${c.usuario}`);

    delete consultas[id];
    return bot.sendMessage(adminId, '✅ Enviado');
  }
});

// 🤖 MENSAJES
bot.on('message', (msg) => {
  const text = (msg.text || '').trim();
  const userId = msg.from.id;
  const user = getUser(userId);

  // SALDO
  if (text === '💳 Mi saldo') {
    return bot.sendMessage(msg.chat.id, `💰 Saldo: $${user.saldo}`);
  }

  // CUENTA
  if (text === '👤 Mi cuenta') {
    return bot.sendMessage(msg.chat.id,
`👤 Cuenta

💰 Saldo: $${user.saldo}
👑 VIP: ${user.vip ? 'Sí' : 'No'}`);
  }

  // TELCEL
  if (text === '📱 Telcel') {
    esperandoNumero[userId] = 'telcel';
    return bot.sendMessage(msg.chat.id, '📞 Ingresa número Telcel:');
  }

  // CFE
  if (text === '💡 CFE') {
    esperandoNumero[userId] = 'cfe';
    return bot.sendMessage(msg.chat.id, '🔢 Ingresa número de servicio:');
  }

  // 🔥 PROCESAR NÚMERO
  if (esperandoNumero[userId]) {

    const tipo = esperandoNumero[userId];
    const numero = text.replace(/[^0-9]/g, '');

    if (numero.length < 6) {
      return bot.sendMessage(msg.chat.id, '❌ Número inválido');
    }

    const precio = PRECIOS[tipo];

    if (!user.vip && user.saldo < precio) {
      return bot.sendMessage(msg.chat.id, '❌ Saldo insuficiente');
    }

    if (!user.vip) user.saldo -= precio;

    const id = Date.now();

    const usuario = msg.from.username 
      ? '@' + msg.from.username 
      : msg.from.first_name;

    consultas[id] = {
      chatId: msg.chat.id,
      numero,
      usuario,
      tipo
    };

    delete esperandoNumero[userId];

    bot.sendMessage(ADMIN_ID,
`📩 NUEVA CONSULTA

📡 Tipo: ${tipo.toUpperCase()}
📞 ${numero}
👤 ${usuario}
💰 $${precio}`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: '⚡ Responder', callback_data: `responder_${id}` }],
      [
        { text: '$50', callback_data: `saldo_${id}_50` },
        { text: '$100', callback_data: `saldo_${id}_100` },
        { text: '$500', callback_data: `saldo_${id}_500` }
      ]
    ]
  }
});

    return bot.sendMessage(msg.chat.id, '⏳ Procesando...');
  }

  // 👑 RESPUESTA ADMIN
  if (sesionesAdmin[userId]) {
    const estado = sesionesAdmin[userId];
    const c = consultas[estado.id];

    bot.sendMessage(c.chatId,
`📡 ${c.tipo.toUpperCase()}

📞 ${c.numero}
💰 $${text}

👤 ${c.usuario}`);

    delete sesionesAdmin[userId];
    delete consultas[estado.id];

    return bot.sendMessage(userId, '✅ Enviado');
  }
});

// SERVER
app.listen(PORT, () => {
  console.log('🚀 SERVYPAY ACCESS LISTO');
});
