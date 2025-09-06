# ⚡ GUÍA RÁPIDA - POST APROBACIÓN META

**Para usar cuando Meta apruebe tu verificación de negocio**

---

## 🔍 PASO 1: VERIFICAR APROBACIÓN (2 minutos)

```bash
# Ejecutar en terminal desde la carpeta del proyecto
node quick-whatsapp-status.cjs
```

**Busca este cambio:**
```
🟢 WhatsApp: ✅ ACTIVO  ← Si dice esto, ¡YA ESTÁ LISTO!
```

---

## 🧪 PASO 2: PROBAR FUNCIONAMIENTO (5 minutos)

1. **Abrir aplicación**: http://localhost:5174/
2. **Ir a configuración de notificaciones** (menú usuario)
3. **Enviar mensaje de prueba**
4. **Verificar remitente**: Debe llegar desde **+12312419541** (no +14155238886)

---

## 🎯 PASO 3: CONFIRMAR PLANTILLAS (5 minutos)

En la aplicación, sección "Prueba de Plantilla":
- **Content SID**: `HX86860612a501eb8d33b486c679d4c900`
- **Clic en "Enviar Plantilla"**
- **Verificar recepción** en WhatsApp

---

## ✅ PASO 4: ACTIVAR SISTEMA COMPLETO (2 minutos)

¡Listo! El sistema ya está funcionando automáticamente:
- ✅ Notificaciones diarias a las 9:00 AM
- ✅ Alertas de compromisos próximos a vencer
- ✅ Notificaciones de nuevos compromisos
- ✅ Todo desde tu número Business

---

## 🚨 SI ALGO NO FUNCIONA

```bash
# Ejecutar estos comandos uno por uno
node check-whatsapp-activation.cjs
node check-templates-simple.cjs
firebase deploy --only functions
```

---

## 📱 NEXT STEPS (OPCIONAL)

### Crear plantillas en español:
1. **Twilio Console** > Messaging > Content
2. **"Create Content"** > WhatsApp Template
3. **Ejemplos recomendados**:
   - "Alerta: Su compromiso vence en {{days}} días"
   - "Recordatorio: Pago pendiente {{amount}}"
   - "Confirmación: Documento recibido correctamente"

---

**🎉 ¡SISTEMA WHATSAPP BUSINESS COMPLETAMENTE OPERATIVO!** 🎉
