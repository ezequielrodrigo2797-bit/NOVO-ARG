# Datos maestros EGM · NOVOMATIC Argentina

## Fuente vigente

La fuente de cantidades es [data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx](data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx). La planilla revisada [outputs/base-maestra-egm-20261024/Base_Maestra_EGM_Actualizada_2026-10-24.xlsx](outputs/base-maestra-egm-20261024/Base_Maestra_EGM_Actualizada_2026-10-24.xlsx) conserva ese corte e incorpora el detalle de Hotelera. [data/DetalleMaquinas_HoteleraEmprender.xlsx](data/DetalleMaquinas_HoteleraEmprender.xlsx) aporta los números de serie, RENO ID y juegos. El libro principal agrupa por cliente, sala y modelo.

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

## Asignaciones de Hotelera Emprender

El detalle complementario identifica las 22 unidades asignadas y las distribuye en tres islas linkeadas. Cada isla tiene un Jackpot Controller.

| Modelo | Cantidad | RENO ID y juego | Configuración |
|---|---:|---|---|
| FV834 FF2 | 8 | 11900 · Impera Link Series 1 | Villa Mercedes · 1 isla linkeada · 1 Jackpot Controller |
| FV640C FF2 | 8 | 100935 · Ultraboost Tiger Storm (4); 100955 · Ultraboost Grand Eagle (4) | Villa Mercedes · 1 isla linkeada · 1 Jackpot Controller |
| FV838 CB | 6 | 110895 · Xtension Link Ultimate | Villa Mercedes · 1 isla linkeada · 1 Jackpot Controller · cartelería Fazi |

Los 22 números de serie y su RENO ID por equipo están en `data/maestra.js` y se muestran en el detalle de cada asignación. Villa Mercedes fue indicada por el usuario como ubicación de Hotelera Emprender; la fecha de instalación sigue pendiente.

## Upgrades y conteo

- La hoja Upgrades_Plataforma registra 8 FV640C de Casino Club con actualización FF2 → CB para Rising Treasures, finalizada el 23/09/2026. Son máquinas ya instaladas; el registro de upgrade no agrega máquinas nuevas.
- La hoja Resumen_Modelos también menciona 8 FV640C instaladas en Casino Club, pero esa nota no se puede reconciliar de forma individual con el total reportado de 270 ni con las 96 operativas detalladas por instalación. Mantener el total reportado por la fuente y no sumar esos 8 por separado hasta validar dónde están incluidos.
- La hoja Instalaciones marca “Sin cartel” para las 24 FV838 CB operativas. El usuario confirmó que las FV838 llevan cartelería Fazi; la aplicación usa Fazi y conserva esta diferencia con el archivo.
- La hoja Stock_General clasifica 20 V.I.P. X Galaxy 2.65 como “Gaming cabinet”, mientras Resumen los incluye dentro de los 120 nuevos ingresos a stock EGM. La aplicación conserva el total EGM de Resumen y señala esta diferencia de clasificación.
- Stock General (176) no equivale a stock EGM (152): incluye también 22 EGM asignadas pendientes de instalación y 2 equipos no EGM.

## Cambios respecto de la referencia anterior

Las cifras anteriores de **302 EGM** y **184 EGM en stock** quedan reemplazadas por el archivo fechado 26/09/2026: **270 EGM conocidas** y **152 EGM en stock**. La diferencia es de 32 unidades en ambos totales. No combinar los totales viejos con el desglose nuevo.

## Límites de los datos

El libro principal agrupa equipos por cliente, sala y modelo y no trae números de serie. El detalle complementario incluye series y RENO ID solo para las 22 asignaciones de Hotelera. No hay un padrón serializado completo ni una fecha de corte posterior para las cantidades generales. Villa Mercedes es la ubicación indicada para Hotelera; la fecha de instalación permanece TBD. La interfaz muestra los registros importados y sus cambios guardados en la base local.

## Guía para Codex

- Usar los dos Excel de `data/` como fuentes: el libro maestro para cantidades y el detalle de Hotelera para series y RENO ID. Este documento resume conteos y discrepancias.
- Mantener el total informado de 270 EGM y separar los 2 equipos no EGM.
- No contar upgrades como máquinas nuevas ni duplicar los equipos asignados pendientes dentro del stock EGM.
- No ocultar las diferencias de clasificación, la cartelería de las FV838 ni los 8 FV640C de Casino Club pendientes de conciliación. No inventar series, RENO ID, ubicaciones o fechas faltantes.
