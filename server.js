const express = require('express');
const app = express();

app.use(express.json());

let usuarios = {};
let pagosGlobal = [];

// 🔹 Obtener o crear usuario
function getUser(id) {
  if (!usuarios[id]) {
    usuarios[id] = { saldo: 0, pagos: [] };
  }
  return usuarios[id];
}

// 🔹 Ruta principal (para probar Railway)
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// 🔹 Crear pago
app.post('/pago', (req, res) => {
  const { userId, monto } = req.body;

  if (!userId || !monto) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

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

// 🔹 Ver todos los pagos (ADMIN)
app.get('/admin/pagos', (req, res) => {
  res.json(pagosGlobal);
});

// 🔹 Aprobar pago (ADMIN)
app.post('/admin/aprobar/:id', (req, res) => {
  const pago = pagosGlobal.find(p => p.id == req.params.id);

  if (!pago) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  if (pago.estado === 'aprobado') {
    return res.json({ mensaje: 'Ya estaba aprobado' });
  }

  pago.estado = 'aprobado';

  const user = getUser(pago.userId);
  const ganancia = pago.monto * 0.3;

  user.saldo += ganancia;

  res.json({
    mensaje: 'Pago aprobado',
    ganancia,
    saldo: user.saldo
  });
});

// 🔹 Ver saldo
app.get('/saldo/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json({ saldo: user.saldo });
});

// 🔹 Ver historial
app.get('/pagos/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.json(user.pagos);
});

// 🔥 PUERTO DINÁMICO (CLAVE PARA RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);
});
