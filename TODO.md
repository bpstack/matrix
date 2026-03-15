# Versioning & Release Guide

## Escenario 1: Actualizar la MISMA versión (mantener versionado)

Cuando haces cambios pero NO quieres cambiar el número de versión (solo actualizar el tag al último commit):

```bash
# 1. Hacer commit de los cambios
git add -A
git commit -m "description"

# 2. Eliminar tag local
git tag -d v1.0.2

# 3. Crear tag en el commit actual
git tag v1.0.2

# 4. Forzar push del tag al remoto (reemplaza el tag existente)
git push origin v1.0.2 --force
```

**Resumen**: Eliminar tag local → Crear tag en HEAD → Force push al remoto

---

## Escenario 2: Nueva VERSIÓN (subir versionado)

Cuando haces cambios y quieres crear una nueva versión (v1.0.3, v1.1.0, v2.0.0, etc.):

```bash
# 1. Hacer commit de todos los cambios
git add -A
git commit -m "description"

# 2. Crear nuevo tag con la nueva versión
git tag v1.0.3

# 3. Push del commit
git push origin main

# 4. Push del nuevo tag
git push origin v1.0.3
```

**Resumen**: Commit → Crear tag → Push commit → Push tag

---

## Alternativa: push commit + tag juntos

```bash
# Opción A: Push todo junto (commit + tag)
git add -A
git commit -m "feat: new feature"
git push origin main --tags

# Opción B: Si el tag ya existe y quieres actualizarlo
git add -A
git commit -m "fix: bug fix"
git push origin main
git tag -d v1.0.2 && git tag v1.0.2 && git push origin v1.0.2 --force
```

---

## Comandos útiles

| Comando                             | Descripción                        |
| ----------------------------------- | ---------------------------------- |
| `git status`                        | Ver estado actual                  |
| `git log --oneline -5`              | Ver últimos commits                |
| `git tag -l`                        | Listar tags locales                |
| `git ls-remote --tags origin`       | Listar tags remotos                |
| `git tag -d v1.0.2`                 | Eliminar tag local                 |
| `git push origin :refs/tags/v1.0.2` | Eliminar tag remoto                |
| `git push origin v1.0.2 --force`    | Forzar push tag (reemplaza remoto) |

---

## Notas

- **Lightweight tag** (`git tag v1.0.2`): Solo apunta a un commit
- **Annotated tag** (`git tag -a v1.0.2 -m "Release 1.0.2"`): Incluye mensaje, fecha, autor
- **--force (-f)**: Necesario solo cuando el tag ya existe en remoto y quieres actualizarlo
- En GitHub, los tags automáticamente aparecen en Releases si tienes uno creado

Plan: Mejorar experiencia de instalación en Windows
Ambos problemas son independientes. Aquí están las opciones reales ordenadas por impacto:

Problema 1: SmartScreen ("Windows protegió su PC")
No hay forma técnica de eliminarlo sin un certificado de code signing. Las opciones:

Opción Costo Efecto
EV Certificate (DigiCert, Sectigo) ~$300-500/año Elimina SmartScreen inmediatamente
OV Certificate (standard) ~$100-200/año Reduce advertencias, pero SmartScreen puede seguir apareciendo hasta acumular "reputación"
Azure Code Signing (Microsoft) ~$9.99/mes Nuevo programa de Microsoft, más barato, elimina SmartScreen, recomendado
Sin certificado Gratis SmartScreen siempre aparece; usuario puede hacer clic en "Ejecutar de todas formas"
Recomendación: Para un proyecto personal sin monetización, aceptar el SmartScreen por ahora. Si se distribuye a otros, considerar Azure Code Signing (~$10/mes).

Problema 2: Animación verde con cuadrados (Squirrel UI)
Hay tres rutas:

Opción A — Quick fix: GIF personalizado en Squirrel (15 min)
Squirrel soporta la opción loadingGif para reemplazar la animación por defecto con un GIF propio. Solo requiere crear un GIF y añadirlo a forge.config.ts. Sigue siendo Squirrel pero con mejor aspecto.

Opción B — Cambiar a MakerWix (MSI) (~1-2h)
@electron-forge/maker-wix es el maker oficial de Electron Forge. Genera un instalador .msi estándar de Windows con:

Wizard profesional (pantallas de bienvenida, directorio, progreso)
Uninstaller registrado en "Programas y características"
Sin la animación horrible
Requiere instalar WiX Toolset v3 en la máquina de build
Opción C — Usar MakerNSIS (community maker, más trabajo)
NSIS permite personalización total del instalador (imágenes, pantallas custom, etc.) pero es más complejo y requiere NSIS instalado. Usado por VLC, Telegram, etc. Probablemente excesivo para este caso.

Recomendación
Corto plazo: Opción A (GIF custom en Squirrel) — mejora inmediata sin dependencias.
Medio plazo: Opción B (WiX MSI) — instalador verdaderamente profesional, es el estándar moderno en Electron Forge.

Ambas se pueden combinar o hacer secuencialmente. ¿Prefieres el quick fix del GIF, migrar a WiX, o ambos?
