# Bubu & Dudu — Un jardín para dos

Revisión del 7 de septiembre de 2026. Abrir `index.html` directamente en un navegador o ejecutar `npm start`. `npm run build` produce `dist/bubu-dudu.html`, una versión autónoma sin conexión. El archivo `bubu_dudu_paper_date_original.html` conserva la versión recibida.

## Investigación y referencias

- [Akko: origen, creador y nombres de la pareja](https://en.akkogear.com/bubu-dudu-or-yier-bubu-meet-the-real-creator-behind-the-internets-favorite-panda-and-bear/). La colaboración licenciada identifica a 黄小B (Huang Xiao B) como creador. Los nombres originales son Yier para el panda y Bubu para el oso; aquí se conserva la convención internacional del proyecto: Bubu, panda; Dudu, oso marrón.
- [Akko x Yier and Bubu](https://en.akkogear.com/product/yier-and-bubu-3108v3-mechanical-keyboard/): fuente de contraste sobre identidad y colaboración licenciada. La imagen AVIF enlazada no pudo visualizarse en las herramientas; no se usó como evidencia visual examinada.
- [Referencia visual de sticker examinada](https://www.redbubble.com/i/sticker/bubu-dudu-by-witherspooncind/144717933.EJUG5). Referencia secundaria de proporciones y rasgos, no fuente de autoría. No se incorpora la imagen comercial al juego.
- [Nintendo: Paper Mario — The Thousand-Year Door](https://www.nintendo.com/au/games/nintendo-switch/paper-mario-the-thousand-year-door/): referencia del mundo de papel y personajes planos dentro de escenarios con profundidad.

## Traducción al juego

Los dibujos SVG son una adaptación propia, no arte oficial. Se preservan cabeza grande con base ancha, cuerpo corto, orejas pequeñas, ojos puntuales en la mitad inferior de la cara y boca mínima. Bubu tiene pelaje blanco cálido, orejas y pies oscuros, marca oscura doble en el cuello y mejillas rosadas. Dudu usa marrón cálido, interior de orejas oscuro y mejillas amarillas. Sin hocico prominente, ojos brillantes grandes, ropa añadida ni manchas de panda alrededor de los ojos.

La referencia principal de la revisión 3D es [Paper Mario 64, Nintendo](https://www.nintendo.com/en-gb/Games/Nintendo-64/Paper-Mario-269624.html), junto con la [explicación del estilo 2D por sus desarrolladores](https://iwataasks.nintendo.com/interviews/3ds/papermario/0/1/). Se combina geometría poligonal tridimensional con sprites planos. La influencia se aplica al material y al escenario: bordes claros de recorte, sombra desplazada, suelo de cartón con espesor, piezas verticales planas, guirnalda, tulipanes y árboles por capas. El menú parece una tarjeta de papel sujeta con cinta. La paleta combina crema, salvia, rosa empolvado y miel.

Los personajes del juego tienen una única definición de identidad en `src/characters.js`. La vista lateral se rehízo en tres cuartos tras la revisión del usuario: conserva ambos ojos, la base ancha de la cabeza y el cuerpo compacto. La vegetación mantiene la orientación plana que el usuario prefirió.

Se dibujan vistas frontal, de espalda y en tres cuartos, ciclos de caminar de ocho fotogramas y secuencias de entrega, recepción y beso. Los brazos al caminar conservan su forma corta y rotan desde el hombro; no se estiran. De frente se ven dos brazos, de costado uno y de espalda ninguno, en reposo y al caminar. En la entrega se extienden, el receptor prepara las patas y el ramo viaja entre ambos. El beso cambia ojos, boca, brazos e inclinación. La escena permanece visible, sin una foto emergente que tape la acción.

El motor WebGL dibuja suelo con espesor, escalones, una pérgola con cuatro postes y techo abierto, banco, puente y vallas. Usa cámara en perspectiva, buffer de profundidad y sombras de contacto; no transforma un plano CSS. La cámara se bajó y conserva rotación libre de 360°. Durante las acciones, la orientación de los personajes se adapta también al mirar la pareja desde atrás. Los personajes miran a la cámara y seleccionan su dibujo según el rumbo de desplazamiento.

Se mantiene el menú de papel, la dedicatoria, la música y los controles. Los GIF externos fueron eliminados. La versión autónoma conserva todos los recursos. Para detalles de estructura, ejecución y pruebas, ver `README.md`.
