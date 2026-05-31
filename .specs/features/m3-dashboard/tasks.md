# M3 — Dashboard de Delivery: Tasks

**Design**: `.specs/features/m3-dashboard/design.md`
**Status**: ✅ Done — T1–T13 concluídos

**Gate padrão**: backend → `dotnet build`; frontend → `ng build` (sem testes automatizados, igual M1/M2)

---

## Execution Plan

### Backend (Sequential)

```
T1 ──→ T2 ──→ T3 ──→ T4
```

### Frontend (paralelo ao backend)

```
T5 ──┬──────────────→ T6 ──┐
     ├→ T9 ─┐               │
T7 ──┴→ T10 ┤               │
     T8 ────┤               │
T5 ──→ T11 ─┴──────────────→├──→ T12
                            │
                T6,T8,T9,T10,T11 ──→ T12
```

### Integração (após T4 + T12)

```
T4 + T12 ──→ T13
```

---

## Task Breakdown

### T1: DTOs de métricas (request + response)

**What**: Criar os records de request e response do endpoint de métricas
**Where**: `backend/RadarDev.Api/Models/Dtos/MetricsRequestDto.cs` e `MetricsResponseDto.cs`
**Depends on**: Nenhuma
**Reuses**: Padrão `record` dos DTOs existentes (`WorkItemDto`, `BoardDto`)
**Requirement**: DASH-11

**Tools**: Skill: NONE

**Done when**:
- [ ] `MetricsRequestDto(string StartColumn, string EndColumn, List<string> SelectedLanes, DateTime From, DateTime To)`
- [ ] `MetricsResponseDto(IEnumerable<CycleTimePointDto> CycleTime, CyclePercentilesDto Percentiles, IEnumerable<ThroughputWeekDto> Throughput, IEnumerable<AgeItemDto> Age)`
- [ ] Sub-records: `CycleTimePointDto(int Id, string Title, DateTime DeliveredDate, double CycleTimeDays)`, `CyclePercentilesDto(double P85, double P90)`, `ThroughputWeekDto(int IsoYear, int IsoWeek, DateTime WeekStart, int Count)`, `AgeItemDto(int Id, string Title, string Type, double AgeDays)`
- [ ] Gate: `dotnet build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(backend): add metrics request/response DTOs`

---

### T2: FlowMetricsCalculator (lógica pura)

**What**: Criar a classe de cálculo puro: reconstrução de transições por card, percentis e ISO-week
**Where**: `backend/RadarDev.Api/Services/FlowMetricsCalculator.cs`
**Depends on**: T1
**Reuses**: `WorkItemUpdateRaw` (`Fields.State.NewValue`, `RevisedDate`)
**Requirement**: DASH-01, DASH-03, DASH-05, DASH-07, DASH-12

**Tools**: Skill: NONE

**Done when**:
- [ ] `Compute(IEnumerable<WorkItemUpdateRaw> updates, ISet<string> startStates, ISet<string> endStates)` retorna `EntryStart`/`EntryEnd` (nullable)
- [ ] `EntryStart` = menor `RevisedDate` com `NewValue ∈ startStates`; `EntryEnd` = menor `RevisedDate` com `NewValue ∈ endStates` (D-018)
- [ ] `static double Percentile(IReadOnlyList<double> values, int p)` com interpolação linear (P85/P90)
- [ ] `static (int isoYear, int isoWeek) IsoWeek(DateTime date)` usando `ISOWeek`
- [ ] Cycle time `≤ 0` é descartável pelo chamador (método expõe os dados, regra documentada)
- [ ] Gate: `dotnet build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(backend): add FlowMetricsCalculator pure logic`

---

### T3: MetricsService (orquestração + agregação)

**What**: Criar o serviço que coleta dados do Azure DevOps, valida config, aplica filtro de lane e agrega as 3 métricas
**Where**: `backend/RadarDev.Api/Services/MetricsService.cs`
**Depends on**: T1, T2
**Reuses**: `IAzureDevOpsService` (WIQL, batch, updates, board), `FlowMetricsCalculator`
**Requirement**: DASH-01, DASH-05, DASH-07, DASH-11, DASH-12, DASH-13

**Tools**: Skill: NONE

