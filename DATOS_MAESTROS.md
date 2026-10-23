# Datos maestros EGM · NOVOMATIC Argentina

## Fuente vigente

La referencia más reciente es data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx (fecha indicada en el nombre del archivo). Se usa como fuente de referencia para la aplicación. No contiene números de serie ni un padrón individual de todos los equipos.

## Resumen informado

| Indicador | Cantidad | Detalle |
|---|---:|---|
| EGM operativas | **96** | La hoja Instalaciones suma 72 FV330C y 24 FV838 CB. |
| EGM asignadas | **22** | Hotelera Emprender: 8 FV834 FF2, 8 FV640C FF2 y 6 FV838 CB, pendientes de instalación. |
| Stock EGM sin destino o en preparación | **32** | 24 sin destino (8 FV834 + 16 FV837E) y 8 FV837E en preparación Pack Ruby. |
| Nuevos ingresos a stock EGM | **120** | 100 FV610 refurbished + 20 V.I.P. X Galaxy 2.65. |
| Stock EGM total | **152** | 24 sin destino + 8 en preparación + 120 nuevos ingresos. |
| Total EGM conocido | **270** | 96 operativas + 22 asignadas + 152 en stock. |
| Equipamiento no EGM en stock | **2** | 1 terminal de apuestas FV831 Kambi + 1 ATM NCM 100. |
| Stock General | **176** | 152 EGM en stock + 22 EGM asignadas pendientes de instalación + 2 equipos no EGM. |
| Equipamiento físico total conocido | **272** | 270 EGM + 2 equipos no EGM. |

## Upgrades y conteo

- La hoja Upgrades_Plataforma registra 8 FV640C de Casino Club con actualización FF2 → CB para Rising Treasures, finalizada el 23/09/2026. Son máquinas ya instaladas; el registro de upgrade no agrega máquinas nuevas.
- La hoja Resumen_Modelos también menciona 8 FV640C instaladas en Casino Club, pero esa nota no se puede reconciliar de forma individual con el total reportado de 270 ni con las 96 operativas detalladas por instalación. Mantener el total reportado por la fuente y no sumar esos 8 por separado hasta validar dónde están incluidos.
- La hoja Stock_General clasifica 20 V.I.P. X Galaxy 2.65 como “Gaming cabinet”, mientras Resumen los incluye dentro de los 120 nuevos ingresos a stock EGM. La aplicación conserva el total EGM de Resumen y señala esta diferencia de clasificación.
- Stock General (176) no equivale a stock EGM (152): incluye también 22 EGM asignadas pendientes de instalación y 2 equipos no EGM.

## Cambios respecto de la referencia anterior

Las cifras anteriores de **302 EGM** y **184 EGM en stock** quedan reemplazadas por el archivo fechado 26/09/2026: **270 EGM conocidas** y **152 EGM en stock**. La diferencia es de 32 unidades en ambos totales. No combinar los totales viejos con el desglose nuevo.

## Límites de los datos

La fuente agrupa equipos por cliente, sala y modelo. No da números de serie ni fecha de corte formal del inventario. Las instalaciones tienen fechas solo en algunos registros; las asignaciones indican sala y fecha TBD. La interfaz muestra los registros importados de la fuente y sus cambios guardados en la base local.

## Guía para Codex

- Usar el Excel de data/ como referencia de detalle y este documento como resumen de conteos y discrepancias.
- Mantener el total informado de 270 EGM y separar los 2 equipos no EGM.
- No contar upgrades como máquinas nuevas ni duplicar los equipos asignados pendientes dentro del stock EGM.
- No ocultar las diferencias de clasificación o los 8 FV640C de Casino Club pendientes de conciliación. No inventar seriales, ubicaciones o fechas faltantes.
