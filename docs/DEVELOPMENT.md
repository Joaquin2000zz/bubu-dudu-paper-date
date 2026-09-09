# Agregar contenido y mecánicas

## Nivel

Agregar una CollisionLevel en `src/content/levels.ts` con ID único, tipo platform,
tema, introducción, superficies, inicio/meta, enemigos y ramos. Incluir el ID en
CAMPAIGN antes del jardín. Los IDs de ramos son únicos en toda la campaña.
Cada nivel de desafíos tiene tres ramos conforme al diseño actual.

Comprobar suelo bajo inicio/meta/ramos y cruces con CharacterMotor. Evitar condiciones
por ID en controles, audio o Game. Dimensiones en unidades del mundo; tiempo en segundos.
Límites actuales: x ±8.5 y z entre -8.5 y 8.1.

## Enemigo

El comportamiento actual reside en Enemy. Para un segundo comportamiento extraer un
EnemyBrain inyectable, manteniendo cuerpo y dibujo compartidos. No crear una clase
base con todos los ataques posibles. Probar preparación, dirección comprometida,
recuperación y aturdimiento antes de afinar dificultad.

## Interacción

La coordinación de pareja pertenece a InteractionDirector. Acotar el bloqueo de
movimiento a la secuencia; salto y beso son acciones distintas. Los dibujos pertenecen
al arte; texto y audio a presentación. Revisar ambos personajes, cámara girada,
altura de apoyo y finalización de la acción.

## Validación

Separar reorganización, balance y arte. Reproducir bugs con pruebas de comportamiento
cuando sea viable. Ejecutar `npm run check` y pruebas de navegador relevantes.
No comprobar funcionalidad buscando nombres de funciones dentro del código fuente.

En móvil: sostener, soltar, cancelar, perder captura, volver a la página y usar dos dedos.
En dibujo: caras, brazos por orientación, profundidad y alturas. Usar la galería de poses.
Antes de publicar probar `npm run preview` y verificar qué commit se desplegó.
Emular un móvil no demuestra funcionamiento en un iPhone físico.
