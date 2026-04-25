# =============================================================
#  smoke-test.ps1
#  Hits the running API and confirms the happy-path lifecycle:
#    health -> create -> submit -> approve -> sync-to-BC.
#
#  Usage:
#     .\scripts\smoke-test.ps1
#     .\scripts\smoke-test.ps1 -BaseUrl http://localhost:8000
# =============================================================
param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param([string]$Title, [scriptblock]$Block)
    Write-Host ""
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Block
}

Invoke-Step "Health check" {
    $h = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
    Write-Host ("    status={0}  bc_mode={1}  version={2}" -f $h.status, $h.bc_mode, $h.version)
    if ($h.status -ne "ok") { throw "API not healthy" }
}

$created = $null
Invoke-Step "Create draft request" {
    $body = @{
        description    = "Smoke test request"
        requester      = "smoke-tester"
        department     = "QA"
        vendor_no      = "V0001"
        vendor_name    = "Smoke Vendor"
        currency_code  = "TWD"
        lines = @(
            @{ item_no = "ITEM-SMOKE"; description = "Smoke item"; quantity = 2; unit_price = 8000 }
        )
    } | ConvertTo-Json -Depth 5

    $script:created = Invoke-RestMethod -Uri "$BaseUrl/api/purchase-requests" -Method POST -Body $body -ContentType "application/json"
    Write-Host ("    id={0}  number={1}  total={2}" -f $script:created.id, $script:created.number, $script:created.total_amount)
}

Invoke-Step "Submit for approval" {
    $url = "$BaseUrl/api/purchase-requests/$($script:created.id)/submit"
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body '{"actor":"smoke-tester"}'
    if ($r.status -ne "Submitted") { throw "Expected Submitted, got $($r.status)" }
    Write-Host "    status=Submitted ✓"
}

Invoke-Step "Approve" {
    $url = "$BaseUrl/api/purchase-requests/$($script:created.id)/approve"
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body '{"actor":"manager","comment":"smoke ok"}'
    if ($r.status -ne "Approved") { throw "Expected Approved, got $($r.status)" }
    Write-Host "    status=Approved ✓"
}

Invoke-Step "Sync to Business Central" {
    $url = "$BaseUrl/api/purchase-requests/$($script:created.id)/sync-to-bc"
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json"
    if ($r.status -ne "Synced") { throw "Expected Synced, got $($r.status)" }
    Write-Host ("    status=Synced  bc_document_id={0} ✓" -f $r.bc_document_id)
}

Invoke-Step "Audit log present" {
    $logs = Invoke-RestMethod -Uri "$BaseUrl/api/audit-logs?target_id=$($script:created.id)" -Method GET
    Write-Host ("    audit entries={0}" -f $logs.Count)
    if ($logs.Count -lt 4) { throw "Expected at least 4 audit entries (create/submit/approve/sync)" }
}

Write-Host ""
Write-Host "✅  Smoke test passed." -ForegroundColor Green
