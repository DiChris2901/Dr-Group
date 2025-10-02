"""
Script para actualizar helperText de Ciudad en SalasPage.jsx
"""

# Leer el archivo
with open('src/pages/SalasPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar el helperText
old_helper = 'helperText="Ciudad donde se encuentra la sala"'
new_helper = 'helperText="Ciudad donde se encuentra la sala (el departamento se auto-completa)"'

content_updated = content.replace(old_helper, new_helper)

# Contar reemplazos
count = content.count(old_helper) - content_updated.count(old_helper)
print(f"HelperText actualizado en {count} lugares")

# Escribir el archivo
with open('src/pages/SalasPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content_updated)

print("✅ HelperText actualizado correctamente")
