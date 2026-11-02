# Base Maestra EGM — NOVOMATIC Argentina

Aplicación web con inicio de sesión y datos guardados en una base SQLite local.

## Iniciar

Requiere Node.js 20 o superior.

1. Abrí una terminal en esta carpeta.
2. Copiá `.env.example` como `.env` y reemplazá `SESSION_SECRET`, `DATABASE_KEY`, `BOOTSTRAP_USERNAME` y `BOOTSTRAP_PASSWORD` por claves y credenciales propias.
3. Ejecutá `npm install` la primera vez.
4. Ejecutá `npm start` y abrí http://127.0.0.1:3000.

En el primer inicio, la aplicación crea `storage/maestra.sqlite.enc`, inicializa el usuario definido en `.env` y carga las agrupaciones del Excel. El archivo `.env` y la carpeta `storage/` no se incluyen en Git.

## Instalar en otra computadora

### Requisitos

- Git.
- Node.js 20 o superior y npm. Comprobá las versiones con `node --version` y `npm --version`.
- Windows solo es necesario para usar el lanzador gráfico `iniciar-novomatic.ps1`. En macOS y Linux, iniciá la aplicación con `npm start`.

### Windows / PowerShell

1. Cloná el repositorio y entrá a la carpeta:

   ```powershell
   git clone https://github.com/ezequielrodrigo2797-bit/NOVO-ARG.git
   cd NOVO-ARG
   ```

2. Instalá las dependencias fijadas en el lockfile:

   ```powershell
   npm ci
   ```

3. Creá la configuración local y generá dos claves diferentes:

   ```powershell
   Copy-Item .env.example .env
   node -p "require('node:crypto').randomBytes(48).toString('base64url')"
   node -p "require('node:crypto').randomBytes(32).toString('base64url')"
   ```

   Editá `.env`: pegá el primer resultado como `SESSION_SECRET` y el segundo como `DATABASE_KEY`. Completá `BOOTSTRAP_USERNAME` y `BOOTSTRAP_PASSWORD` con credenciales propias. El usuario acepta de 3 a 40 letras, números, puntos, guiones o guiones bajos. Elegí una contraseña larga y única.

4. Iniciá la aplicación en primer plano:

   ```powershell
   npm start
   ```

   Abrí <http://127.0.0.1:3000>. La primera ejecución crea `storage/maestra.sqlite.enc`, inicializa el usuario administrador y carga los datos maestros. Para detener el servidor, presioná `Ctrl+C` en la terminal.

   Después de completar estos pasos, también podés ejecutar `.\iniciar-novomatic.ps1`: inicia el servidor en segundo plano y abre el navegador. Los logs del lanzador quedan en `storage/launcher-*.log`. Si PowerShell bloquea la ejecución, usá `powershell -ExecutionPolicy Bypass -File .\iniciar-novomatic.ps1`.

### macOS / Linux

Cloná el repositorio, ejecutá `npm ci`, copiá la plantilla con `cp .env.example .env` y editá `.env` con tu editor. Generá las claves con los mismos comandos `node -p` de arriba. Después ejecutá `npm start` y abrí <http://127.0.0.1:3000>.

## Continuar con la base de otra computadora

`.env` y `storage/` están excluidos de Git intencionalmente. Un clon nuevo crea una base nueva con los datos maestros incluidos; no trae altas, ediciones ni eliminaciones locales.

Para continuar con la misma base, copiá `storage/maestra.sqlite.enc` y transferí el valor original de `DATABASE_KEY` por un canal seguro fuera de Git. En la computadora nueva, instalá las dependencias, configurá `.env` con esa misma clave y una `SESSION_SECRET` nueva, y colocá la base en `storage/`. Iniciá la aplicación e ingresá con la cuenta guardada en esa base. No hace falta reemplazar la cuenta con las credenciales `BOOTSTRAP_*`.

**No subas `.env`, `storage/`, la base cifrada ni copias de seguridad a Git.** Si perdés `DATABASE_KEY`, no se puede descifrar la base.

## Acceso inicial

El usuario inicial se configura con `BOOTSTRAP_USERNAME` y `BOOTSTRAP_PASSWORD` en `.env`. La contraseña se utiliza solo para crear el primer usuario de una base nueva; después se puede retirar del archivo `.env`. La base guarda un hash Argon2id y la contraseña se puede cambiar desde la interfaz. El campo `email` existe como opcional para agregar recuperación de cuenta más adelante.

No publiques `.env`, `storage/` ni copias de la base. El archivo SQLite se cifra con AES-256-GCM mediante una clave de `DATABASE_KEY` separada del código.

## Datos

El primer inicio importa las 270 EGM conocidas desde `data/maestra.js`, basadas en el libro [Base_Maestra_EGM_Actualizada_2026-09-26.xlsx](data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx): 96 operativas, 22 comprometidas con Hotelera y 152 en stock. La planilla revisada [Base_Maestra_EGM_Actualizada_2026-10-24.xlsx](outputs/base-maestra-egm-20261024/Base_Maestra_EGM_Actualizada_2026-10-24.xlsx) conserva ese corte e incluye el detalle serializado de Hotelera y las 24 FV837E en preparación. El Excel complementario [DetalleMaquinas_HoteleraEmprender.xlsx](data/DetalleMaquinas_HoteleraEmprender.xlsx) aporta series y RENO ID de las 22 máquinas de Hotelera. Las FV837E se organizan en tres islas de 8 para EPIC CASINO, GOLDEN PALACE SAN LUIS y FLAMINGO, todas con Xtension Link Evolution y cartelería Fazi de 8 posiciones. El resto de instalaciones y stock continúa agrupado porque las fuentes no traen un padrón individual completo.

Las tres asignaciones de Hotelera corresponden a Villa Mercedes: son tres islas linkeadas, cada una con un Jackpot Controller. El contrato está firmado; el cliente retiró una isla y las otras dos siguen pendientes de retiro del depósito. La isla retirada no está identificada por modelo. Ninguna está instalada ni operativa. Las FV838 usan cartelería Fazi, confirmada por el usuario. La fecha de instalación sigue pendiente. Si ya existe una base local, la migración de datos se aplica al próximo inicio de la aplicación.

Después de cargar la base, la interfaz lee y modifica los registros guardados en SQLite. Las operaciones de alta, edición y eliminación requieren una sesión autenticada y dejan una entrada en el historial de auditoría. La contraseña nunca se envía a la base en texto plano ni se incluye en el repositorio.

## Seguridad y despliegue

La aplicación está preparada para ejecutarse localmente en un solo proceso. Las cookies son `HttpOnly`, `SameSite=Strict` y, en producción, `Secure`; el servidor escucha en loopback y debe ir detrás de un proxy HTTPS antes de exponerlo en una red.

El motor SQLite compilado a WebAssembly carga la base en memoria y guarda una copia cifrada después de cada escritura. Esto funciona para el inventario actual y una instancia local. Antes de habilitar varios procesos o usuarios concurrentes en una publicación externa, conviene migrar la capa de persistencia y sesiones a PostgreSQL administrado y mover `SESSION_SECRET` y `DATABASE_KEY` a un gestor de secretos.

Las 270 EGM, las 22 asignadas, los 20 ingresos de V.I.P. X y el upgrade de 8 FV640C conservan las notas de conciliación de [DATOS_MAESTROS.md](DATOS_MAESTROS.md).
