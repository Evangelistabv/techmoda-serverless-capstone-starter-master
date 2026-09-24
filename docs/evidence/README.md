# Evidencia de consumo — D5

Los archivos S6-usage.json y S8-usage.json transcriben los campos `model` y `usage`
de las secciones 6 y 8 de la nota privada **Salidas Capstone S11.md** proporcionada
por el usuario. La nota no incluye fecha de ejecución; `importedAt` es la fecha de
extracción, no la fecha de la prueba. No son resultados simulados.

| Ejecución | Entrada | Salida | Total | Límite de salida configurado |
|---|---:|---:|---:|---:|
| S6, nota S11 | 175 | 105 | 280 | 300 |
| S8, nota S11 | 276 | 114 | 390 | 400 |
| S8, comprobación 2026-09-24 | 272 | 99 | 371 | 400 |

En las tres respuestas, `cacheReadInputTokens` y `cacheWriteInputTokens` son 0.
S6 + S8 de la nota suman **451 tokens de entrada, 219 de salida y 670 en total**.
La comprobación adicional de S8 está separada y no se mezcla con la demo original.

## Modelos cuyo uso está demostrado

- **Claude Haiku 4.5**, perfil `us.anthropic.claude-haiku-4-5-20251001-v1:0`:
  devuelve respuestas exitosas en S6 y S8. Se utiliza para redactar descripciones
  breves y conversar sobre el catálogo mediante Converse. La selección reutiliza
  el mismo modelo en ambas tareas y limita la salida a 300/400 tokens.
- **Titan Text Embeddings v2**, `amazon.titan-embed-text-v2:0`: la sección 7
  registra cuatro productos indexados y ninguno omitido. Convierte texto en
  vectores para recuperar productos por similitud en S7 y aportar contexto en S8.

La evidencia demuestra acceso efectivo en esas ejecuciones, no la fecha ni el
procedimiento administrativo de habilitación. Los motivos describen la función
de cada modelo en esta implementación; no se dispone de una comparación medida
contra otros modelos. La región configurada es `us-east-1`; el prefijo `us.` del
modelo generativo corresponde al perfil de inferencia usado por el proyecto.

## Interpretación para control de costos

El código limita la generación con `BEDROCK_MAX_TOKENS=300` (S6) y `400` (S8).
S8 limita la recuperación a tres productos (`ASSISTANT_TOP_K=3`), pero el historial
recibido no tiene un tope de longitud en el código actual. Estos controles no
constituyen un presupuesto global ni una garantía de costo máximo por cuenta.

Los `usage` de S8 corresponden a la generación con Claude: **no incluyen los tokens
del embedding de la consulta**, la indexación de S7, ni cargos de otros servicios.
La función actual descarta el contador devuelto por Titan. Por eso esta evidencia
acredita medición parcial y límites de salida, no el costo total de la aplicación.

Para valorar estas muestras, usar las tarifas aplicables al modelo y región en la
fecha de ejecución: entrada × tarifa de entrada + salida × tarifa de salida,
convirtiendo las unidades de la tarifa. No se adjunta un importe monetario porque
la nota no registra fecha ni precios. No representa una factura de AWS.

## Privacidad y procedencia

Se publican únicamente sesión, procedencia, modelo y contadores; se omiten las
URLs, las respuestas completas, identificadores de productos y consultas. La
nota original contiene una URL firmada de audio y se conserva fuera del repositorio.
AWS CLI devolvió `InvalidClientTokenId` durante la revisión del 2026-09-24; no se
pudo consultar CloudFormation ni enumerar la habilitación actual de modelos.
La comprobación HTTP adicional de S8 sí respondió 200 con `usage` real.
