/**
 * Controladores para gerenciar as funcionalidades relacionadas a voos
 */

const flightService = require('../services/flightService');

// Obter informações de um voo específico
exports.getFlightInfo = async (req, res) => {
  try {
    const { flightNumber } = req.params;
    const flightInfo = await flightService.getFlightInfo(flightNumber);
    
    res.json(flightInfo);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar informações do voo',
      details: error.message 
    });
  }
};

// Buscar voos disponíveis entre aeroportos
exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    
    if (!origin || !destination || !date) {
      return res.status(400).json({ 
        error: 'Todos os parâmetros são obrigatórios', 
        details: 'Origem, destino e data são obrigatórios para a busca de voos' 
      });
    }
    
    // Validação básica da data (formato YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Formato de data inválido',
        details: 'A data deve estar no formato YYYY-MM-DD'
      });
    }
    
    const flights = await flightService.searchFlights(origin, destination, date);
    
    res.json(flights);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar voos',
      details: error.message 
    });
  }
};

// Configurar alertas para voos
exports.setFlightAlert = async (req, res) => {
  try {
    const { flightNumber, contactInfo, alertType } = req.body;
    
    if (!flightNumber || !contactInfo || !alertType) {
      return res.status(400).json({ error: 'Dados incompletos para configurar alerta' });
    }
    
    const alertId = await flightService.setAlert(flightNumber, contactInfo, alertType);
    
    res.status(201).json({ 
      message: 'Alerta configurado com sucesso',
      alertId 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao configurar alerta',
      details: error.message 
    });
  }
};

// Verificar status de um alerta
exports.getAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const alertStatus = await flightService.getAlertStatus(id);
    
    res.json(alertStatus);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao verificar status do alerta',
      details: error.message 
    });
  }
};