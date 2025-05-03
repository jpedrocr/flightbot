/**
 * Rotas relacionadas a voos
 */

const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// Obter informações de voo por número
router.get('/info/:flightNumber', flightController.getFlightInfo);

// Buscar voos entre aeroportos
router.get('/search', flightController.searchFlights);

// Configurar alertas para voos
router.post('/alerts', flightController.setFlightAlert);

// Verificar status de alerta
router.get('/alerts/:id', flightController.getAlertStatus);

module.exports = router;
