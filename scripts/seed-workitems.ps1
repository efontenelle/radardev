# Cria massa de teste de work items no Azure DevOps
# Uso: .\seed-workitems.ps1

$pat          = $env:AZURE_DEVOPS_PAT  # ou passe como argumento: .\seed-workitems.ps1 -Pat "seu-pat"
$organization = "your-organization"
$project      = "your-project"

$token   = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{
    Authorization  = "Basic $token"
    "Content-Type" = "application/json-patch+json"
}

$baseUrl = "https://dev.azure.com/$organization/$project/_apis/wit/workitems"

function New-WorkItem($type, $title, $areaPath, $iterationPath) {
    $body = ConvertTo-Json @(
        @{ op = "add"; path = "/fields/System.Title";         value = $title }
        @{ op = "add"; path = "/fields/System.AreaPath";      value = $areaPath }
        @{ op = "add"; path = "/fields/System.IterationPath"; value = $iterationPath }
    )
    $url      = "$baseUrl/`$$type`?api-version=7.1"
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    return $response.id
}

function Set-WorkItemState($id, $state, $comment) {
    $fields = @(
        @{ op = "add"; path = "/fields/System.State"; value = $state }
    )
    if ($comment) {
        $fields += @{ op = "add"; path = "/fields/System.History"; value = $comment }
    }
    $body = ConvertTo-Json $fields
    $url  = "$baseUrl/$id`?api-version=7.1"
    Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $body | Out-Null
}

$area      = $project
$iteration = "$project"

$workItems = @(
    # Tipo          Título
    @{ Type = "User Story"; Title = "Implementar tela de login SSO" }
    @{ Type = "User Story"; Title = "Criar endpoint de listagem de boards" }
    @{ Type = "User Story"; Title = "Adicionar paginação na API" }
    @{ Type = "User Story"; Title = "Implementar dashboard de métricas Kanban" }
    @{ Type = "User Story"; Title = "Adicionar suporte a dark mode" }
    @{ Type = "User Story"; Title = "Avaliar uso de SignalR para atualizações em tempo real" }
    @{ Type = "Task";       Title = "Configurar pipeline CI/CD" }
    @{ Type = "Task";       Title = "Revisar modelo de dados de StateTransition" }
    @{ Type = "Task";       Title = "Escrever testes unitários para BoardService" }
    @{ Type = "Task";       Title = "Documentar API com OpenAPI/Swagger" }
    @{ Type = "Bug";        Title = "Corrigir NullReferenceException no WorkItemService" }
    @{ Type = "Bug";        Title = "Gráfico de CFD não renderiza corretamente no Firefox" }
)

# Estado final desejado para cada item (em ordem crescente de maturidade)
$targetStates = @("Closed","Closed","Resolved","Active","New","New","Closed","Resolved","Active","New","Closed","Active")

# Progressão de estados por tipo
$progressions = @{
    "User Story" = @("Active", "Resolved", "Closed")
    "Task"       = @("Active", "Closed")
    "Bug"        = @("Active", "Resolved", "Closed")
}

Write-Host "Criando $($workItems.Count) work items em '$project'..." -ForegroundColor Cyan

$createdIds = @()
for ($i = 0; $i -lt $workItems.Count; $i++) {
    $wi     = $workItems[$i]
    $target = $targetStates[$i]

    Write-Host "  [$($i+1)/$($workItems.Count)] $($wi.Type): $($wi.Title)" -NoNewline

    $id = New-WorkItem -type $wi.Type -title $wi.Title -areaPath $area -iterationPath $iteration
    $createdIds += $id

    # Avança pelos estados até atingir o target
    $prog = $progressions[$wi.Type]
    foreach ($state in $prog) {
        Set-WorkItemState -id $id -state $state -comment "Seed de massa de teste"
        if ($state -eq $target) { break }
    }

    Write-Host " -> #$id ($target)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Concluido! IDs criados: $($createdIds -join ', ')" -ForegroundColor Cyan
