/**
 * Testes para o serviço de voos
 */

const flightService = require('../src/services/flightService');

describe('Flight Service', () => {
  // Teste para obter informações de voo
  test('getFlightInfo should return flight details', async () => {
    const flightInfo = await flightService.getFlightInfo('TP1920');
    
    expect(flightInfo).toBeDefined();
    expect(flightInfo.flightNumber).toBe('TP1920');
    expect(flightInfo.airline).toBeDefined();
    expect(flightInfo.departure).toBeDefined();
    expect(flightInfo.arrival).toBeDefined();
  });
  
  // Teste para buscar voos
  test('searchFlights should return available flights', async () => {
    const flights = await flightService.searchFlights('LIS', 'OPO', '2025-05-04');
    
    expect(flights).toBeDefined();
    expect(Array.isArray(flights)).toBe(true);
    expect(flights.length).toBeGreaterThan(0);
    
    const firstFlight = flights[0];
    expect(firstFlight.flightNumber).toBeDefined();
    expect(firstFlight.departure.airport).toBe('LIS');
    expect(firstFlight.arrival.airport).toBe('OPO');
  });
  
  // Teste para configurar alertas
  test('setAlert should return an alert ID', async () => {
    const alertId = await flightService.setAlert(
      'TP1920', 
      'usuario@exemplo.com', 
      'departure'
    );
    
    expect(alertId).toBeDefined();
    expect(typeof alertId).toBe('string');
  });
  
  // Teste para verificar status de alerta
  test('getAlertStatus should return alert information', async () => {
    const alertStatus = await flightService.getAlertStatus('alert-123');
    
    expect(alertStatus).toBeDefined();
    expect(alertStatus.alertId).toBe('alert-123');
    expect(alertStatus.status).toBeDefined();
    expect(alertStatus.notifications).toBeDefined();
    expect(Array.isArray(alertStatus.notifications)).toBe(true);
  });
});
