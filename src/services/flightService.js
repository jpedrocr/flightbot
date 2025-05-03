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
    // Em ambiente de desenvolvimento, usamos dados mockados se a flag estiver ativa
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
      console.log('Usando dados mockados para searchFlights');
      return getMockFlightData(origin, destination, date);
    }

    console.log(`Iniciando busca de voos de ${origin} para ${destination} em ${date}`);

    // Configuração do navegador Puppeteer
    const browser = await puppeteer.launch({
      headless: false, // Modo visível para debug
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1366,768',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1366,
        height: 768
      },
      slowMo: 50 // Desacelera as ações para melhor visualização
    });
    const page = await browser.newPage();
    
    // Manipular diálogos (popups)
    page.on('dialog', async dialog => {
      console.log(`Dialog ${dialog.type()} apareceu: ${dialog.message()}`);
      await dialog.dismiss();
    });

    try {
      // Configurações iniciais da página
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Formatação da data para o formato correto (YYMMDD)
      const formattedDate = formatDateForSkyscanner(date);
      
      // Usar o link direto fornecido, mas substituir os códigos de aeroporto e data
      // Formato da URL: https://www.skyscanner.pt/transport/flights/opo/osl/250517/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false
      const searchUrl = `https://www.skyscanner.pt/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${formattedDate}/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
      
      console.log(`Acessando URL: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 90000 });

      // Lidar com popups/cookies
      try {
        console.log('Verificando se há popup de cookies...');
        const cookieSelector = 'button[id="acceptCookieButton"]';
        await page.waitForSelector(cookieSelector, { timeout: 10000 });
        console.log('Botão de cookies encontrado, clicando...');
        await page.click(cookieSelector);
        console.log('Cookies aceitos');
      } catch (error) {
        console.log('Nenhum popup de cookies encontrado ou já foi aceito');
      }

      // Aguardar carregamento dos resultados
      console.log('Aguardando resultados...');
      await page.waitForSelector('[data-testid="itinerary-card"], [data-testid="flight-card"], .FlightsResults_dayViewItems__YjlJN', { timeout: 60000 });
      console.log('Resultados carregados!');

      // Adicionar atraso para debug e visualização
      console.log('Aguardando 5 segundos para visualização...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Capturar screenshot para debug
      await page.screenshot({ path: 'screenshots/search-results.png', fullPage: true });
      console.log('Screenshot salvo em screenshots/search-results.png');

      // Extrair dados dos voos - usando vários seletores possíveis
      console.log('Extraindo dados dos voos...');
      
      // Tentativa com seletores principais
      let flights = await extractFlightsData(page, date, origin, destination);
      
      if (flights.length === 0) {
        console.log('Nenhum resultado encontrado com seletores principais, tentando seletores alternativos...');
        // Se não encontrou resultados, tente seletores alternativos
        flights = await extractFlightsDataAlternative(page, date, origin, destination);
      }

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

      // Imprimir resultados para debug
      console.log('Resultados encontrados:');
      console.log(JSON.stringify(sortedFlights, null, 2));

      // Aguardar mais alguns segundos antes de fechar
      console.log('Aguardando 3 segundos antes de fechar o navegador...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      await browser.close();
      return sortedFlights;

    } catch (error) {
      console.error('Erro durante o scraping:', error);
      // Manter o navegador aberto por mais tempo em caso de erro para debug
      console.log('Erro detectado. Mantendo o navegador aberto por 15 segundos para debug...');
      
      // Tentar salvar screenshot do estado atual
      try {
        await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
        console.log('Screenshot do erro salvo em screenshots/error-state.png');
      } catch (screenshotError) {
        console.error('Erro ao tirar screenshot:', screenshotError);
      }
      
      await new Promise(resolve => setTimeout(resolve, 15000));
      await browser.close();
      throw new Error(`Falha na busca de voos: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro geral:', error);
    throw new Error(`Erro ao buscar voos: ${error.message}`);
  }
};

// Função para extrair dados dos voos com seletores principais
async function extractFlightsData(page, date, origin, destination) {
  try {
    return await page.$$eval('[data-testid="itinerary-card"], [data-testid="flight-card"]', (flightCards, date, origin, destination) => {
      return flightCards.map(card => {
        const getText = (selector) => 
          card.querySelector(selector)?.textContent?.trim() || 'N/A';

        // Extração dos dados principais
        const airline = getText('[data-testid="carrier"]') || 
                       getText('[data-testid="leg-carrier"]') || 
                       getText('.BpkText_bpk-text--xs__MzNkM');
                       
        const price = getText('[data-testid="price"]') || 
                     getText('.Price_mainPriceContainer__MDMyM');
                     
        const duration = getText('[data-testid="duration"]') || 
                        getText('.Duration_duration__NmUyZ');
                        
        const stops = getText('[data-testid="stops"]') || 
                     getText('.LegInfo_routePartialDepart__NzEwY');

        // Extração de horários
        const departureTime = getText('[data-testid="departure-time"]') || 
                             getText('.LegInfo_routePartialTime__OTQ0Z');
                             
        const arrivalTime = getText('[data-testid="arrival-time"]') || 
                           getText('.LegInfo_routePartialTime__OTQ0Z:nth-child(2)');

        // Extração de aeroportos
        const departureAirport = getText('[data-testid="departure-airport"]') || origin;
        const arrivalAirport = getText('[data-testid="arrival-airport"]') || destination;

        // Criando objeto de retorno
        return {
          flightNumber: 'N/A', // Skyscanner geralmente não mostra o número do voo diretamente
          airline,
          departure: {
            airport: departureAirport,
            scheduled: departureTime ? `${date}T${departureTime.replace(':', '')}:00Z` : null
          },
          arrival: {
            airport: arrivalAirport,
            scheduled: arrivalTime ? `${date}T${arrivalTime.replace(':', '')}:00Z` : null
          },
          duration,
          price,
          stops: stops.replace(/\n/g, ' ').trim(),
          url: card.closest('a')?.href || null
        };
      });
    }, date, origin, destination);
  } catch (error) {
    console.error('Erro ao extrair dados dos voos:', error);
    return [];
  }
}

// Função para extrair dados dos voos com seletores alternativos
async function extractFlightsDataAlternative(page, date, origin, destination) {
  try {
    // Capturar o HTML para análise manual mais tarde se necessário
    const html = await page.content();
    console.log('Tamanho do HTML capturado:', html.length);
    
    // Tentar um conjunto diferente de seletores
    return await page.evaluate((date, origin, destination) => {
      // Buscar todos os contêineres de voos com seletores mais genéricos
      const flightCards = Array.from(document.querySelectorAll('.FlightsResults_dayViewItems__YjlJN .FlightsResults_dayViewItem__ZWI1M, .FlightsResults_resultCard__ZDlmZ'));
      
      return flightCards.map(card => {
        // Funções auxiliares
        const getText = (selector) => {
          const element = card.querySelector(selector);
          return element ? element.textContent.trim() : 'N/A';
        };
        
        // Tente diferentes seletores para cada campo
        const airline = getText('.BpkText_bpk-text--xs__MzNkM') || 
                       getText('.UpperTicketBody_operatingCarrierLogo__NGM0O') ||
                       'N/A';
                       
        const price = getText('.Price_mainPriceContainer__MDMyM') || 
                     getText('.Price_mainPriceText__ZDVkO') ||
                     'N/A';
                     
        const duration = getText('.Duration_duration__NmUyZ') || 
                        getText('.UpperTicketBody_routePartialDuration__Y2U1M') ||
                        'N/A';
                        
        const stops = getText('.LegInfo_routePartialDepart__NzEwY') || 
                     getText('.LegInfo_stopsLabelContainer__Y2U4Y') ||
                     'Direto';

        // Tempos de partida e chegada
        const departureTime = getText('.LegInfo_routePartialTime__OTQ0Z') || 
                             getText('.UpperTicketBody_routePartialTime__ODM3N:first-child') ||
                             '00:00';
                             
        const arrivalTime = getText('.LegInfo_routePartialTime__OTQ0Z:nth-child(2)') || 
                           getText('.UpperTicketBody_routePartialTime__ODM3N:last-child') ||
                           '00:00';

        // Criar e retornar o objeto de voo
        return {
          flightNumber: 'N/A',
          airline,
          departure: {
            airport: origin,
            scheduled: `${date}T${departureTime.replace(':', '')}:00Z`
          },
          arrival: {
            airport: destination,
            scheduled: `${date}T${arrivalTime.replace(':', '')}:00Z`
          },
          duration,
          price,
          stops: stops.replace(/\n/g, ' ').trim(),
          url: window.location.href
        };
      });
    }, date, origin, destination);
  } catch (error) {
    console.error('Erro ao extrair dados alternativos dos voos:', error);
    return [];
  }
}

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
  
  // Obtém as últimas duas cifras do ano e mantém os outros componentes
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