**Done when**:
- [ ] `IMetricsService` + `MetricsService` com `Task<MetricsResponseDto> CalculateAsync(MetricsRequestDto request)`
- [ ] `GetBoardAsync()` resolve `startStates`/`endStates` via `StateMappings`; se coluna inexistente → lança exceção mapeável para `400`
- [ ] Query de candidatos: WIQL por `ChangedDate ∈ [from,to]` + WIQL de itens em estados ativos; une os IDs distintos
- [ ] `updates` paralelizados via `Task.WhenAll` em lotes (~10)
- [ ] Classifica completados (EntryEnd ∈ período) e ativos; CycleTime `≤ 0` excluído
- [ ] Throughput agrupado por semana ISO incluindo semanas com zero no intervalo
- [ ] Age ordenado desc por dias
- [ ] Filtro de lane aplicado; **fallback documentado**: se o campo de lane não for recuperável, incluir todos e logar warning (ver incerteza #1 do design)
- [ ] Gate: `dotnet build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(backend): add MetricsService with flow metrics aggregation`

---

### T4: MetricsController + DI

**What**: Expor `POST /api/metrics` e registrar o serviço no container
**Where**: `backend/RadarDev.Api/Controllers/MetricsController.cs` + `Program.cs` (modificar)
**Depends on**: T3
**Reuses**: Padrão `WorkItemsController` (ApiController, header `X-User-Name`); `Program.cs` `AddScoped`
**Requirement**: DASH-11, DASH-13

**Tools**: Skill: NONE

**Done when**:
- [ ] `[HttpPost]` em `api/metrics` recebe `MetricsRequestDto` no body e header `X-User-Name` opcional
- [ ] Retorna `200 MetricsResponseDto`; config inconsistente → `400` (BadRequest com mensagem)
- [ ] `builder.Services.AddScoped<IMetricsService, MetricsService>();` em `Program.cs`
- [ ] `FlowMetricsCalculator` registrado (ou usado como classe estática/instanciada no service)
- [ ] Gate: `dotnet build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(backend): add MetricsController and DI registration`

---

### T5: Modelos TypeScript de métricas

**What**: Espelhar os DTOs do backend em interfaces TS
**Where**: `frontend/radar-dev/src/app/core/models/metrics.model.ts`
**Depends on**: Nenhuma
**Reuses**: Padrão das models existentes (`work-item.model.ts`)
**Requirement**: DASH-11

**Tools**: Skill: NONE

**Done when**:
- [ ] `MetricsRequest`, `MetricsResponse`, `CycleTimePoint`, `CyclePercentiles`, `ThroughputWeek`, `AgeItem`
- [ ] Campos coerentes com os DTOs de T1
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add metrics TypeScript models`

---

### T6: MetricsApiService

**What**: Cliente HTTP do endpoint de métricas
**Where**: `frontend/radar-dev/src/app/core/services/metrics-api.service.ts`
**Depends on**: T5
**Reuses**: Padrão `AzureDevOpsApiService` (HttpClient, header `X-User-Name`, `environment.apiUrl`)
**Requirement**: DASH-11

**Tools**: Skill: NONE

**Done when**:
- [ ] `getMetrics(request: MetricsRequest, userName?: string): Observable<MetricsResponse>` via `POST ${apiUrl}/api/metrics`
- [ ] Header `X-User-Name` quando `userName` presente
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add MetricsApiService`

---

### T7: Instalar e configurar ng2-charts

**What**: Adicionar Chart.js + ng2-charts e o provider de gráficos
**Where**: `frontend/radar-dev/package.json` + `src/app/app.config.ts` (modificar)
**Depends on**: Nenhuma
**Reuses**: `app.config.ts` existente (providers)
**Requirement**: DASH-02, DASH-06

**Tools**: Skill: NONE

**Done when**:
- [ ] `chart.js` e `ng2-charts` instalados (versões compatíveis com a versão do Angular do projeto)
- [ ] `provideCharts(withDefaultRegisterables())` adicionado em `app.config.ts`
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): add ng2-charts and chart.js`

---

### T8: PeriodFilterComponent

**What**: Componente de seleção de intervalo de datas com default 90 dias e validação
**Where**: `frontend/radar-dev/src/app/features/dashboard/period-filter/period-filter.component.ts` (+ html/scss)
**Depends on**: Nenhuma
**Reuses**: Padrão standalone component do projeto
**Requirement**: DASH-09, DASH-10

**Tools**: Skill: NONE

**Done when**:
- [ ] Inputs de data inicial/final; default = últimos 90 dias
- [ ] `@Output() rangeChange: EventEmitter<{from: Date; to: Date}>`
- [ ] Validação `from ≤ to`; bloqueia emissão e exibe mensagem quando inválido
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add PeriodFilterComponent`

