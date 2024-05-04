Redis Dockerfile

*  Los pasos a seguir en la entrega 

1 Solo tienes que ejecutar "docker-compose up --build"

* Los pasos a seguir si se descarga de GitHub

1 Instalar y ejecutar Docker

2 Dentro de /web ejecutar "npm install"

3  desde la carpeta principal elecutar el Docker-compose "docker-compose up --build"

4 Tienes la app escuchando en el "http://localhost:3000/"

Explicación del tablón

He creado dos roles "Profesor" y "Alumnos"
Los profesores son los únicos que pueden escribir en el tablón y los alumnos solo se podrán conectar para leer los mensajes.
Si algún usuario se conecta en mitad de una conversación se les enviarán todas las publicaciones que han hecho.

