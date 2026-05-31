# RadarDev

Dashboard de métricas Kanban integrado ao Azure DevOps. Visualize o fluxo do seu board com métricas de throughput, cycle time, age of work items e Cumulative Flow Diagram (CFD).

## Funcionalidades

- Conexão com Azure DevOps via Personal Access Token (PAT)
- Visualização do board Kanban com colunas e estados
- Métricas de fluxo:
  - **Throughput**: itens entregues por período
  - **Cycle Time**: tempo de ciclo por item
  - **Age of Work Items**: idade dos itens em progresso
  - **CFD**: gráfico de fluxo cumulativo

## Stack

- **Backend**: ASP.NET Core 8 (C#) — API REST que consome a API do Azure DevOps
- **Frontend**: Angular 18 com ng2-charts (Chart.js)

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) e npm
- Conta no Azure DevOps com um board Kanban configurado
- Personal Access Token (PAT) do Azure DevOps com permissão **Work Items (Read)**

## Configuração

### Backend

1. Copie o arquivo de configuração de exemplo:

```bash
cd backend/RadarDev.Api
cp appsettings.Development.json appsettings.Local.json
```

2. Edite `appsettings.Local.json` com suas credenciais:

```json
{
  "AzureDevOps": {
    "Pat": "seu-pat-aqui",
    "Organization": "sua-organizacao",
    "Project": "seu-projeto",
    "BoardName": "nome-do-board",
    "TeamName": "nome-do-time"
  }
}
```

> `appsettings.Local.json` está no `.gitignore` — suas credenciais nunca serão commitadas.

3. Execute o backend:

```bash
cd backend/RadarDev.Api
dotnet run
```

A API ficará disponível em `https://localhost:7000`.

### Frontend

```bash
cd frontend/radar-dev
npm install
npm start
```

O app abrirá em `http://localhost:4200`.

## Scripts utilitários

`scripts/seed-workitems.ps1` — cria massa de dados de teste no Azure DevOps.

```powershell
$env:AZURE_DEVOPS_PAT = "seu-pat"
.\scripts\seed-workitems.ps1
```

## Estrutura do projeto

```
radardev/
├── backend/
│   └── RadarDev.Api/          # ASP.NET Core API
│       ├── Configuration/     # Configuração do Azure DevOps
│       ├── Models/            # DTOs e modelos raw
│       └── Services/          # BoardService, AzureDevOpsService
├── frontend/
│   └── radar-dev/             # Angular app
│       └── src/app/
│           ├── core/          # Componentes base (shell, modal)
│           └── features/      # Dashboard, Board Settings
└── scripts/                   # Scripts utilitários
```

## Licença

MIT
