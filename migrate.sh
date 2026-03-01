#!/bin/bash
# migrate.sh — Mueve el proyecto a ~/Projects/antigravity (sin espacios)
# Después de esto, Antigravity puede ejecutar comandos directamente desde ahí.

set -e
DEST="$HOME/Projects/antigravity"

echo ""
echo "═══════════════════════════════════════════"
echo "  ⚡ Antigravity — Migración de directorio  "
echo "═══════════════════════════════════════════"
echo ""
echo "📁  Destino: $DEST"
echo ""

# Crear directorio destino
mkdir -p "$HOME/Projects"

# Copiar proyecto completo preservando git
if [ -d "$DEST" ]; then
  echo "⚠️   $DEST ya existe — actualizando archivos..."
  rsync -a --exclude='node_modules' --exclude='dist' . "$DEST/"
else
  echo "📋  Copiando proyecto..."
  rsync -a --exclude='node_modules' --exclude='dist' . "$DEST/"
fi

echo "✅  Proyecto copiado"
echo ""

# Instalar node_modules en la nueva ubicación
echo "📦  Instalando dependencias en nueva ruta..."
npm install --prefix "$DEST" --silent
echo "✅  Dependencias instaladas"
echo ""

# Git add+commit+push desde la ubicación original
echo "🐙  Haciendo push de los cambios pendientes a GitHub..."
git add .
git commit -m "feat: LibreLinkUp real-time proxy + Apple design system" 2>/dev/null || echo "ℹ️   Sin cambios nuevos para commitear"
git push
echo "✅  Push completado — Vercel desplegando en ~30s"
echo ""

echo "═══════════════════════════════════════════"
echo "  ✅  Migración lista"
echo "     Nuevo directorio: $DEST"
echo "     Ahora trabaja desde ~/Projects/antigravity"
echo "═══════════════════════════════════════════"
echo ""
echo "💡  Para abrir en VS Code:"
echo "    code ~/Projects/antigravity"
echo ""
