@echo off
rem ======================================================================
rem  EXA Tela - instalador para Windows 10/11
rem  Deixa este computador como tela da EXA: abre sozinho ao ligar, em
rem  tela cheia, sem dormir, sem avisos e sem Windows Update.
rem  Para desfazer: desinstalar-exa-tela-windows.cmd
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
$Host.UI.RawUI.WindowTitle = 'EXA Tela - instalador'

$URL   = 'https://examidia.com.br/tela/?plataforma=windows&app=win-1'
$PASTA = 'C:\ExaTela'
$TAREFA = 'EXA Tela'
$estado = New-Object System.Collections.ArrayList

function Passo($n, $txt) { Write-Host ''; Write-Host "[$n] $txt" -ForegroundColor Cyan }
function Ok($txt)  { Write-Host "    OK  $txt" -ForegroundColor Green }
function Aviso($txt) { Write-Host "    !   $txt" -ForegroundColor Yellow }

# grava no registro guardando o valor anterior (o desinstalador devolve tudo como estava)
function Reg($caminho, $nome, $valor, $tipo = 'DWord') {
  try {
    if (-not (Test-Path $caminho)) { New-Item -Path $caminho -Force | Out-Null }
    $antes = Get-ItemProperty -Path $caminho -Name $nome -ErrorAction SilentlyContinue
    [void]$estado.Add([pscustomobject]@{ tipo = 'reg'; caminho = $caminho; nome = $nome; existia = [bool]$antes; valor = $(if ($antes) { $antes.$nome } else { $null }); tipoValor = $tipo })
    New-ItemProperty -Path $caminho -Name $nome -Value $valor -PropertyType $tipo -Force | Out-Null
    return $true
  } catch { Aviso "não deu para mudar $caminho\$nome ($($_.Exception.Message))"; return $false }
}

function Servico($nome, $modo) {
  try {
    $s = Get-CimInstance Win32_Service -Filter "Name='$nome'" -ErrorAction Stop
    if (-not $s) { return }
    [void]$estado.Add([pscustomobject]@{ tipo = 'servico'; nome = $nome; modo = $s.StartMode })
    Stop-Service -Name $nome -Force -ErrorAction SilentlyContinue
    & sc.exe config $nome start= $modo | Out-Null
    if ($LASTEXITCODE -eq 0) { Ok "serviço $nome desativado" } else { Aviso "o Windows não deixou desativar o serviço $nome (protegido)" }
  } catch { Aviso "serviço $nome: $($_.Exception.Message)" }
}

Write-Host ''
Write-Host '  EXA Tela - instalação neste computador' -ForegroundColor White
Write-Host '  Ao terminar, a tela abre sozinha mostrando um CÓDIGO.' -ForegroundColor Gray
Write-Host '  Digite esse código no painel EXA: Telas > Adicionar tela.' -ForegroundColor Gray

New-Item -ItemType Directory -Force -Path $PASTA | Out-Null
New-Item -ItemType Directory -Force -Path "$PASTA\perfil" | Out-Null

# --- conta que vai mostrar a tela (quem está usando o Windows agora) ---
$usuarioSessao = (Get-CimInstance Win32_ComputerSystem).UserName
if (-not $usuarioSessao) { $usuarioSessao = "$env:USERDOMAIN\$env:USERNAME" }
$soNome = ($usuarioSessao -split '\\')[-1]

# --- 1. navegador ---
Passo 1 'Procurando o Microsoft Edge (já vem no Windows)'
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
  $edge = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $edge) {
  Aviso 'Edge não encontrado. Tentando instalar pelo winget...'
  try { winget install --id Microsoft.Edge -e --silent --accept-package-agreements --accept-source-agreements | Out-Null } catch {}
  $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $edge) { Write-Host '    ERRO: sem Edge nem Chrome neste computador. Instale o Microsoft Edge e rode de novo.' -ForegroundColor Red; return }
Ok $edge

