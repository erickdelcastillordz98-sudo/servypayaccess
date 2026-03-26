const express = require('express');
const app = express();

app.use(express.json());

let usuarios = {};
let pagosGlobal = [];

function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = { saldo: 0, pagos: [] };
  }
  return usuarios[id];
}

app.get('/', (req, res) => {
  res.send('API PRO funcionando 🚀');
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

// APROBAR PAGO
app.post('/admin/aprobar/:id', (req, res) => {
  const pago = pagosGlobal.find(p => p.id == req.params.id);

  if (!pago) return res.send('No existe');

  pago.estado = 'aprobado';

  const user = getUser(pago.userId);
  user.saldo += pago.monto * 0.3;

  res.json({ ok: true });
});

// VER TODOS LOS PAGOS
app.get('/admin/pagos', (req, res) => {
  res.json(pagosGlobal);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor PRO listo 🚀'));
