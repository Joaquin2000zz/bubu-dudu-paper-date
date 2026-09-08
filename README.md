# Bubu & Dudu — Una aventura de papel para dos

Plataformas 3D de papel con personajes 2D animados en WebGL. La campaña tiene dos niveles de recorrido con huecos, plataformas, obstáculos, mobs y tres ramos por nivel; el tercer nivel conserva el jardín romántico original como final.

## Abrir

- Abrir `index.html` directamente, o ejecutar `npm start` y visitar `http://127.0.0.1:8765`.
- `npm run build` genera `dist/bubu-dudu.html`, un único archivo para llevar o compartir.
- La antigua entrada `bubu_dudu_paper_date_final.html` abre la nueva versión.
- `bubu_dudu_paper_date_original.html` conserva el archivo recibido.

## Controles

WASD/flechas: caminar. J/X: saltar. E: flores. Espacio: beso. R: reiniciar. Escape: inicio.
“Seguir el caminito” permite acercarse automáticamente en el jardín final. En pantallas pequeñas el joystick mueve con intensidad analógica; los botones de flores, salto y beso permanecen separados para permitir movimiento y salto con dos dedos.

Arrastrar el jardín o usar los botones de cámara gira libremente 360° alrededor del escenario. Q/C también giran la cámara. El movimiento por teclado se orienta respecto a la cámara.

## Organización

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Interfaz y dibujos base de la vegetación |
| `styles/main.css` | Menú, controles y tamaños de pantalla |
| `src/characters.js` | Dibujos frontales, en tres cuartos y de espalda; fotogramas de brazos, pies y expresiones |
| `src/animation.js` | Selección de pose según dirección, cámara y acción |
| `src/world.js` | Tres niveles, plataformas, huecos, superficies compartidas por el dibujo y las colisiones |
| `src/engine.js` | WebGL, geometría, cámara, texturas, profundidad y colisiones |
| `src/game.js` | Movimiento, cita, teclado, controles táctiles y sonido |
| `tests/characters.test.cjs` | Pruebas de identidad, orientaciones y estados de animación |
| `tests/browser.html` | Prueba interactiva de la partida real dentro de un iframe |
| `tests/animation-review.html` | Galería animada para revisar todas las poses |
| `scripts/serve.cjs` | Servidor local sin dependencias |
| `scripts/build.cjs` | Generación del HTML autónomo |

Los scripts se cargan en orden y usan objetos pequeños compartidos para permitir la apertura directa mediante `file://`, sin instalación ni empaquetador.

## Validación

`npm test` ejecuta las pruebas de estados y dibujos. Para comprobar el renderizado y el ciclo completo, abrir `tests/browser.html` desde el servidor y pulsar “Probar movimiento y acciones”. La galería `tests/animation-review.html` facilita revisar identidad y movimiento antes de cambiar sprites.

El entorno combina plataformas, huecos, escalones, obstáculos, mobs y el jardín final con volumen real, más personajes y vegetación planos. La cámara usa perspectiva y buffer de profundidad; no se proyecta el escenario con CSS. Requiere un navegador con WebGL disponible.

El apoyo del personaje se calcula sobre las mismas piezas que se dibujan. El radio de los pies evita hundirse al tocar un borde; los desniveles altos bloquean el paso y la escalera permite subir y bajar. El puente incluye accesos bajos y apoyo continuo entre tablas. Caminar y acercarse durante el beso usan el mismo movimiento con colisiones, dividido en pasos pequeños para no atravesar obstáculos.

Referencias y decisiones de identidad: `DIRECCION_ARTISTICA.md`.


### Recorrido emocional y desafíos

El valle de las cartas perdidas transcurre bajo lluvia y luz de luna; el bosque del primer amanecer recupera luz y vegetación. El jardín final conserva su estética original. Los primeros capítulos tienen siete islas, seis cruces obligatorios y tres ramos cada uno. Cada ramo conserva el progreso y establece un punto de retorno. Los guardianes anuncian una embestida, atacan y descansan; saltarles encima los aturde. Las expresiones pasan de llanto a tristeza, calma y alegría con los ramos y los capítulos.

Prueba táctil de regresión: `node tests/mobile-browser.cjs` con Playwright instalado (o `PLAYWRIGHT_MODULE` apuntando a su módulo), servidor en el puerto 8765 y Edge disponible. Verifica toques reales mediante CDP, joystick y salto simultáneos, embestidas, puntos de retorno, el salto sobre el vacío y controles en el jardín. `BROWSER_CHANNEL` permite elegir otro canal de Chromium. Las capturas se guardan en `tests/artifacts/`. La inspección de posiciones se habilita únicamente con `?test=1`.