---

### T9: CycleTimeChartComponent (scatter + percentis) [P]

**What**: Scatter plot de cycle time com linhas/painel de percentis P85/P90
**Where**: `frontend/radar-dev/src/app/features/dashboard/cycle-time-chart/cycle-time-chart.component.ts` (+ html/scss)
**Depends on**: T5, T7
**Reuses**: `ng2-charts` `baseChart` (scatter); `CycleTimePoint`, `CyclePercentiles` de T5
**Requirement**: DASH-02, DASH-03, DASH-04

**Tools**: Skill: `/frontend-design` (qualidade visual do scatter + painel de percentis)

**Done when**:
- [ ] `@Input() points: CycleTimePoint[]` e `@Input() percentiles: CyclePercentiles`
- [ ] Scatter: X = `deliveredDate`, Y = `cycleTimeDays`; tooltip com título/ID + dias
- [ ] Painel/linhas de referência P85 e P90
- [ ] Estado vazio quando `points` vazio
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add CycleTimeChartComponent`

---

### T10: ThroughputChartComponent (barras) [P]

**What**: Gráfico de barras de throughput por semana ISO
**Where**: `frontend/radar-dev/src/app/features/dashboard/throughput-chart/throughput-chart.component.ts` (+ html/scss)
**Depends on**: T5, T7
**Reuses**: `ng2-charts` `baseChart` (bar); `ThroughputWeek` de T5
**Requirement**: DASH-05, DASH-06

**Tools**: Skill: `/frontend-design` (qualidade visual do gráfico de barras)

**Done when**:
- [ ] `@Input() weeks: ThroughputWeek[]`
- [ ] 1 barra por semana ISO (inclui semanas com zero); tooltip com semana + contagem
- [ ] Estado vazio quando sem dados
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add ThroughputChartComponent`

---

### T11: AgeRankingComponent (tabela) [P]

**What**: Tabela/ranking de cards ativos ordenada por age decrescente
**Where**: `frontend/radar-dev/src/app/features/dashboard/age-ranking/age-ranking.component.ts` (+ html/scss)
**Depends on**: T5
**Reuses**: `AgeItem` de T5; padrão standalone component
**Requirement**: DASH-07, DASH-08

**Tools**: Skill: NONE

**Done when**:
- [ ] `@Input() items: AgeItem[]`
- [ ] Tabela com colunas: título, tipo, age (dias); ordenada desc por age
- [ ] Estado vazio "Nenhum card ativo no fluxo"
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add AgeRankingComponent`

---

### T12: DashboardComponent (orquestração)

**What**: Substituir o placeholder pelo dashboard que integra filtro + config + chamada de métricas + 3 visualizações, com loading/erro/vazio
**Where**: `frontend/radar-dev/src/app/features/dashboard/dashboard.component.ts` (+ html/scss)
**Depends on**: T6, T8, T9, T10, T11
**Reuses**: `BoardConfigService` (M2), `UserService`, `MetricsApiService`, sub-componentes
**Requirement**: DASH-09, DASH-10, DASH-14, DASH-15

**Tools**: Skill: NONE

**Done when**:
- [ ] Lê `BoardConfig` via `BoardConfigService.getConfig()`; monta `MetricsRequest` com período (default 90d)
- [ ] Chama `MetricsApiService.getMetrics()`; distribui response aos componentes filhos
- [ ] `rangeChange` do filtro dispara novo cálculo
- [ ] Estados de loading e erro (com "Tentar novamente"); `400` → redireciona para `/settings`
- [ ] Layout com filtro no topo e 3 seções identificadas
- [ ] Gate: `ng build` passa sem erros

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): add DashboardComponent integrating metrics and charts`

---

### T13: Verificação de integração M3

**What**: Verificar o fluxo completo no browser com backend rodando
**Where**: Verificação manual — sem arquivos novos
**Depends on**: T4, T12
**Reuses**: Todos os artefatos do M3
**Requirement**: DASH-01 a DASH-15

**Tools**: Skill: `/run`, `/verify`

**Done when**:
- [x] `dotnet build` e `ng build` passam sem erros
- [x] Acessar `/` com config válida → dashboard carrega as 3 métricas do board real
- [x] Cycle Time: scatter com pontos + percentis P85/P90 coerentes
- [x] Throughput: barras por semana ISO (inclui semanas com zero)
- [x] Age: ranking de cards ativos ordenado desc
- [x] Alterar período → 3 métricas re-renderizam
- [x] Config inconsistente (coluna removida) → redireciona para `/settings`

