
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let pagos = [];
let wallet = 0;

app.get('/', (req, res) => {
  res.send('ServyPayAccess API funcionando 🚀');
});

app.post('/pagos', (req, res) => {
  const pago = { id: pagos.length + 1, ...req.body, estado: 'pendiente' };
  pagos.push(pago);
  res.json(pago);
});

app.get('/pagos', (req, res) => {
  res.json(pagos);
});

app.post('/pagos/:id/aprobar', (req, res) => {
  const pago = pagos.find(p => p.id == req.params.id);
  if (!pago) return res.status(404).send('No encontrado');

  pago.estado = 'aprobado';
  const ganancia = pago.monto * 0.3;
  wallet += ganancia;

  res.json({ pago, ganancia, wallet });
});

app.get('/wallet', (req, res) => {
  res.json({ saldo: wallet });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
