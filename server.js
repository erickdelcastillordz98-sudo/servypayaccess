const bot.on('message', async (msg) => {
  const text = msg.text;
  const userId = msg.from.id;

  try {

    if (text === '/admin') {
      if (userId !== ADMIN_ID) return;

      const res = await axios.get(`http://localhost:${PORT}/admin/pagos`);

      let lista = res.data
        .map(p => `ID:${p.id} - $${p.monto} - ${p.estado}`)
        .join('\n');

      return bot.sendMessage(msg.chat.id, `👑 PANEL ADMIN\n${lista || 'Sin pagos'}`);
    }

    if (text.startsWith('/aprobar')) {
      if (userId !== ADMIN_ID) return;

      const id = text.split(' ')[1];

      await axios.post(`http://localhost:${PORT}/admin/aprobar/${id}`);

      return bot.sendMessage(msg.chat.id, `✅ Pago ${id} aprobado`);
    }

    if (text === '💰 Crear pago') {
      return bot.sendMessage(msg.chat.id, 'Escribe el monto');
    }

    if (text === '📊 Ver saldo') {
      const res = await axios.get(`http://localhost:${PORT}/saldo/${userId}`);
      return bot.sendMessage(msg.chat.id, `💰 Saldo: ${res.data.saldo}`);
    }

    if (text === '📜 Historial') {
      const res = await axios.get(`http://localhost:${PORT}/pagos/${userId}`);

      let lista = res.data.map(p => `ID:${p.id} - $${p.monto}`).join('\n');

      return bot.sendMessage(msg.chat.id, lista || 'Sin pagos');
    }

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