**Tests**: none
**Gate**: build + run
**Commit**: _(sem commit — apenas verificação)_

---

## Parallel Execution Map

```
Backend (sequential):
  T1 ──→ T2 ──→ T3 ──→ T4

Frontend (paralelo ao backend):
  T5 (foundation)
  T7 (foundation, independe)
  T8 (independe)
    T5 ──→ T6
    T5+T7 ──→ T9  [P] ─┐
    T5+T7 ──→ T10 [P] ─┤ (T9/T10/T11 simultâneos)
    T5    ──→ T11 [P] ─┘
    T6+T8+T9+T10+T11 ──→ T12

Integração:
  T4 + T12 ──→ T13
```

---

## Task Granularity Check

| Task | Escopo | Status |
|------|--------|--------|
| T1: DTOs de métricas | 2 arquivos, records coesos | ✅ Granular |
| T2: FlowMetricsCalculator | 1 classe pura | ✅ Granular |
| T3: MetricsService | 1 serviço | ✅ Granular |
| T4: MetricsController + DI | 1 controller + registro | ✅ Granular |
| T5: Models TS | 1 arquivo | ✅ Granular |
| T6: MetricsApiService | 1 serviço | ✅ Granular |
| T7: ng2-charts setup | 1 dep + 1 provider | ✅ Granular |
| T8: PeriodFilterComponent | 1 componente | ✅ Granular |
| T9: CycleTimeChartComponent | 1 componente | ✅ Granular |
| T10: ThroughputChartComponent | 1 componente | ✅ Granular |
| T11: AgeRankingComponent | 1 componente | ✅ Granular |
| T12: DashboardComponent | 1 componente orquestrador | ✅ Granular |
| T13: Verificação | Smoke test manual | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagrama mostra | Status |
|------|-------------------|-----------------|--------|
| T1 | Nenhuma | Início backend | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T1, T2 | T2 → T3 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | Nenhuma | Foundation frontend | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | Nenhuma | Foundation | ✅ |
| T8 | Nenhuma | Independe | ✅ |
| T9 | T5, T7 | T5+T7 → T9 | ✅ |
| T10 | T5, T7 | T5+T7 → T10 | ✅ |
| T11 | T5 | T5 → T11 | ✅ |
| T12 | T6, T8, T9, T10, T11 | → T12 | ✅ |
| T13 | T4, T12 | T4+T12 → T13 | ✅ |

`[P]` em T9/T10/T11: não dependem entre si (só de T5/T7) → paralelismo válido.

---

## Test Co-location Validation

Sem `TESTING.md` — projeto segue padrão de M1/M2 (gate = build, sem testes automatizados).

| Task | Camada criada/modificada | Gate definido | Status |
|------|--------------------------|---------------|--------|
| T1 | DTOs | build | ✅ |
| T2 | Lógica pura | build | ✅ |
| T3 | Service | build | ✅ |
| T4 | Controller + DI | build | ✅ |
| T5 | Models | build | ✅ |
| T6 | Service (frontend) | build | ✅ |
| T7 | Config/deps | build | ✅ |
| T8–T12 | Componentes | build | ✅ |
| T13 | Verificação manual | build + run | ✅ |

---

## Requirement Traceability

| Requirement ID | Tasks | Status |
|----------------|-------|--------|
| DASH-01 | T2, T3 | ✅ Done |
| DASH-02 | T7, T9 | ✅ Done |
| DASH-03 | T2, T9 | ✅ Done |
| DASH-04 | T9 | ✅ Done |
| DASH-05 | T2, T3, T10 | ✅ Done |
| DASH-06 | T7, T10 | ✅ Done |
| DASH-07 | T2, T3, T11 | ✅ Done |
| DASH-08 | T11 | ✅ Done |
| DASH-09 | T8, T12 | ✅ Done |
| DASH-10 | T8, T12 | ✅ Done |
| DASH-11 | T1, T3, T4, T5, T6 | ✅ Done |
| DASH-12 | T2, T3 | ✅ Done |
| DASH-13 | T3, T4 | ✅ Done |
| DASH-14 | T12 | ✅ Done |
| DASH-15 | T12 | ✅ Done |

**Coverage:** 15 requisitos, todos mapeados para tasks ✅
