const TelegramBot = require('node-telegram-bot-api');
const token = 'TU_TOKEN_AQUI';

// ⚠️ PON TU ID DE TELEGRAM
const ADMIN_ID = 123456789;

const bot = new TelegramBot(token, { polling: true });

let userState = {};
let pedidos = {};

// INICIO
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '💳 SERVYPAY ACCESS', {
    reply_markup: {
      keyboard: [
        ['🔌 Pagar servicios']
      ],
      resize_keyboard: true
    }
  });
});

// FLUJO SERVICIO
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🔌 Pagar servicios') {
    bot.sendMessage(chatId, 'Selecciona servicio:', {
      reply_markup: {
        keyboard: [['💡 CFE'], ['🔙 Volver']],
        resize_keyboard: true
      }
    });
  }

  if (text === '💡 CFE') {
    userState[chatId] = { step: 'contrato', servicio: 'CFE' };
    bot.sendMessage(chatId, 'Ingresa tu contrato:');
  }

  else if (userState[chatId]?.step === 'contrato') {
    userState[chatId].contrato = text;
    userState[chatId].step = 'monto';
    bot.sendMessage(chatId, 'Ingresa el monto:');
  }

  else if (userState[chatId]?.step === 'monto') {
    userState[chatId].monto = text;
    userState[chatId].step = 'comprobante';

    bot.sendMessage(chatId, `
💰 INSTRUCCIONES

Banco: TU BANCO
CLABE: TU CLABE

Monto: $${text}

📸 Envía comprobante
    `);
  }

  // CUANDO ENVÍA FOTO
  if (msg.photo && userState[chatId]?.step === 'comprobante') {

    const pedidoId = 'SPX-' + Math.floor(Math.random() * 99999);

    pedidos[pedidoId] = {
      userId: chatId,
      ...userState[chatId]
    };

    bot.sendMessage(chatId, '⏳ Pago en revisión');

    // MENSAJE AL ADMIN
    bot.sendMessage(ADMIN_ID, `
🚨 NUEVO PAGO

🆔 ${pedidoId}
👤 ${msg.from.username || 'sin username'}
🧾 ${pedidos[pedidoId].servicio}
🔢 ${pedidos[pedidoId].contrato}
💰 $${pedidos[pedidoId].monto}
    `, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Aprobar', callback_data: `ok_${pedidoId}` },
            { text: '❌ Rechazar', callback_data: `no_${pedidoId}` }
          ]
        ]
      }
    });

    userState[chatId] = null;
  }
});

// BOTONES ADMIN
bot.on('callback_query', (query) => {
  const data = query.data;
  const pedidoId = data.split('_')[1];
  const pedido = pedidos[pedidoId];

  if (!pedido) return;

  if (data.startsWith('ok_')) {
    bot.sendMessage(pedido.userId, `
✅ Pago aprobado

Tu servicio fue procesado correctamente.
🆔 ${pedidoId}
    `);
  }

  if (data.startsWith('no_')) {
    bot.sendMessage(pedido.userId, `
❌ Pago rechazado

Verifica tu comprobante o contacta soporte.
🆔 ${pedidoId}
    `);
  }

  bot.answerCallbackQuery(query.id);
});
