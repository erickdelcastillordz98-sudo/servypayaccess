const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6761870413;

// 🔥 BOT (ANTES DE USARLO)
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

// API ROOT
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// CREAR PAGO
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

// ADMIN VER PAGOS
app.get('/admin/pagos', (req, res) => {
  res.json(pagosGlobal);
});

// ADMIN APROBAR
app.post('/admin/aprobar/:id', (req, res) => {
  const pago = pagosGlobal.find(p => p.id == req.params.id);

  if (!pago) return res.send('No existe');

  pago.estado = 'aprobado';

  const user = getUser(pago.userId);
  user.saldo += pago.monto * 0.3;

  res.json({ ok: true });
});

// SALDO
app.get('/saldo/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json({ saldo: user.saldo });
});

// HISTORIAL
app.get('/pagos/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json(user.pagos);
});

// 🤖 START
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

// 🤖 MENSAJES (AQUÍ VA TODO)
bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  try {

    // 👑 ADMIN PANEL
    if (text === '/admin') {
      if (userId !== ADMIN_ID) return;

      const res = await axios.get(`http://localhost:${PORT}/admin/pagos`);

      let lista = res.data
        .map(p => `ID:${p.id} - $${p.monto} - ${p.estado}`)
        .join('\n');

      return bot.sendMessage(msg.chat.id, `👑 PANEL ADMIN\n${lista || 'Sin pagos'}`);
    }

    // 👑 APROBAR
    if (text.startsWith('/aprobar')) {
      if (userId !== ADMIN_ID) return;

      const id = text.split(' ')[1];

      await axios.post(`http://localhost:${PORT}/admin/aprobar/${id}`);

      return bot.sendMessage(msg.chat.id, `✅ Pago ${id} aprobado`);
    }

    // CREAR PAGO
    if (text === '💰 Crear pago') {
      return bot.sendMessage(msg.chat.id, 'Escribe el monto');
    }

    // SALDO
    if (text === '📊 Ver saldo') {
      const res = await axios.get(`http://localhost:${PORT}/saldo/${userId}`);
      return bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
    }

    // HISTORIAL
    if (text === '📜 Historial') {
      const res = await axios.get(`http://localhost:${PORT}/pagos/${userId}`);

      let lista = res.data.map(p => `ID:${p.id} - $${p.monto}`).join('\n');

      return bot.sendMessage(msg.chat.id, lista || 'Sin pagos');
    }

    // SI ES NÚMERO
    if (!isNaN(text)) {
      const monto = parseFloat(text);

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

// SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
