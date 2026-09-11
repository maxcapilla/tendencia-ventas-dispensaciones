# Tendencia de ventas y dispensaciones

Página estática e interactiva para compartir un gráfico mensual de ventas y dispensaciones con acceso mediante código.

## Interacción

- Al pasar el cursor o tocar el gráfico se muestra el valor exacto de ambas series.
- Ventas usa el eje izquierdo y una línea azul continua.
- Dispensaciones usa el eje derecho y una línea naranja segmentada.
- El documento completo está cifrado con AES-256-GCM. La clave se deriva con PBKDF2-SHA-256 y 600.000 iteraciones.
- El código de acceso no está incluido en el repositorio ni se transmite a un servidor.

La página no requiere instalación ni dependencias externas. Está preparada para publicarse con GitHub Pages desde la rama `main` y la carpeta raíz.
