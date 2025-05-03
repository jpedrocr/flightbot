# Documentação da API do FlightBot

Esta documentação descreve os endpoints disponíveis na API do FlightBot.

## Base URL

```
https://api.flightbot.exemplo.com
```

Para ambiente de desenvolvimento:

```
http://localhost:3000
```

## Endpoints

### Obter Informações de Voo

Recupera detalhes sobre um voo específico.

```
GET /api/flights/info/:flightNumber
```

#### Parâmetros

| Parâmetro    | Tipo   | Descrição           |
|--------------|--------|--------------------|
| flightNumber | string | Número do voo (ex: TP1920) |

#### Resposta de Exemplo

```json
{
  "flightNumber": "TP1920",
  "airline": "TAP Portugal",
  "departure": {
    "airport": "LIS",
    "scheduled": "2025-05-04T10:30:00Z",
    "terminal": "1",
    "gate": "A12"
  },
  "arrival": {
    "airport": "OPO",
    "scheduled": "2025-05-04T11:35:00Z",
    "terminal": "2",
    "gate": "B5"
  },
  "status": "On Time",
  "aircraft": "Airbus A320"
}
```

### Buscar Voos

Pesquisa voos disponíveis entre aeroportos usando web scraping do Skyscanner.

```
GET /api/flights/search
```

#### Parâmetros

| Parâmetro    | Tipo   | Descrição           | Obrigatório |
|--------------|--------|--------------------|------------|
| origin       | string | Código IATA do aeroporto de origem (ex: LIS) | Sim |
| destination  | string | Código IATA do aeroporto de destino (ex: OPO) | Sim |
| date         | string | Data do voo (formato YYYY-MM-DD) | Sim |

#### Resposta de Exemplo

```json
[
  {
    "flightNumber": "FR1001",
    "airline": "Ryanair",
    "departure": {
      "airport": "LIS",
      "scheduled": "2025-05-04T06:20:00Z"
    },
    "arrival": {
      "airport": "OPO",
      "scheduled": "2025-05-04T08:15:00Z"
    },
    "duration": "1h 55m",
    "price": "99,99 EUR",
    "stops": "Direto",
    "url": "https://www.skyscanner.pt/transport/flights/lis/opo/230504/economy"
  },
  {
    "flightNumber": "TP1920",
    "airline": "TAP Portugal",
    "departure": {
      "airport": "LIS",
      "scheduled": "2025-05-04T08:15:00Z"
    },
    "arrival": {
      "airport": "OPO",
      "scheduled": "2025-05-04T10:25:00Z"
    },
    "duration": "2h 10m",
    "price": "120,50 EUR",
    "stops": "Direto",
    "url": "https://www.skyscanner.pt/transport/flights/lis/opo/230504/economy"
  }
]
```

### Configurar Alerta de Voo

Configura um alerta para receber atualizações sobre um voo específico.

```
POST /api/flights/alerts
```

#### Payload

```json
{
  "flightNumber": "TP1920",
  "contactInfo": "usuario@exemplo.com",
  "alertType": "departure"
}
```

| Campo        | Tipo   | Descrição           | Valores Possíveis |
|--------------|--------|--------------------|------------------|
| flightNumber | string | Número do voo      | Qualquer número de voo válido |
| contactInfo  | string | Email ou telefone para notificações | Email ou número de telefone |
| alertType    | string | Tipo de alerta     | "departure", "arrival", "delay", "all" |

#### Resposta de Exemplo

```json
{
  "message": "Alerta configurado com sucesso",
  "alertId": "alert-1682541245789"
}
```

### Verificar Status de Alerta

Obtém o status atual de um alerta configurado.

```
GET /api/flights/alerts/:id
```

#### Parâmetros

| Parâmetro | Tipo   | Descrição           |
|-----------|--------|--------------------|
| id        | string | ID do alerta       |

#### Resposta de Exemplo

```json
{
  "alertId": "alert-1682541245789",
  "flightNumber": "TP1920",
  "status": "ativo",
  "lastCheck": "2025-05-03T12:15:22Z",
  "notifications": [
    {
      "timestamp": "2025-05-03T11:15:22Z",
      "message": "Voo confirmado, sem alterações"
    }
  ]
}
```

## Códigos de Status

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Parâmetros inválidos ou ausentes
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

## Autenticação

Autenticação será implementada em versões futuras da API.

## Implementação de Web Scraping

A busca de voos (`/api/flights/search`) é realizada através de web scraping no site do Skyscanner, permitindo obter os seguintes dados:

- Companhias aéreas disponíveis
- Preços (o mais barato para classe econômica)
- Horários de partida e chegada
- Duração do voo
- Informações sobre escalas

O sistema está configurado para:
- Ordenar os resultados pelo preço mais baixo
- Apresentar apenas voos válidos (com informações completas)
- Tratar possíveis erros de conexão ou estrutura do site

Em ambiente de desenvolvimento, é possível usar dados mockados definindo a variável de ambiente `USE_MOCK_DATA=true`.