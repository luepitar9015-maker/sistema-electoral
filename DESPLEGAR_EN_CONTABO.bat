@echo off
chcp 65001 >nul
title Despliegue Sistema Electoral - Servidor Contabo (80.241.212.9)
powershell -ExecutionPolicy Bypass -File "%~dp0DESPLEGAR_EN_CONTABO.ps1"
