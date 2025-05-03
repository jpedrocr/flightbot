/**
 * Serviços para interagir com APIs externas e web scraping de informações de voo
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

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

/**
 * Realiza busca de voos no Skyscanner usando web scraping
 * @param {string} origin - Código IATA de origem (ex: LIS)
 * @param {string} destination - Código IATA de destino (ex: OPO)
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Array de objetos com informações dos voos
 */
exports.searchFlights = async (origin, destination, date) => {
  // Validação dos parâmetros de entrada
  if (!origin || !destination || !date) {
    throw new Error('Todos os parâmetros são obrigatórios: origin, destination, date');
  }

  try {
    // Em ambiente de desenvolvimento, usamos dados mockados
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
      console.log('Usando dados mockados para searchFlights');
      return getMockFlightData(origin, destination, date);
    }

    // Configuração do navegador Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
      // Configurações iniciais da página
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Formatação da data para o formato do Skyscanner (YYMMDD)
      const formattedDate = formatDateForSkyscanner(date);
      
      // Construção da URL de busca
      const baseUrl = 'https://www.skyscanner.pt/transporte/voos';
      const searchUrl = `${baseUrl}/${origin}/${destination}/${formattedDate}/?adults=1&cabinclass=economy`;
      
      console.log(`Acessando URL: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Lidar com popups/cookies
      try {
        await page.waitForSelector('[data-testid="accept-cookie-banner"]', { timeout: 5000 });
        await page.click('[data-testid="accept-cookie-banner"]');
        console.log('Cookies aceitos');
      } catch (error) {
        console.log('Nenhum popup de cookies encontrado ou já foi aceito');
      }

      // Aguardar carregamento dos resultados
      console.log('Aguardando resultados...');
      await page.waitForSelector('[data-testid="itinerary-card"]', { timeout: 30000 });

      // Extrair dados dos voos
      console.log('Extraindo dados dos voos...');
      const flights = await page.$$eval('[data-testid="itinerary-card"]', (flightCards) => {
        return flightCards.map(card => {
          const getText = (selector) => 
            card.querySelector(selector)?.textContent?.trim() || 'N/A';

          // Extração dos dados principais
          const airline = getText('[data-testid="carrier"]') || getText('[data-testid="leg-carrier"]');
          const price = getText('[data-testid="price"]');
          const duration = getText('[data-testid="duration"]');
          const stops = getText('[data-testid="stops"]');

          // Extração de horários
          const departureTime = getText('[data-testid="departure-time"]');
          const arrivalTime = getText('[data-testid="arrival-time"]');

          // Extração de aeroportos
          const departureAirport = getText('[data-testid="departure-airport"]');
          const arrivalAirport = getText('[data-testid="arrival-airport"]');

          // Criando objeto de retorno
          return {
            flightNumber: 'N/A', // Skyscanner geralmente não mostra o número do voo diretamente
            airline,
            departure: {
              airport: departureAirport || origin,
              scheduled: departureTime ? `${date}T${departureTime}:00Z` : null
            },
            arrival: {
              airport: arrivalAirport || destination,
              scheduled: arrivalTime ? `${date}T${arrivalTime}:00Z` : null
            },
            duration,
            price,
            stops: stops.replace(/\n/g, ' ').trim(),
            url: card.querySelector('a')?.href || null
          };
        });
      });

      // Filtragem de resultados inválidos
      const validFlights = flights.filter(flight => 
        flight.price !== 'N/A' && flight.airline !== 'N/A'
      );

      console.log(`Encontrados ${validFlights.length} voos válidos`);
      
      // Ordenar por preço
      const sortedFlights = validFlights.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.'));
        const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.'));
        return priceA - priceB;
      });

      await browser.close();
      return sortedFlights;

    } catch (error) {
      console.error('Erro durante o scraping:', error);
      await browser.close();
      throw new Error(`Falha na busca de voos: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro geral:', error);
    throw new Error(`Erro ao buscar voos: ${error.message}`);
  }
};

/**
 * Formata a data para o formato usado pelo Skyscanner
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {string} Data no formato YYMMDD
 */
function formatDateForSkyscanner(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error('Formato de data inválido, use YYYY-MM-DD');
  }
  
  // Obtém as últimas duas cifras do ano e remove zeros à esquerda dos outros componentes
  const year = parts[0].slice(2);
  const month = parts[1];
  const day = parts[2];
  
  return `${year}${month}${day}`;
}

/**
 * Retorna dados mockados para testes e desenvolvimento
 */
function getMockFlightData(origin, destination, date) {
  return [
    {
      flightNumber: 'TP1920',
      airline: 'TAP Portugal',
      departure: {
        airport: origin,
        scheduled: `${date}T08:15:00Z`
      },
      arrival: {
        airport: destination,
        scheduled: `${date}T10:25:00Z`
      },
      duration: '2h 10m',
      price: '120,50 EUR',
      stops: 'Direto',
      url: 'https://www.skyscanner.pt/transport/flights/lis/opo/230504/economy'
    },
    {
      flightNumber: 'TP1924',
      airline: 'TAP Portugal',
      departure: {
        airport: origin,
        scheduled: `${date}T14:30:00Z`
      },
      arrival: {
        airport: destination,
        scheduled: `${date}T16:40:00Z`
      },
      duration: '2h 10m',
      price: '145,75 EUR',
      stops: 'Direto',
      url: 'https://www.skyscanner.pt/transport/flights/lis/opo/230504/economy'
    },
    {
      flightNumber: 'FR1001',
      airline: 'Ryanair',
      departure: {
        airport: origin,
        scheduled: `${date}T06:20:00Z`
      },
      arrival: {
        airport: destination,
        scheduled: `${date}T08:15:00Z`
      },
      duration: '1h 55m',
      price: '99,99 EUR',
      stops: 'Direto',
      url: 'https://www.skyscanner.pt/transport/flights/lis/opo/230504/economy'
    }
  ];
}

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