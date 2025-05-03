/**
 * Serviços para interagir com APIs externas de informações de voo
 */

const axios = require('axios');

// Obter informações de um voo por número
exports.getFlightInfo = async (flightNumber) => {
  // Implementação temporária - substituir por chamada real à API
  // const response = await axios.get(`${process.env.FLIGHT_API_URL}/flights/${flightNumber}`);
  // return response.data;
  
  // Mock para desenvolvimento inicial
  return {
    flightNumber,
    airline: 'TAP Portugal',
    departure: {
      airport: 'LIS',
      scheduled: '2025-05-04T10:30:00Z',
      terminal: '1',
      gate: 'A12'
    },
    arrival: {
      airport: 'OPO',
      scheduled: '2025-05-04T11:35:00Z',
      terminal: '2',
      gate: 'B5'
    },
    status: 'On Time',
    aircraft: 'Airbus A320'
  };
};

// Buscar voos entre aeroportos
exports.searchFlights = async (origin, destination, date) => {
  // Implementação temporária - substituir por chamada real à API
  // const response = await axios.get(`${process.env.FLIGHT_API_URL}/search?origin=${origin}&destination=${destination}&date=${date}`);
  // return response.data;
  
  // Mock para desenvolvimento inicial
  return [
    {
      flightNumber: 'TP1920',
      airline: 'TAP Portugal',
      departure: {
        airport: origin,
        scheduled: `${date || '2025-05-04'}T08:15:00Z`
      },
      arrival: {
        airport: destination,
        scheduled: `${date || '2025-05-04'}T10:25:00Z`
      },
      price: '120.50 EUR',
      seatsAvailable: 42
    },
    {
      flightNumber: 'TP1924',
      airline: 'TAP Portugal',
      departure: {
        airport: origin,
        scheduled: `${date || '2025-05-04'}T14:30:00Z`
      },
      arrival: {
        airport: destination,
        scheduled: `${date || '2025-05-04'}T16:40:00Z`
      },
      price: '145.75 EUR',
      seatsAvailable: 23
    }
  ];
};

// Configurar alerta para um voo
exports.setAlert = async (flightNumber, contactInfo, alertType) => {
  // Implementação temporária - substituir por chamada real à API ou banco de dados
  // const response = await axios.post(`${process.env.FLIGHT_API_URL}/alerts`, {
  //   flightNumber,
  //   contactInfo,
  //   alertType
  // });
  // return response.data.alertId;
  
  // Mock para desenvolvimento inicial
  return `alert-${Date.now()}`;
};

// Verificar status de um alerta
exports.getAlertStatus = async (alertId) => {
  // Implementação temporária - substituir por chamada real à API ou banco de dados
  // const response = await axios.get(`${process.env.FLIGHT_API_URL}/alerts/${alertId}`);
  // return response.data;
  
  // Mock para desenvolvimento inicial
  return {
    alertId,
    flightNumber: 'TP1920',
    status: 'ativo',
    lastCheck: new Date().toISOString(),
    notifications: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        message: 'Voo confirmado, sem alterações'
      }
    ]
  };
};
