# PROTOCOLO DE VERIFICACIÓN Y RECUPERACIÓN DE ERRORES INFALIBLE

Este protocolo debe aplicarse **siempre**, antes, durante y después de cualquier modificación en el código.  
Su objetivo es **detectar, corregir y revertir cualquier error** para garantizar la integridad y funcionamiento del proyecto.  
Si se sigue paso a paso, es capaz de rescatar el proyecto incluso si todo falla.

---

## 🚨 1. VERIFICACIÓN INMEDIATA PREVIA

1. **Verificar errores de compilación en el archivo objetivo:**
    ```bash
    get_errors([archivo_a_modificar])
    ```
    - Si hay errores → **STOP** → Corrige → Repite verificación.

2. **Leer el final del archivo para verificar que esté completo:**
    ```bash
    read_file(archivo, startLine: -20, endLine: -1)
    grep_search("export default", archivo)
    ```
    - Confirmar que el archivo exporta correctamente y tiene todos los componentes principales.

3. **Verificar dependencias e imports:**
    ```bash
    grep_search("import.*from", archivo)
    semantic_search("useAuth|useFirestore|useDashboardStats")
    ```
    - Confirmar que todos los imports y hooks necesarios están presentes.

---

## 🔄 2. RESPALDO Y PREPARACIÓN

1. **Crear backup del archivo antes de modificar:**
    ```bash
    cp archivo.jsx archivo.jsx.backup
    ```
2. **Verificar estado del repositorio:**
    ```bash
    git status
    ```
3. **Listar archivos a modificar y documentar cambios previstos.**

---

## 🛠️ 3. MODIFICACIÓN CONTROLADA

1. **Modificar solo un archivo a la vez.**
2. **Guardar cambios y verificar sintaxis en el editor (sin errores rojos).**
3. **Revisar navegador en http://localhost:3000 y consola DevTools antes de continuar.**

---

## 🕵️ 4. VERIFICACIÓN POST-CAMBIO

1. **Inmediatamente después de cada cambio ejecutar:**
    ```bash
    get_errors([archivo_modificado])
    ```
2. **Si hay errores → STOP → Leer contexto → Corregir → Volver a verificar.**
3. **Asegurarse de que auto-refresh y funcionalidad estén activas.**
4. **Verificar que la consola esté limpia y los datos de Firebase se muestren correctamente.**

---

## 🛑 5. PROTOCOLO DE RECUPERACIÓN EN CASO DE ERROR GRAVE

**Si el proyecto deja de funcionar, sigue estos pasos para recuperarlo:**

1. **STOP TOTAL:**  
   No avances ni realices nuevos cambios hasta resolver el error.
2. **Identifica el tipo de error:**  
   - ¿Sintaxis?  
   - ¿Importación rota?  
   - ¿Lógica?  
   - ¿Archivo incompleto?  
   - ¿Conexión Firebase rota?
3. **Restaurar desde backup:**  
    ```bash
    cp archivo.jsx.backup archivo.jsx
    ```
   - Si el error persiste, usa:
    ```bash
    git restore archivo.jsx
    ```
4. **Revisar en el navegador y ejecutar nuevamente `get_errors()`.**
5. **Documenta el error y la solución aplicada.**
6. **Si el error sigue, consulta a un experto o agente IA con detalles específicos.**
7. **Nunca ignores un error; cada error debe quedar registrado y resuelto.**

---

## 🧹 6. VERIFICACIÓN FINAL Y LIMPIEZA

1. **Ejecutar `npm run dev` solo cuando todo esté correcto y sin errores.**
2. **Probar la funcionalidad afectada, navegación, responsive y datos reales.**
3. **Eliminar backups innecesarios para mantener el proyecto limpio.**
    ```bash
    rm archivo.jsx.backup
    ```

---

## 📋 CHECKLIST OBLIGATORIO ANTES Y DESPUÉS DE CADA MODIFICACIÓN

- [ ] ¿Ejecuté `get_errors()` antes y después?
- [ ] ¿Leí y verifiqué el archivo completo?
- [ ] ¿Verifiqué todos los imports y hooks?
- [ ] ¿Creé backup antes de modificar?
- [ ] ¿Guardé los cambios y verifiqué sintaxis?
- [ ] ¿Consola y navegador sin errores?
- [ ] ¿Documenté los cambios y errores?
- [ ] ¿Probé la funcionalidad y responsive?
- [ ] ¿Eliminé backups después de confirmar que todo funciona?
- [ ] ¿Commit y push realizados correctamente?

---

## 🎯 RESULTADO ESPERADO

- **Cero errores** de compilación, navegación y consola.
- **Hot Module Replacement** funcionando.
- **Datos reales de Firebase** operativos.
- **Proyecto limpio y funcional** tras cada cambio.
- **Documentación clara** de cada corrección y recuperación.

---

### **NOTA FINAL**
Este protocolo es **infalible** si se aplica sin saltarse ningún paso.  
Permite corregir, restaurar y rescatar el proyecto en cualquier escenario de error.
