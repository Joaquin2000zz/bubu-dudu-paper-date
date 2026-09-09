# Arquitectura del juego

TypeScript estricto, módulos de Vite y clases con composición. Se conserva el arte y
WebGL mediante GameRenderer / PaperRenderer. `checkJs` está desactivado para permitir
esos módulos JavaScript: su implementación interna aún no está comprobada por tipos.
Las reglas nuevas sí están tipadas.

Game crea dependencias, conecta acciones y cambia escenas. GameLoop actualiza y
dibuja. Su paso variable limitado a 50 ms mantiene la simulación publicada; un paso
fijo requiere validar por separado saltos y dificultad.

GameSession conserva identidad y progreso; BouquetInventory es la única fuente de
verdad de ramos. Recoger dos veces un ID no duplica inventario y regalar requiere existencia.
CharacterMotor controla salto y movimiento en todas las escenas. PhysicsWorld usa
las mismas superficies que dibuja el renderer. Cada instancia tiene su propio nivel activo.

PlatformScene coordina peligro, enemigos y recolección. GardenScene utiliza
InteractionDirector para tiempos, formación y restricciones de las acciones de pareja.
Enemy mantiene patrulla, preparación, embestida, recuperación y aturdimiento.

## Dependencias

Dominio (actors, inventario, física) no conoce DOM, WebGL o Web Audio. Las escenas
reciben un contexto explícito. La presentación consulta la sesión pero no modifica
movimiento ni inventario. InputManager traduce entrada a acciones.

Los nombres históricos de acción se mantienen en la sesión como contrato de animación.
Si se necesitan acciones concurrentes, separar la proyección visual del estado de
escena en una migración propia. Los efectos de recolección se coordinan explícitamente
en la escena; si surgen consumidores independientes, incorporar eventos tipados con
suscripciones de ciclo de vida definido. No hay bus global.

SceneManager sale de la escena anterior antes de entrar a la siguiente. Las escenas
limpian controles. Lifetime elimina listeners y tareas demoradas de UI. Cerrar Game
detiene el bucle, cierra audio y libera recursos WebGL. El joystick vuelve a cero ante
cancelaciones, pérdida de captura y cambios de pantalla.

## Contenido y límites

CAMPAIGN define el orden independientemente de los IDs. `kind` selecciona escena y
`theme` selecciona variantes visuales y musicales. El renderer construye geometría
para todos los mapas de plataformas registrados. El jardín conserva su geometría
y decoración especiales; otro tipo de jardín requerirá contenido nuevo.

Renderizado y arte siguen como módulos JavaScript funcionales detrás de un adaptador
tipado. Three.js, ECS y física avanzada son decisiones futuras.

## Verificación

Se conservan pruebas de colisiones e identidad y se añaden inventario, motor común,
transiciones e independencia de instancias. Las pruebas táctiles reproducen fallos
anteriores de captura y movimiento simultáneo. CI prueba los archivos compilados.
El criterio de calidad es extender contenido usando contratos y detectar regresiones,
no aumentar el número de clases o alcanzar cobertura indiscriminada.
