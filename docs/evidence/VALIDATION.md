# Verificación de publicación — 2026-09-24

- El README documenta modelos, evidencia D5 y ubicación del documento privado.
- Evidencia S6/S8 extraída de la nota proporcionada por el usuario; sumas de tokens verificadas.
- API de catálogo: HTTP 200. Asistente S8: HTTP 200 y contadores reales adicionales.
- Frontend: HTTP 403 al comprobar la URL proporcionada por el usuario.
- Python (Lambdas) y Node (handlers): sintaxis válida.
- Frontend: comprobación TypeScript y build de producción correctos. Se eliminó un import `Volume2` sin uso que impedía la comprobación TypeScript.
- Suite del frontend: **106 pruebas pasaron, 11 fallaron**; 4 archivos pasaron y `src/App.test.tsx` falló. No se declara la suite completa como aprobada.
- No se ejecutó validación SAM: la herramienta no está instalada en este entorno.
- No se desplegaron recursos ni se modificó la configuración activa de AWS.
- AWS CLI rechazó la sesión local con `InvalidClientTokenId`; los resultados de modelos provienen de la nota y de la comprobación HTTP del asistente.
- Las URLs reales, el documento privado, `.env`, `env.txt`, `samconfig.toml`, builds y dependencias están excluidos de Git. Los templates usan la cuenta de destino y un parámetro para el guardrail.
