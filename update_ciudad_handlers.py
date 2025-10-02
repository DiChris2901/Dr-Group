"""
Script para actualizar los handlers de Ciudad en SalasPage.jsx
"""
import re

# Leer el archivo
with open('src/pages/SalasPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón para encontrar el onChange handler actual de ciudad
old_pattern = r"""onChange=\{\(event, newValue\) => \{
                    handleFormChange\('ciudad', newValue \|\| ''\);
                  \}\}
                  onInputChange=\{\(event, newInputValue\) => \{
                    handleFormChange\('ciudad', newInputValue\);
                  \}\}"""

# Nuevo handler con handleCiudadChange
new_handler = """onChange={(event, newValue) => {
                    handleCiudadChange(newValue);
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                    if (reason === 'input') {
                      handleFormChange('ciudad', newInputValue);
                    }
                  }}"""

# Reemplazar todas las ocurrencias (con indentación exacta del archivo)
old_text = """onChange={(event, newValue) => {
                  handleFormChange('ciudad', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('ciudad', newInputValue);
                }}"""

new_text = """onChange={(event, newValue) => {
                  handleCiudadChange(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    handleFormChange('ciudad', newInputValue);
                  }
                }}"""

content_updated = content.replace(old_text, new_text)

# Verificar cuántos reemplazos se hicieron
original_count = content.count("handleFormChange('ciudad', newValue || '')")
new_count = content_updated.count("handleCiudadChange(newValue)")

print(f"Reemplazos realizados: {new_count - (original_count - new_count if original_count >= new_count else 0)}")
print(f"handleFormChange con ciudad y newValue antes: {original_count}")
print(f"handleCiudadChange después: {new_count}")

# Escribir el archivo actualizado
with open('src/pages/SalasPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content_updated)

print("\n✅ Archivo actualizado correctamente")
