# Voces de Bubu y Dudu

Las voces provienen de los videos aislados proporcionados por el usuario:

- `C:/Users/joaqu/Downloads/bubu.mp4` → `src/assets/voices/bubu.mp3` (aprox. 3,7 s).
- `C:/Users/joaqu/Downloads/dudu.mp4` → `src/assets/voices/dudu.mp3` (aprox. 2,2 s).

Conversión con FFmpeg: `-vn -codec:a libmp3lame -q:a 2`, sin alterar tono ni velocidad.
Los archivos se incorporan al bundle, incluido el HTML autónomo sin conexión.
Cada diálogo reproduce la grabación del personaje correspondiente, también al recoger
ramos, regalar y besar. Una nueva frase interrumpe la anterior para evitar superposición.
Volver al menú o silenciar el sonido detiene la voz. Los globos conservan español legible.

Estas grabaciones sustituyen la síntesis experimental de «atata/dadada» anterior.
La música y las campanitas continúan siendo procedurales.
