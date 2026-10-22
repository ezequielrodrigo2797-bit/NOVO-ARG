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

La información disponible confirma **302 EGM**: **96 operativas**, **22 asignadas** y **184 en stock**. Los 8 FV837E del Pack Ruby en preparación están incluidos dentro de esas 184 unidades. Los 8 upgrades de Casino Club se muestran como historial y no vuelven a contarse como máquinas. Hay además 2 equipos no EGM, presentados por separado.

No se proporcionó el detalle real por número de serie, modelo, destino o ubicación. Las filas que comienzan con DEMO- son ejemplos de interfaz; no constituyen inventario real. Las filas de la tabla no son la lista completa de 302 equipos. Los formularios y filtros son demostrativos. Los registros agregados y la descarga CSV corresponden solo a las filas de ejemplo de la sesión del navegador y se pierden al recargar.

## Alcance

Este proyecto no configura base de datos, autenticación, credenciales, sincronización de datos ni publicación del sitio. La interfaz es un prototipo estático que se puede abrir localmente.
