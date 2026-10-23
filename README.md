# Base Maestra EGM — NOVOMATIC Argentina

Aplicación web con inicio de sesión y datos guardados en una base SQLite local.

## Iniciar

Requiere Node.js 20 o superior.

1. Abrí una terminal en esta carpeta.
2. Copiá `.env.example` como `.env` y reemplazá `SESSION_SECRET`, `DATABASE_KEY`, `BOOTSTRAP_USERNAME` y `BOOTSTRAP_PASSWORD` por claves y credenciales propias.
3. Ejecutá `npm install` la primera vez.
4. Ejecutá `npm start` y abrí http://127.0.0.1:3000.

En el primer inicio, la aplicación crea `storage/maestra.sqlite.enc`, inicializa el usuario definido en `.env` y carga las agrupaciones del Excel. El archivo `.env` y la carpeta `storage/` no se incluyen en Git.

## Acceso inicial

El usuario inicial se configura con `BOOTSTRAP_USERNAME` y `BOOTSTRAP_PASSWORD` en `.env`. El valor inicial de contraseña se utiliza una sola vez para crear la cuenta; luego se puede quitar del archivo `.env`. La contraseña guardada en la base es un hash Argon2id y el acceso permite cambiarla. La contraseña inicial elegida es débil: cambiala al ingresar y antes de permitir acceso desde otra computadora. El campo `email` existe como opcional para agregar recuperación de cuenta más adelante.

No publiques `.env`, `storage/` ni copias de la base. El archivo SQLite se cifra con AES-256-GCM mediante una clave de `DATABASE_KEY` separada del código.

## Datos

El primer inicio importa las 270 EGM conocidas desde `data/maestra.js`, derivadas del libro [Base_Maestra_EGM_Actualizada_2026-09-26.xlsx](data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx): 96 operativas, 22 asignadas y 152 en stock. Las cantidades siguen agrupadas por cliente, sala, modelo o lote porque el libro no trae números de serie.

Después de cargar la base, la interfaz lee y modifica los registros guardados en SQLite. Las operaciones de alta, edición y eliminación requieren una sesión autenticada y dejan una entrada en el historial de auditoría. La contraseña nunca se envía a la base en texto plano ni se incluye en el repositorio.

## Seguridad y despliegue

La aplicación está preparada para ejecutarse localmente en un solo proceso. Las cookies son `HttpOnly`, `SameSite=Strict` y, en producción, `Secure`; el servidor escucha en loopback y debe ir detrás de un proxy HTTPS antes de exponerlo en una red.

El motor SQLite compilado a WebAssembly carga la base en memoria y guarda una copia cifrada después de cada escritura. Esto funciona para el inventario actual y una instancia local. Antes de habilitar varios procesos o usuarios concurrentes en una publicación externa, conviene migrar la capa de persistencia y sesiones a PostgreSQL administrado y mover `SESSION_SECRET` y `DATABASE_KEY` a un gestor de secretos.

Las 270 EGM, las 22 asignadas, los 20 ingresos de V.I.P. X y el upgrade de 8 FV640C conservan las notas de conciliación de [DATOS_MAESTROS.md](DATOS_MAESTROS.md).
