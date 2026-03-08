Organizador-Administrador personal.

Punto 1.

Este proyecto lo vamos a renombar de Matrix a matrix-v2, tanto en el directorio como en el repositorio github.

Ver cómo se puede hacer esto. Dime los pasos para hacerlo en el remoto o lo puedes hacer tu manual desde la terminal ?
Vamos a iniciar el proyecto matrix que va a ser el main a partir de matrix-v2
Intentaremos mantener electron, tailwind y muchas de las dependencias de matrix-v2 pero tenemos que ver después de explicarte todo, con qué realmente nos vamos a quedar porque realmente necesitemos y luego, analizaremos detenidamente la base de datos, cual y cómo usarla.

Idiomas:

- Ingles y español

Diseño:

Se mantiene el de matrix-v2

Tabs:

- Overview (Esquema; aqui estará la misión, objetivos, estrategias y planes etc | Proyectos | Token usage | y cualquier sección que quiera implementar en este apartado)
- Proyects ()
- Tasks
  - Serán ideas análizadas y procesadas para convertirlas en tareas
  - Tokens - Antes de iniciar una tarea entraremos en este modulo donde se registrará el progreso del límite de tokens de las suscripciones y se utilizará la herramienta de IA mas eficiente en cada caso. (req de modelo de claude code- /usage)
- Ideas
- Gestor de contraseñas
- Settings

Vamos a renombar Matrix a V2, tanto en el directorio como en el repositorio si es posible

A continuación vamos a realizar una migración POCO a POCO, modulo a modulo de una manera muy simplista. El proyecto matrix-v2 es muy complejo y tiene una serie de funcionalidades dificiles de entender y mal diseñadas que no da los resultados esperados. Vamos a usar algunas cosas pero lo iremos seleccionando de manera muy milimétrica.

Un núcleo clave de esta app que vamos a iniciar desde inicio es la base de datos, cuál vamos a usar, si la que teníamos en matrix-v2 o migraremos a otra... la clave fundamental es el tema de relacionar los datos, variables, tablas etc. Mi idea es que podemos relacionar los datos de manera trasversal entre los modulos. En overview se podrá ver un esquema general pero que contemplará la relacion que pueda existir entre un proyecto, una tarea, tokens, ideas e incluso gestor de contraseñas para poder acceder en una tarea A del proyecto A que va acorde al objetivo A de la Misión A se pueda acceder casi desde cualquier lugar.

Vamos a simplificar mucho la app de origen. En la app matrix-v2 hablabamos de misión estrategia objetivos ideas tareas y un largo etc que lo hacía muy complejo.
En este nuevo proyecto vamos a implementar 1 misión, de 1 a 10 objetivos, cada objetivo puede tener de 1 a 10 planes, cada plan se podrá llevar a cabo mediante tareas, en principio tambien de 1 a 10 tareas por plan, ponemos estos limites para comenzar igual podemos aumentar el numero maximo de cada uno. Es importante que podemos modificar, actualizar y borrar en cualquier momento tanto la mision, objetivos, planes o tareas.

Otro aspecto fundamental es que tenemos proyectos, (la carpeta de projects) y el esquema que estamos elaborando va a tener la caracterísica de ser relacional, es decir, vamos poder relacionar directamente proyectos con planes, objetivos, planes o tareas o ideas. El objetivo de esto es que el usuario pueda ver gráficamente y de forma esquematizada qué cosas se está haciendo y con qué intención/meta.

El tema de los tokens, que irá implementado dentro de la sección de tareas será con la intención de que, a la hora de realizar una tarea, podamos saber de antemano cuales son los datos de la herramienta de IA que estamos usando, sus limites de tokens usados, las características de cada herramienta y la eficiencia de cada una para según qué tarea. Principalmente yo uso claude code, github copilit y IA local, esto en un futuro se intentará programar para que cada usuario pueda configurar sus propias herramientas, por ahora vamos a funcionar con estas 3. Extraeremos lo que necesitemos de matrix-v2 pero lo vamos a reformular de una manera más simplista si es posible.

Por otro lado vamos a implementar un modulo nuevo, gestor de contraseñas. La idea será implementar seguridad en este modulo del tipo empleado en el proyecto de: c:\Users\dz\projects\home-account-showcase donde tendremos todas las contraseñas organizadas de la manera más simple posible y sobre todo segura. Gestion de contraseñas tanto para emails, aplicaciones, .env, contraseñas importante de proyectos, PIN movil etc. Este modulo está por profundizar, lo decidiremos más adelante. Pero una vez más el tema relacional estará presente

Punto 2.

Despues del punto 1 ( si lo hemos podido hacer ), la clave ahora es crear el nuevo directorio c:\Users\dz\projects\matrix y dentro de él, un claude.md, plan.md, roadmap.md y un todo.md
