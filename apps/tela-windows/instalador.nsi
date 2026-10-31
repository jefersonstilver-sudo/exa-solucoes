; EXA Tela - instalador .exe para Windows.
; Só empacota o instalar-exa-tela-windows.cmd (o mesmo do site) e o roda como administrador,
; numa janela onde cada passo é explicado em português.
Unicode true
Name "EXA Tela"
Caption "EXA Tela - instalação"
OutFile "instalar-exa-tela.exe"
Icon "exa.ico"
RequestExecutionLevel admin
ShowInstDetails show
BrandingText "EXA Mídia"
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "EXA Tela"
VIAddVersionKey "CompanyName" "Indexa Mídia LTDA"
VIAddVersionKey "FileDescription" "Instalador da tela EXA"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "LegalCopyright" "Indexa Mídia LTDA"

Page instfiles

Section "EXA Tela"
  SetOutPath "$TEMP\exa-tela"
  File "..\..\public\tela-instalar\instalar-exa-tela-windows.cmd"
  File "..\..\public\tela-instalar\desinstalar-exa-tela-windows.cmd"
  CreateDirectory "C:\ExaTela"
  CopyFiles /SILENT "$TEMP\exa-tela\desinstalar-exa-tela-windows.cmd" "C:\ExaTela\desinstalar-exa-tela-windows.cmd"
  DetailPrint "Abrindo o instalador da tela (uma janela preta vai explicar cada passo)..."
  ExecWait '"$SYSDIR\cmd.exe" /c ""$TEMP\exa-tela\instalar-exa-tela-windows.cmd""' $0
  DetailPrint "Terminado. Para desinstalar: C:\ExaTela\desinstalar-exa-tela-windows.cmd"
SectionEnd