# --- 2. script que abre a tela e reabre se fechar ---
Passo 2 'Criando o lançador da tela (reabre sozinho se o navegador fechar)'
$lancador = @"
# EXA Tela - abre o player em tela cheia e reabre se fechar
`$edge = '$edge'
`$perfil = '$PASTA\perfil'
`$argumentos = @('--kiosk', '$URL', '--edge-kiosk-type=fullscreen', '--no-first-run', '--autoplay-policy=no-user-gesture-required',
  '--disable-features=Translate', '--kiosk-idle-timeout-minutes=0', "--user-data-dir=`$perfil", '--disable-session-crashed-bubble',
  '--hide-crash-restore-bubble', '--noerrdialogs', '--overscroll-history-navigation=0', '--disable-pinch', '--start-fullscreen')
Start-Sleep -Seconds 8
while (`$true) {
  `$rodando = Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object { `$_.CommandLine -like "*`$perfil*" }
  if (-not `$rodando) { Start-Process -FilePath `$edge -ArgumentList `$argumentos }
  Start-Sleep -Seconds 10
}
"@
Set-Content -Path "$PASTA\abrir-tela.ps1" -Value $lancador -Encoding UTF8
Ok "$PASTA\abrir-tela.ps1"

# --- 3. abrir ao entrar no Windows ---
Passo 3 "Fazendo a tela abrir sozinha quando a conta '$soNome' entrar no Windows"
try {
  Unregister-ScheduledTask -TaskName $TAREFA -Confirm:$false -ErrorAction SilentlyContinue
  $acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PASTA\abrir-tela.ps1`""
  $gatilho = New-ScheduledTaskTrigger -AtLogOn -User $usuarioSessao
  $princ = New-ScheduledTaskPrincipal -UserId $usuarioSessao -LogonType Interactive -RunLevel Limited
  $conf = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName $TAREFA -Action $acao -Trigger $gatilho -Principal $princ -Settings $conf -Force | Out-Null
  Ok "tarefa agendada '$TAREFA' criada"
} catch {
  Aviso "tarefa agendada falhou ($($_.Exception.Message)); usando a pasta Inicializar"
  $atalho = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\EXA Tela.lnk"
  $ws = New-Object -ComObject WScript.Shell; $l = $ws.CreateShortcut($atalho)
  $l.TargetPath = 'powershell.exe'; $l.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PASTA\abrir-tela.ps1`""; $l.Save()
  [void]$estado.Add([pscustomobject]@{ tipo = 'arquivo'; caminho = $atalho })
}

# --- 4. nunca dormir nem apagar a tela ---
Passo 4 'Tela sempre ligada (sem suspensão, sem proteção de tela)'
foreach ($p in 'monitor-timeout-ac', 'monitor-timeout-dc', 'standby-timeout-ac', 'standby-timeout-dc', 'hibernate-timeout-ac', 'hibernate-timeout-dc') { & powercfg /change $p 0 | Out-Null }
& powercfg /hibernate off | Out-Null
Reg 'HKCU:\Control Panel\Desktop' 'ScreenSaveActive' '0' 'String' | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization' 'NoLockScreen' 1 | Out-Null
Ok 'energia configurada'

# --- 5. sem notificações e sem dicas/propagandas do Windows ---
Passo 5 'Desligando notificações, dicas e sugestões do Windows'
Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications' 'ToastEnabled' 0 | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer' 'DisableNotificationCenter' 1 | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent' 'DisableWindowsConsumerFeatures' 1 | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent' 'DisableSoftLanding' 1 | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent' 'DisableWindowsSpotlightFeatures' 1 | Out-Null
foreach ($n in 'SoftLandingEnabled', 'SystemPaneSuggestionsEnabled', 'SubscribedContent-338389Enabled', 'SubscribedContent-310093Enabled', 'SubscribedContent-338388Enabled') {
  Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager' $n 0 | Out-Null
}
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Error Reporting' 'DontShowUI' 1 | Out-Null
# Edge sem tela de boas-vindas, sem login, sem tradução, com vídeo tocando sozinho
$E = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
Reg $E 'HideFirstRunExperience' 1 | Out-Null
Reg $E 'AutoplayAllowed' 1 | Out-Null
Reg $E 'BrowserSignin' 0 | Out-Null
Reg $E 'SyncDisabled' 1 | Out-Null
Reg $E 'TranslateEnabled' 0 | Out-Null
Reg $E 'DefaultBrowserSettingEnabled' 0 | Out-Null
Reg $E 'ShowRecommendationsEnabled' 0 | Out-Null
Reg $E 'SpotlightExperiencesAndRecommendationsEnabled' 0 | Out-Null
Reg $E 'UserFeedbackAllowed' 0 | Out-Null
Reg $E 'PromotionalTabsEnabled' 0 | Out-Null
Reg $E 'StartupBoostEnabled' 0 | Out-Null
Ok 'notificações e dicas desligadas'

# --- 6. sem Windows Update ---
Passo 6 'Desligando o Windows Update (para a tela não reiniciar no meio do dia)'
$WU = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate'
Reg "$WU\AU" 'NoAutoUpdate' 1 | Out-Null
Reg "$WU\AU" 'AUOptions' 1 | Out-Null
Reg "$WU\AU" 'NoAutoRebootWithLoggedOnUsers' 1 | Out-Null
Reg $WU 'SetDisableUXWUAccess' 1 | Out-Null
Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' 'DODownloadMode' 0 | Out-Null
Servico 'wuauserv' 'disabled'
Servico 'UsoSvc' 'disabled'
Servico 'WaaSMedicSvc' 'disabled'
try {
  Get-ScheduledTask -TaskPath '\Microsoft\Windows\UpdateOrchestrator\' -ErrorAction Stop | ForEach-Object {
    try { Disable-ScheduledTask -TaskPath $_.TaskPath -TaskName $_.TaskName -ErrorAction Stop | Out-Null; [void]$estado.Add([pscustomobject]@{ tipo = 'tarefa'; caminho = $_.TaskPath; nome = $_.TaskName }) } catch {}
  }
} catch {}
Ok 'Windows Update desligado (o que o Windows permitiu)'

# --- 7. entrar sozinho no Windows (opcional) ---
Passo 7 'Entrar sozinho no Windows ao ligar (opcional)'
Write-Host "    Sem isso, depois de faltar energia a tela fica parada na senha do Windows." -ForegroundColor Gray
if ($env:EXA_TELA_SEM_PERGUNTAS -eq '1') { $r = 'N' } else { $r = Read-Host "    Quer que o Windows entre sozinho na conta '$soNome'? (S/N)" }
if ($r -match '^[sS]') {
  $usu = Read-Host "    Usuário (Enter = $soNome; conta Microsoft: use o e-mail)"
  if (-not $usu) { $usu = $soNome }
  $sec = Read-Host "    Senha dessa conta (fica guardada neste computador para o login automático)" -AsSecureString
  $senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
  $W = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
  Reg $W 'AutoAdminLogon' '1' 'String' | Out-Null
  Reg $W 'DefaultUserName' $usu 'String' | Out-Null
  Reg $W 'DefaultPassword' $senha 'String' | Out-Null
  Reg $W 'DefaultDomainName' $env:COMPUTERNAME 'String' | Out-Null
  # Windows 11 com "só Windows Hello": libera o login automático por senha
  Reg 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\PasswordLess\Device' 'DevicePasswordLessBuildVersion' 0 | Out-Null
  Ok 'login automático ligado'
} else { Ok 'pulado' }

# --- guarda o que foi mudado (para o desinstalador) ---
$estado | ConvertTo-Json -Depth 4 | Set-Content -Path "$PASTA\estado-anterior.json" -Encoding UTF8
Set-Content -Path "$PASTA\LEIAME.txt" -Encoding UTF8 -Value @"
EXA Tela instalada em $(Get-Date -Format 'dd/MM/yyyy HH:mm').
Endereço: $URL
Para desfazer tudo: rode desinstalar-exa-tela-windows.cmd (examidia.com.br/tela-instalar/).
"@

# --- 8. abre agora ---
Passo 8 'Abrindo a tela agora'
try { Start-ScheduledTask -TaskName $TAREFA -ErrorAction Stop; Ok 'tela abrindo' } catch {
  Start-Process powershell.exe -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PASTA\abrir-tela.ps1`""
  Ok 'tela abrindo'
}
Write-Host ''
Write-Host '  Pronto. Em alguns segundos aparece o CÓDIGO na tela.' -ForegroundColor Green
Write-Host '  No painel EXA: Telas > Adicionar tela > digite o código.' -ForegroundColor Green
Write-Host '  Para sair da tela cheia neste computador: Alt+F4 (ela volta sozinha em 10 s; para parar de vez, desinstale).' -ForegroundColor Gray
