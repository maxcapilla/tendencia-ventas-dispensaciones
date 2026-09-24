# Tendencia de ventas y dispensaciones

Página estática e interactiva para compartir un gráfico mensual de ventas y dispensaciones con acceso mediante código.

## Interacción

- Al pasar el cursor o tocar el gráfico se muestra el valor exacto de ambas series.
- Ventas usa el eje izquierdo y una línea azul continua.
- Dispensaciones usa el eje derecho y una línea naranja segmentada.
- El documento completo está cifrado con AES-256-GCM. La clave se deriva con PBKDF2-SHA-256 y 600.000 iteraciones.
- El código de acceso no está incluido en el repositorio ni se transmite a un servidor.

La página no requiere instalación ni dependencias externas. Está preparada para publicarse con GitHub Pages desde la rama `main` y la carpeta raíz.

## Detalles del Panel Farmacias

El histórico permanece en `protectedContent`, sin modificaciones. Los módulos adicionales leen `data/panel-2026-09.json`, cifrado por separado con el mismo mecanismo y código de acceso.

- `pvmp.detail` contiene todas las comparaciones por farmacia e ID, con Registro ISP, precio, PVMP, diferencia y estado. Se conserva el universo de los listados de precios de septiembre; no se incorpora todo el catálogo general del sistema.
- `pvmp.pending` conserva el detalle de los fraccionados y de los registros ISP con distintos PVMP. No se calcula una diferencia hasta resolver la unidad de venta o el precio aplicable. Los ISP vacíos nunca se cruzan entre sí.
- `cross.detail` contiene el cruce completo de los listados actualizados de productos por ID. Se suma el stock de todos los lotes, incluidos negativos: sin stock significa total menor o igual a cero; disponible significa total positivo. Las tarjetas incluyen todas las clases y muestran también el subconjunto de medicamentos.
- Los archivos de origen y el método quedan documentados dentro del contenido cifrado. Ventas, valor de inventario y vencimientos conservan sus datos originales.

La página valida que los totales coincidan con sus filas y rechaza datos truncados, duplicados o inconsistentes. Si falla la carga, muestra un aviso y mantiene disponible el histórico. Los listados vacíos válidos muestran un mensaje explícito.

## Verificación

Con Node.js, ejecutar `node --test tests/panel.test.cjs`. Las pruebas usan datos sintéticos y comprueban que el contenido histórico cifrado siga idéntico. Para validar además el archivo real, proporcionar el código mediante la variable de entorno local `PANEL_ACCESS_CODE`; sin ella esa prueba se omite. No guardar el código, archivos descifrados ni planillas originales en el repositorio.

Antes de publicar una actualización, comprobar en el navegador el acceso, ambas tablas de stock, apertura y cierre de los botones, datos completos de PVMP, versión móvil y el histórico. El HTML y su archivo de datos deben actualizarse juntos en un mismo commit.
