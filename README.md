# Base Maestra EGM · NOVOMATIC Argentina

Prototipo web local para visualizar una base maestra de equipos EGM. No necesita instalar paquetes ni ejecutar un servidor.

## Abrir el proyecto

1. Abrí esta carpeta en Visual Studio Code.
2. Abrí index.html en un navegador con doble clic. También podés usar la extensión Live Server de VS Code.
3. Para ver cambios, guardá los archivos y recargá la página.

## Guardar cambios en GitHub

El remoto origin ya está vinculado a https://github.com/ezequielrodrigo2797-bit/NOVO-ARG. En Visual Studio Code, abrí **Control de código fuente**, revisá los cambios, escribí un mensaje breve (por ejemplo, "Actualizar panel") y elegí **Confirmar**. Después elegí **Sincronizar cambios** o **Publicar rama**. VS Code puede pedirte iniciar sesión en GitHub.

También podés hacerlo desde la terminal de esta carpeta:

    git add .
    git commit -m "Describir el cambio"
    git push

Configuré Git para que el primer push establezca el seguimiento de la rama remota automáticamente. Antes de poder crear el primer commit, Git necesita el nombre y correo del autor. Podés definirlos solo para este proyecto con:

    git config user.name "Tu nombre"
    git config user.email "Tu correo de GitHub"

Si preferís no publicar tu correo personal, GitHub ofrece una dirección privada tipo noreply en la configuración de tu cuenta. No guardes contraseñas, tokens ni claves privadas en los archivos del proyecto.

## Datos de referencia

La fuente vigente es el libro [Base_Maestra_EGM_Actualizada_2026-09-26.xlsx](data/Base_Maestra_EGM_Actualizada_2026-09-26.xlsx). Reporta **270 EGM conocidas**: **96 operativas**, **22 asignadas a Hotelera Emprender** y **152 en stock**. Hay además **2 equipos no EGM**. El Stock General suma 176 porque incluye las 22 EGM asignadas pendientes de instalación y los 2 equipos no EGM.

Las cifras anteriores de 302 EGM y 184 en stock quedan reemplazadas. Consultá [DATOS_MAESTROS.md](DATOS_MAESTROS.md) para el desglose, las reglas de conteo y las discrepancias del archivo fuente. Las filas DEMO de la web siguen siendo ejemplos, no un padrón serializado de los 270 equipos.

## Alcance

Este proyecto no configura base de datos, autenticación, credenciales, sincronización de datos ni publicación del sitio. La interfaz es un prototipo estático que se puede abrir localmente.
