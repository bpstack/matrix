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
