# Guía para agentes de Codex

## Detectar e iniciar el entorno

- Antes de instalar o iniciar el proyecto, leé la sección **Instalar en una computadora nueva** de `README.md`.
- Es una aplicación Node.js/Express. Requiere Node.js 20 o superior y npm; confirmá las versiones con `node --version` y `npm --version`.
- Instalá las dependencias fijadas en el lockfile con `npm ci` desde la raíz. El comando de ejecución es `npm start`; por defecto abre en `http://127.0.0.1:3000`.
- En Windows se puede usar `.\iniciar-novomatic.ps1` después de instalar las dependencias y configurar `.env`. El lanzador abre el navegador y guarda sus registros en `storage/`.
- Actualmente `package.json` no define un script `test`. No informes `npm test` como exitoso.

## Secretos y datos locales

- `.env` contiene secretos y no está versionado. No copies su contenido en respuestas, commits, issues o logs, y no lo sobrescribas si ya existe.
- Si falta `.env`, usá `.env.example` como plantilla y guiá al usuario para completar claves aleatorias propias. `SESSION_SECRET` necesita al menos 32 bytes; `DATABASE_KEY` debe ser una clave aleatoria de 32 bytes codificada en base64url.
- `storage/` contiene la base SQLite cifrada y logs; está excluido de Git. No lo agregues al repositorio.
- Una instalación nueva crea una base inicial desde `data/maestra.js`. Para conservar cambios de otra computadora hacen falta `storage/maestra.sqlite.enc` y la misma `DATABASE_KEY`, transferidos por un canal seguro fuera de Git. La cuenta ya guardada en esa base se conserva; `BOOTSTRAP_*` solo crea el primer usuario cuando no hay ninguno.
- No expongas el servidor a la red sin la configuración HTTPS/proxy descrita en `README.md`.
