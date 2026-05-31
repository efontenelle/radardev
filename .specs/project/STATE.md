# State

_Persistent memory across sessions. Updated at pause/resume points._

## Decisions

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-001 | Métricas individuais e Code Review ficam no v2 | Foco no v1 em métricas de fluxo do time | 2026-05-30 |
| D-002 | Configurações salvas por usuário (não por projeto/org) | Cada usuário configura sua própria visão do board | 2026-05-30 |
| D-003 | Suporte a um único projeto Azure DevOps por instalação | Simplifica v1; multi-projeto entra em versão futura | 2026-05-30 |
| D-004 | PAT como configuração central do sistema | Não há autenticação individual por usuário no v1 | 2026-05-30 |
| D-005 | Age of Work Items usa mesma config de colunas do Cycle Time | Consistência nas métricas; configuração única | 2026-05-30 |
| D-006 | Azure DevOps REST API v7.1 | Versão estável mais recente | 2026-05-30 |
| D-007 | IHttpClientFactory (named client) para integração Azure DevOps | Gerenciamento correto do ciclo de vida do HttpClient | 2026-05-30 |
| D-008 | IValidateOptions para AzureDevOpsConfig | Falha rápida na inicialização se config ausente | 2026-05-30 |
| D-009 | Header X-User-Name para identificar usuário nas requests | Convenção limpa sem poluir body/query params | 2026-05-30 |
| D-010 | Batch máximo de 200 IDs por request ao Azure DevOps | Limite do endpoint GET /wit/workitems?ids= | 2026-05-30 |
| D-011 | Configurações de colunas/lanes persistidas no frontend (localStorage) | Sem necessidade de backend de persistência; simplifica M2 | 2026-05-31 |
| D-012 | Cycle Time exibido como scatter plot + percentis P50/P75/P95 | Visualização padrão Flow Metrics: scatter mostra distribuição, percentis dão referência de SLA | 2026-05-31 |
| D-013 | Throughput exibido como gráfico de barras por semana ISO | Granularidade semanal é mais estável que diária para times ágeis | 2026-05-31 |
| D-014 | Config incompleta ou ausente redireciona automaticamente para /settings | Evita que o dashboard M3 seja acessado sem configuração válida | 2026-05-31 |
| D-015 | Incompatibilidade entre config salva e colunas atuais do board é detectada e força reconfiguração | Colunas podem mudar no Azure DevOps; config stale causaria métricas incorretas | 2026-05-31 |
| D-016 | Métricas calculadas no backend via novo endpoint; frontend envia config (colunas/lanes) + período | Evita N+1 (histórico é 1 chamada por work item); centraliza lógica de mapeamento coluna→estado | 2026-05-31 |
| D-017 | Gráficos com Chart.js via ng2-charts | Lib madura e leve, scatter + bar nativos, ampla comunidade | 2026-05-31 |
| D-018 | Conclusão de card = ENTRADA na coluna de fim (não saída) | Coluna de fim costuma ser terminal (Done/Closed); "saída" zeraria métricas. Cycle Time = entrada início → entrada fim; Throughput conta entradas na coluna de fim | 2026-05-31 |

## Blockers

| ID | Blocker | Feature | Status |
|----|---------|---------|--------|
| FUND-RISK-01 | ~~A API do Azure DevOps expõe histórico de transições de estado dos work items?~~ **RESOLVIDO** — API v7.1 expõe via `GET /wit/workitems/{id}/updates`. Campo `System.State` nas atualizações permite reconstruir transições. | M1 — Integração Azure DevOps | ✅ Resolvido em design |

## Todos

- [ ] Mapear codebase existente (se houver código já iniciado)
- [x] Definir features do ROADMAP.md
- [x] Especificar feature: configuração de colunas/lanes
- [x] Design M2 (componentes, BoardConfigService, routing /settings)
- [x] Tasks M2
- [x] Especificar feature: dashboard principal (Cycle Time, Throughput, Age) — M3 spec.md criada
- [x] Design M3 (endpoint de métricas, componentes do dashboard, integração Chart.js) — design.md criado
- [x] Tasks M3 — tasks.md criado (T1–T13)
- [x] Executar M3

## Lessons Learned

_None yet_

## Deferred Ideas

- Métricas individuais por desenvolvedor (v2)
- Métricas de Code Review do time (v2)
- Suporte a múltiplos projetos/organizações (v2)
- PAT por usuário / autenticação individual (v2)

## Preferences

_None recorded_
