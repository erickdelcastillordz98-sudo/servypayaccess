const express = require('express');
const app = express();

app.use(express.json());

// BASE DE DATOS SIMULADA
let usuarios = {};

// CREAR USUARIO SI NO EXISTE
function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = {
      saldo: 0,
      pagos: []
    };
  }
  return usuarios[id];
}

// ROOT
app.get('/', (req, res) => {
  res.send('API PRO funcionando 🚀');
});

// CREAR PAGO
app.post('/pago', (req, res) => {
  const { userId, monto } = req.body;

  const user = getUser(userId);

  const pago = {
    id: user.pagos.length + 1,
    monto,
    fecha: new Date()
  };

  user.pagos.push(pago);

  const ganancia = monto * 0.3;
  user.saldo += ganancia;

  res.json({ pago, saldo: user.saldo });
});

// VER SALDO
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
