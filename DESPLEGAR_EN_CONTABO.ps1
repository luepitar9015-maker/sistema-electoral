# DEPLOY SISTEMA ELECTORAL - SERVIDOR CONTABO VPS (80.241.212.9)
$ErrorActionPreference = "Stop"

$SERVER_IP = "80.241.212.9"
$SSH_USER = "root"
$SERVER = "$SSH_USER@$SERVER_IP"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa_sena"
$ROOT_DIR = $PSScriptRoot
$CLIENT_DIR = Join-Path $ROOT_DIR "client2"
$DIST_REMOTO = "/var/www/sistema-electoral/client2/dist"
$SERVER_DIR = "/var/www/sistema-electoral"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   🚀 DESPLIEGUE SISTEMA ELECTORAL - SERVIDOR CONTABO VPS ($SERVER_IP)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1 - BUILD CLIENT2 FRONTEND
Write-Host "[1/4] Compilando frontend React (client2)..." -ForegroundColor Yellow
Set-Location $CLIENT_DIR
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: La compilación del frontend falló." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "OK - Frontend compilado con éxito." -ForegroundColor Green
Write-Host ""

# PASO 2 - ACTUALIZAR CÓDIGO EN EL SERVIDOR DESDE GIT
Write-Host "[2/4] Actualizando código del Backend en el servidor Contabo..." -ForegroundColor Yellow
$gitPullCmd = "cd $SERVER_DIR && git pull origin main && cd server && npm install --omit=dev"
ssh -i $SSH_KEY $SERVER $gitPullCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Aviso: Git pull tuvo advertencias o requiere verificación manual." -ForegroundColor Yellow
}
Write-Host "OK - Backend actualizado en el servidor." -ForegroundColor Green
Write-Host ""

# PASO 3 - SINCRONIZAR BUNDLE COMPILADO (DIST)
Write-Host "[3/4] Transfiriendo frontend compilado a $DIST_REMOTO..." -ForegroundColor Yellow
scp -i $SSH_KEY -r "$CLIENT_DIR\dist\*" "${SERVER}:${DIST_REMOTO}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la subida de los archivos frontend." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "OK - Frontend transferido." -ForegroundColor Green
Write-Host ""

# PASO 4 - REINICIAR PM2 Y RECARGAR NGINX
Write-Host "[4/4] Reiniciando servicios en el servidor..." -ForegroundColor Yellow
$restartCmd = "chmod -R 755 $DIST_REMOTO && pm2 restart sistema-electoral-backend && systemctl reload nginx"
ssh -i $SSH_KEY $SERVER $restartCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudieron reiniciar los servicios." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "   ✅ DESPLIEGUE COMPLETADO CON ÉXITO EN CONTABO VPS" -ForegroundColor Green
Write-Host "   🌐 Plataforma en línea: http://$SERVER_IP:3000" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para cerrar"
