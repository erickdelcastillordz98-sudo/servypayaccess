const express = require('express');
const app = express();

app.use(express.json());

let saldo = 0;

app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});

app.post('/pago', (req, res) => {
  const { monto } = req.body;

  saldo += monto * 0.3;

  res.json({ mensaje: 'Pago simulado', saldo });
});

app.get('/saldo', (req, res) => {
  res.json({ saldo });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor listo'));
