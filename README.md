# Bubu & Dudu — Una aventura de papel para dos

Plataformas WebGL con personajes 2D. Dos capítulos de desafíos con tres ramos por
nivel desembocan en el jardín romántico original.

## Desarrollo

Node.js 24 y npm. Instalar con `npm ci`, ejecutar `npm start` y abrir
http://127.0.0.1:8766. El código fuente usa módulos: `index.html` necesita servidor.

- `npm run check`: tipos estrictos, lint, pruebas y compilación.
- `npm run test:browser`: regresión de controles y pareja con el servidor activo.
  Usa Edge por defecto; `BROWSER_CHANNEL=chromium` usa Chromium de Playwright,
  instalado mediante `npx playwright install chromium`.
- `npm run build`: genera `dist/index.html`, recursos versionados y `dist/bubu-dudu.html`.
  Este último es un HTML autónomo para abrir directamente y compartir sin servidor.
- `npm run preview`: sirve la compilación en http://localhost:4173.
- `npm run format`: formatea los módulos TypeScript.

`GAME_URL` permite probar otra URL, incluida producción. La emulación táctil no
sustituye comprobar joystick y audio en un iPhone físico.

## Controles

WASD/flechas: caminar. J/X: saltar. E: flores. Espacio: beso. R: reiniciar. Escape: menú.
Q/C y botones: girar cámara. Arrastrar el escenario también gira la cámara.
En móviles, joystick y botones independientes permiten caminar y saltar con dos dedos.

## Arquitectura

- `src/core`: composición de Game, bucle, tipos y limpieza de recursos.
- `src/scenes`: PlatformScene, GardenScene y transiciones de salida/entrada.
- `src/actors`: personaje, motor compartido y enemigo con estados de ataque.
- `src/physics`: superficies y colisiones independientes del dibujo.
- `src/gameplay`: sesión, inventario y secuencias de pareja.
- `src/input`: acciones, teclado y joystick con recuperación tras interrupciones.
- `src/content/levels.ts`: mapas, temas, introducciones y orden de campaña.
- `src/presentation`: renderizador, HUD y audio.
- `src/engine.js`, `characters.js`, `animation.js`: dibujo WebGL y arte original,
  conservados en JavaScript detrás de la interfaz TypeScript.

Ver [arquitectura](docs/ARCHITECTURE.md) y [guía de nuevas mecánicas](docs/DEVELOPMENT.md).
La dirección artística está en `DIRECCION_ARTISTICA.md`; las referencias de voz en
`AUDIO_REFERENCES.md`. Las voces usan las grabaciones aisladas proporcionadas por el usuario.

## Revisar y publicar

`tests/animation-review.html` es la galería de poses durante desarrollo.
`tests/browser.html` permite revisar capítulos y acciones sin completar una partida.
Las pruebas de navegador generan capturas en `tests/artifacts`.

GitHub Actions verifica ramas y PR. En `main`, despliega `dist` tras pasar los controles.
La fuente de publicación de Pages debe configurarse como **GitHub Actions**.
Preparar el workflow no cambia por sí solo la configuración del sitio existente.

`bubu_dudu_paper_date_original.html` conserva el archivo original; la entrada histórica
`bubu_dudu_paper_date_final.html` redirige al juego.
