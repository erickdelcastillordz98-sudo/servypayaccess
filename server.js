const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

// 🔥 VARIABLES
let consultasPendientes = {};
let respuestasAdmin = {};

// 🤖 BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🔹 API
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// 🤖 START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🏦 ServyPayAccess\nSistema activo');
});

// 🤖 MENSAJES
bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  try {

    // 💀 TELCEL → ENVÍA A ADMIN
    if (text.startsWith('/telcel')) {
      const numero = text.split(' ')[1];

      if (!numero) {
        return bot.sendMessage(msg.chat.id, '❌ Usa: /telcel 833XXXXXXX');
      }

      const usuario = msg.from.username 
        ? '@' + msg.from.username 
        : msg.from.first_name;

      const id = Date.now();

      consultasPendientes[id] = {
        chatId: msg.chat.id,
        numero,
        usuario
      };

      bot.sendMessage(ADMIN_ID,
        `📩 NUEVA CONSULTA TELCEL\n\n📞 ${numero}\n👤 ${usuario}\n\nID: ${id}\n\n/responder ${id}`
      );

      return bot.sendMessage(msg.chat.id, '⏳ Consulta enviada al sistema...');
    }

    // 👑 ADMIN INICIA RESPUESTA
    if (text.startsWith('/responder')) {
      if (userId !== ADMIN_ID) return;

      const id = text.split(' ')[1];

      if (!consultasPendientes[id]) {
        return bot.sendMessage(msg.chat.id, '❌ ID no válido');
      }

      respuestasAdmin[userId] = {
        paso: 1,
        id,
        data: {}
      };

      return bot.sendMessage(msg.chat.id, '📞 Número:');
    }

    // 🔥 FLUJO ADMIN (LLENAR TODO)
    if (respuestasAdmin[userId]) {
      const estado = respuestasAdmin[userId];

      switch (estado.paso) {
        case 1:
          estado.data.numero = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '📶 Status:');

        case 2:
          estado.data.status = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '⏱ Tiempo:');

        case 3:
          estado.data.time = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '👤 Perfil:');

        case 4:
          estado.data.perfil = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '📦 Plan:');

        case 5:
          estado.data.plan = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '🌎 Región:');

        case 6:
          estado.data.region = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '💰 Saldo actual:');

        case 7:
          estado.data.saldo = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '💳 Saldo total:');

        case 8:
          estado.data.total = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '✔ Registrado:');

        case 9:
          estado.data.registrado = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '❌ Suspendida:');

        case 10:
          estado.data.suspendida = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '⚠️ Días para corte:');

        case 11:
          estado.data.corte = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '📅 Fecha límite:');

        case 12:
          estado.data.limite = text;
          estado.paso++;
          return bot.sendMessage(msg.chat.id, '📅 Fecha expiración:');

        case 13:
          estado.data.exp = text;

          const consulta = consultasPendientes[estado.id];

          const mensaje = `
📱 TELCEL • SYSTEM CHECK

━━━━━━━━━━━━━━━━━━━

📞 NUMERO ⋉ ${estado.data.numero}
📶 STATUS ⋉ ${estado.data.status}
⏱ TIME ⋉ ${estado.data.time}

━━━━━━━━━━━━━━━━━━━
📋 INFORMACIÓN GENERAL

👤 PERFIL ⋉ ${estado.data.perfil}
📦 PLAN ⋉ ${estado.data.plan}
🌎 REGIÓN ⋉ ${estado.data.region}

━━━━━━━━━━━━━━━━━━━
💰 SALDOS

💵 SALDO ACTUAL ⋉ ${estado.data.saldo}
💳 SALDO TOTAL ⋉ ${estado.data.total}

━━━━━━━━━━━━━━━━━━━
🔒 ESTADO

✔ REGISTRADO ⋉ ${estado.data.registrado}
❌ SUSPENDIDA ⋉ ${estado.data.suspendida}

━━━━━━━━━━━━━━━━━━━
⚠️ ALERTA

⏳ ${estado.data.corte} días para corte

━━━━━━━━━━━━━━━━━━━
📅 FECHAS

📌 LÍMITE ⋉ ${estado.data.limite}
📌 EXPIRACIÓN ⋉ ${estado.data.exp}

━━━━━━━━━━━━━━━━━━━
👤 CHECKED BY ⋉ ${consulta.usuario}
🤖 BOT BY ⋉ @anonimoenelanonimato
`;

          bot.sendMessage(consulta.chatId, mensaje);

          delete consultasPendientes[estado.id];
          delete respuestasAdmin[userId];

          return bot.sendMessage(msg.chat.id, '✅ Consulta enviada');
      }
    }

  } catch (e) {
    console.log(e.message);
    bot.sendMessage(msg.chat.id, '❌ Error sistema');
  }
});

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
