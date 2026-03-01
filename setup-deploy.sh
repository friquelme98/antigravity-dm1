#!/bin/bash
set -e  # Salir si cualquier comando falla
cd "$(dirname "$0")"  # Asegurarse de estar en el directorio del proyecto

echo ""
echo "═══════════════════════════════════════════"
echo "  ⚡ Antigravity — Setup & Deploy Script    "
echo "═══════════════════════════════════════════"
echo ""

# ── 1. npm install ────────────────────────────────────────────────────────
echo "📦  Instalando dependencias..."
npm install
echo "✅  npm install completado"
echo ""

# ── 2. Build de prueba ────────────────────────────────────────────────────
echo "🔨  Verificando build de producción..."
npm run build
echo "✅  Build OK"
echo ""

# ── 3. Git ────────────────────────────────────────────────────────────────
echo "🔧  Inicializando repositorio Git..."
if [ ! -d ".git" ]; then
  git init
  git branch -M main
  echo "✅  git init"
else
  echo "ℹ️   Repo Git ya existente"
fi

git add .
git commit -m "feat: Antigravity DM1 Performance OS — initial commit

- Dashboard con glucosa hero, TIR bar y mini-chart
- Módulo glucosa: gráfico interactivo, métricas (TIR/CV/eA1c), import CSV LibreView
- Módulo entrenamiento: plan 12 semanas Z2, carga TRIMP, Apple Watch integration
- Módulo comidas: registro macros, plantillas, snacks de rescate hipo
- Módulo suplementos: catálogo, adherencia diaria
- Módulo insights: motor de reglas ADA 2024, badges de confianza
- PWA ready: offline-first, manifest, service worker
- Design system: Apple quality (pure black, glass morphism, SF typography)" 2>/dev/null || echo "ℹ️   Sin cambios nuevos para commitear"

echo ""

# ── 4. GitHub ─────────────────────────────────────────────────────────────
echo "🐙  Creando repositorio en GitHub..."

# Verificar si gh está instalado
if ! command -v gh &> /dev/null; then
  echo "⚠️   GitHub CLI (gh) no está instalado."
  echo "    Instalando con Homebrew..."
  if ! command -v brew &> /dev/null; then
    echo "❌  Homebrew tampoco está instalado."
    echo "    Instala Homebrew primero: https://brew.sh"
    echo "    Luego corre: brew install gh"
    echo ""
    echo "    O sube el repo manualmente en: https://github.com/new"
    GITHUB_SKIP=true
  else
    brew install gh
  fi
fi

if [ "$GITHUB_SKIP" != "true" ]; then
  # Verificar autenticación
  if ! gh auth status &> /dev/null; then
    echo "🔐  Necesitas autenticarte en GitHub:"
    gh auth login
  fi

  # Crear repo (si ya existe, conectar el remoto)
  REPO_NAME="antigravity-dm1"
  if gh repo view "$REPO_NAME" &> /dev/null 2>&1; then
    echo "ℹ️   El repo '$REPO_NAME' ya existe en GitHub"
    REMOTE_URL="https://github.com/$(gh api user -q .login)/$REPO_NAME.git"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$REMOTE_URL"
  else
    echo "    Creando repo público: $REPO_NAME"
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi

  # Push
  git push -u origin main --force 2>/dev/null || git push -u origin main
  GITHUB_URL="https://github.com/$(gh api user -q .login)/$REPO_NAME"
  echo "✅  Código en GitHub: $GITHUB_URL"
fi

echo ""

# ── 5. Vercel ─────────────────────────────────────────────────────────────
echo "🚀  Desplegando en Vercel..."

if ! command -v vercel &> /dev/null; then
  echo "    Instalando Vercel CLI..."
  npm install -g vercel
fi

# Deploy a producción, sin confirmaciones interactivas
vercel --prod --yes --name antigravity-dm1

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅  ¡Listo! Resumen:"
[ "$GITHUB_SKIP" != "true" ] && echo "  🐙  GitHub: $GITHUB_URL"
echo "  ⚡  La URL de Vercel aparece arriba (*.vercel.app)"
echo "═══════════════════════════════════════════"
echo ""
