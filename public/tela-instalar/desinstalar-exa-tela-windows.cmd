@echo off
rem ======================================================================
rem  EXA Tela - desinstalador para Windows
rem  Para a tela, tira a abertura automatica e devolve as configuracoes
rem  do Windows como estavam antes da instalacao.
rem ======================================================================
chcp 65001 >nul
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = Get-Content -Raw -Encoding UTF8 -LiteralPath '%~f0'; $i = $t.LastIndexOf('<#EXA-PS#>'); Invoke-Expression $t.Substring($i + 10)"
echo.
pause
exit /b

<#EXA-PS#>
$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$PASTA = 'C:\ExaTela'
$TAREFA = 'EXA Tela'
function Ok($txt) { Write-Host "    OK  $txt" -ForegroundColor Green }
function Aviso($txt) { Write-Host "    !   $txt" -ForegroundColor Yellow }

Write-Host ''
Write-Host '  EXA Tela - desinstalação' -ForegroundColor White

# 1. para a abertura automática e fecha a tela
Unregister-ScheduledTask -TaskName $TAREFA -Confirm:$false -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*abrir-tela.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$PASTA\perfil*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Ok 'tela fechada e abertura automática removida'

# 2. devolve registro, serviços e tarefas como estavam
$arq = "$PASTA\estado-anterior.json"
if (Test-Path $arq) {
  # no PowerShell 5.1 o ConvertFrom-Json entrega a lista inteira como UM objeto: desembrulha item a item
  $itens = @((Get-Content -Raw -Encoding UTF8 $arq | ConvertFrom-Json) | ForEach-Object { $_ })
  [array]::Reverse($itens)
  foreach ($e in $itens) {
    try {
      switch ($e.tipo) {
        'reg' {
          if ($e.existia) { New-ItemProperty -Path $e.caminho -Name $e.nome -Value $e.valor -PropertyType $e.tipoValor -Force | Out-Null }
          else { Remove-ItemProperty -Path $e.caminho -Name $e.nome -ErrorAction SilentlyContinue }
        }
        'servico' {
          $modo = switch ($e.modo) { 'Auto' { 'auto' } 'Manual' { 'demand' } 'Disabled' { 'disabled' } default { 'demand' } }
          & sc.exe config $e.nome start= $modo | Out-Null
          if ($modo -ne 'disabled') { Start-Service -Name $e.nome -ErrorAction SilentlyContinue }
        }
        'tarefa' { Enable-ScheduledTask -TaskPath $e.caminho -TaskName $e.nome -ErrorAction SilentlyContinue | Out-Null }
        'arquivo' { Remove-Item -LiteralPath $e.caminho -Force -ErrorAction SilentlyContinue }
      }
    } catch { Aviso "não deu para desfazer $($e.tipo) $($e.nome): $($_.Exception.Message)" }
  }
  Ok 'Windows Update, notificações, Edge e login automático voltaram como estavam'
} else {
  Aviso 'não achei o registro da instalação; religando só o Windows Update'
  & sc.exe config wuauserv start= demand | Out-Null
  & sc.exe config UsoSvc start= auto | Out-Null
  Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU' -Name 'NoAutoUpdate' -ErrorAction SilentlyContinue
}

# 3. energia: volta a apagar a tela depois de 10 min e dormir depois de 30 min (na tomada)
& powercfg /change monitor-timeout-ac 10 | Out-Null
& powercfg /change standby-timeout-ac 30 | Out-Null
& powercfg /hibernate on | Out-Null
Ok 'energia no padrão'

# 4. apaga a pasta da tela (perfil do navegador e vídeos guardados)
Remove-Item -LiteralPath $PASTA -Recurse -Force -ErrorAction SilentlyContinue
Ok "pasta $PASTA apagada"

Write-Host ''
Write-Host '  Pronto. Para tirar a tela também do painel EXA: Telas > (esta tela) > Desparear.' -ForegroundColor Green
