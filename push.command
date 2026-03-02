#!/bin/bash
# push.command — Doble clic desde Finder para deployar a Vercel
# macOS ejecuta archivos .command automáticamente en Terminal

cd "/Users/franciscoriquelme/Desktop/Proyecto DM/antigravity"

echo ""
echo "⚡ Antigravity — Deploy a Vercel"
echo "────────────────────────────────"
git add .

# Pedir mensaje del commit (con uno por defecto)
echo ""
read -p "📝 Mensaje del commit (Enter para 'update'): " MSG
MSG="${MSG:-update}"

git commit -m "$MSG" 2>/dev/null || echo "ℹ️  Sin cambios nuevos"
git push

echo ""
echo "✅ Push listo — Vercel despliega en ~30s"
echo "🌐 https://antigravity-dm1.vercel.app"
echo ""
read -p "Presiona Enter para cerrar..."
