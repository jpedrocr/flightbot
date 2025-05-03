/**
 * FlightBot - Ponto de entrada principal da aplicação
 */

require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Importar rotas
const flightRoutes = require('./routes/flightRoutes');

// Middleware para JSON
app.use(express.json());

// Rotas
app.use('/api/flights', flightRoutes);

// Rota base
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do FlightBot! Use /api/flights para acessar os recursos.' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; // Para testes
