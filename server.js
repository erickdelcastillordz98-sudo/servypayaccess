const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

// 🤖 BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// BASE DE DATOS
let usuarios = {};
let pagosGlobal = [];

function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = { saldo: 0, pagos: [] };
  }
  return usuarios[id];
}

// 🔹 API ROOT
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// 🔹 CREAR PAGO
app.post('/pago', (req, res) => {
  const { userId, monto } = req.body;

  const user = getUser(userId);

  const pago = {
    id: pagosGlobal.length + 1,
    userId,
    monto,
    estado: 'pendiente'
  };

  pagosGlobal.push(pago);
  user.pagos.push(pago);

  res.json(pago);
});

// 🔹 ADMIN VER PAGOS
app.get('/admin/pagos', (req, res) => {
  res.json(pagosGlobal);
});

// 🔹 ADMIN APROBAR
app.post('/admin/aprobar/:id', (req, res) => {
  const pago = pagosGlobal.find(p => p.id == req.params.id);

  if (!pago) return res.send('No existe');

  pago.estado = 'aprobado';

  const user = getUser(pago.userId);
  user.saldo += pago.monto * 0.3;

  res.json({ ok: true });
});

// 🔹 SALDO
app.get('/saldo/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json({ saldo: user.saldo });
});

// 🔹 HISTORIAL
app.get('/pagos/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json(user.pagos);
});

// 🔹 TELCEL (SIMULADO)
app.get('/telcel/:numero', (req, res) => {
  const numero = req.params.numero;

  const saldo = Math.floor(Math.random() * 500) + 50;

  res.json({
    servicio: 'Telcel',
    numero,
    saldo
  });
});

// 🤖 START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🏦 ServyPayAccess\nSistema de pagos autorizado', {
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

// 🤖 MENSAJES (ÚNICO BLOQUE)
bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  try {

    // 💀 TELCEL CHECKER
    if (text.startsWith('/telcel')) {
      const numero = text.split(' ')[1];

      if (!numero) {
        return bot.sendMessage(msg.chat.id, '❌ Usa: /telcel 833XXXXXXX');
      }

      const res = await axios.get(`http://localhost:${PORT}/telcel/${numero}`);

      const tiempo = Math.floor(Math.random() * 20) + 10;

      const usuario = msg.from.username 
        ? '@' + msg.from.username 
        : msg.from.first_name;

      const mensaje = `
╔═╗ TELCEL SECURE CHECKER v3.1
╚═➤ SYSTEM ACCESS GRANTED

━━━━━━━━━━━━━━━━━━━━━━━

📡 TARGET: ${res.data.numero}
📶 STATUS: VALID LINE ✔
⏳ RESPONSE TIME: ${tiempo}s

━━━━━━━━━━━━━━━━━━━━━━━
[ NETWORK DATA ]

▸ PROFILE: MASIVOMIX
▸ PLAN: TELCEL LIBRE CONTROLADO 5
▸ REGION: 4

━━━━━━━━━━━━━━━━━━━━━━━
[ BALANCE INFO ]

▸ CURRENT BALANCE: $${res.data.saldo}
▸ TOTAL BALANCE: $0.00

━━━━━━━━━━━━━━━━━━━━━━━
[ LINE STATUS ]

▸ REGISTERED: TRUE
▸ SUSPENDED: FALSE
▸ CUT-OFF: 19 DAYS

━━━━━━━━━━━━━━━━━━━━━━━
[ FINAL STATUS ]

🟢 LINE ACTIVE — NO RESTRICTIONS

━━━━━━━━━━━━━━━━━━━━━━━
[ TRACE INFO ]

▸ USER: ${usuario}
▸ SESSION ID: ${Math.floor(Math.random() * 999999)}
▸ NODE: MX-SRV-01

━━━━━━━━━━━━━━━━━━━━━━━
🤖 SYSTEM: @anonimoenelanonimato
`;

      return bot.sendMessage(msg.chat.id, mensaje);
    }

    // 👑 ADMIN
    if (text === '/admin') {
      if (userId !== ADMIN_ID) return;

      const res = await axios.get(`http://localhost:${PORT}/admin/pagos`);

      if (res.data.length === 0) {
        return bot.sendMessage(msg.chat.id, 'Sin pagos');
      }

      res.data.forEach(p => {
        bot.sendMessage(msg.chat.id,
          `🧾 ID:${p.id}\n💰 $${p.monto}\n📌 ${p.estado}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Aprobar', callback_data: `aprobar_${p.id}` }]
              ]
            }
          }
        );
      });
    }

    // 💰 CREAR PAGO
    if (text === '💰 Crear pago') {
      return bot.sendMessage(msg.chat.id, 'Escribe el monto');
    }

    // 📊 SALDO
    if (text === '📊 Ver saldo') {
      const res = await axios.get(`http://localhost:${PORT}/saldo/${userId}`);
      return bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
    }

    // 📜 HISTORIAL
    if (text === '📜 Historial') {
      const res = await axios.get(`http://localhost:${PORT}/pagos/${userId}`);

      if (res.data.length === 0) {
        return bot.sendMessage(msg.chat.id, 'Sin pagos');
      }

      let lista = res.data
        .map(p => `🧾 ID:${p.id} - $${p.monto} - ${p.estado}`)
        .join('\n');

      return bot.sendMessage(msg.chat.id, `📜 Historial:\n${lista}`);
    }

    // 🔢 CREAR PAGO POR MONTO
    if (!isNaN(text)) {
      const monto = parseFloat(text);

      if (monto <= 0) {
        return bot.sendMessage(msg.chat.id, '❌ Monto inválido');
      }

      await axios.post(`http://localhost:${PORT}/pago`, {
        userId,
        monto
      });

      return bot.sendMessage(msg.chat.id, `✅ Pago creado`);
    }

  } catch (e) {
    console.log(e.message);
    bot.sendMessage(msg.chat.id, '❌ Error sistema');
  }
});

// 🔘 BOTONES
bot.on('callback_query', async (query) => {
  const data = query.data;

  try {
    if (data.startsWith('aprobar_')) {
      const id = data.split('_')[1];

      await axios.post(`http://localhost:${PORT}/admin/aprobar/${id}`);

      bot.sendMessage(query.message.chat.id, `✅ Pago ${id} aprobado`);
    }
  } catch (e) {
    bot.sendMessage(query.message.chat.id, '❌ Error');
  }
});

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
