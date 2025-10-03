# 🎯 GUÍA VISUAL - Configuración de Template en EmailJS

## 📺 Paso a Paso con Capturas Conceptuales

### **PASO 1: Crear el Template**

1. Ve a **"Email Templates"** en el dashboard de EmailJS
2. Haz clic en **"Create New Template"**
3. Dale un nombre descriptivo: `DR Group - Notificación General`

---

### **PASO 2: Pegar el HTML**

```
┌──────────────────────────────────────────────────────┐
│  EmailJS Template Editor                             │
├──────────────────────────────────────────────────────┤
│  [Content]  [Settings]  [Test]                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Haz clic en la pestaña "Content"                │
│  2. BORRA todo el contenido por defecto             │
│  3. PEGA el HTML completo de:                       │
│     docs/emailjs-template.html                       │
│                                                       │
│  <!DOCTYPE html>                                     │
│  <html lang="es">                                    │
│  <head>                                              │
│    ...todo el código HTML...                        │
│  </body>                                             │
│  </html>                                             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### **PASO 3: Configurar Settings (CRÍTICO)**

```
┌──────────────────────────────────────────────────────┐
│  Settings del Template                               │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📧 To Email                                         │
│  ┌────────────────────────────────────────┐        │
│  │ {{to_email}}                            │        │
│  └────────────────────────────────────────┘        │
│  ⚠️ IMPORTANTE: Debe ser exactamente {{to_email}}   │
│     (con las llaves dobles)                         │
│                                                       │
│  👤 From Name                                        │
│  ┌────────────────────────────────────────┐        │
│  │ DR Group                                │        │
│  └────────────────────────────────────────┘        │
│  💡 Esto es lo que verá el usuario como remitente  │
│                                                       │
│  💌 Reply To (Opcional)                             │
│  ┌────────────────────────────────────────┐        │
│  │ soporte@drgroup.com                     │        │
│  └────────────────────────────────────────┘        │
│  💡 Email donde llegarán las respuestas            │
│                                                       │
│  📝 Subject (Asunto)                                │
│  ┌────────────────────────────────────────┐        │
│  │ {{subject}}                             │        │
│  └────────────────────────────────────────┘        │
│  ⚠️ IMPORTANTE: Debe ser exactamente {{subject}}    │
│     (con las llaves dobles)                         │
│                                                       │
│  [Save Template]                                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### **PASO 4: Probar el Template (Opcional)**

```
┌──────────────────────────────────────────────────────┐
│  Test del Template                                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Haz clic en la pestaña "Test"                   │
│  2. Llena los campos de prueba:                     │
│                                                       │
│     to_email:           tu@email.com                │
│     to_name:            Tu Nombre                   │
│     subject:            Prueba de Template          │
│     message:            Este es un mensaje de prueba│
│     notification_type:  Prueba                      │
│     action_url:         https://drgroup.com         │
│     timestamp:          03/10/2025 10:30 AM         │
│     company_name:       DR Group                    │
│                                                       │
│  3. Haz clic en "Send Test Email"                   │
│  4. Revisa tu bandeja de entrada                    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### **PASO 5: Copiar el Template ID**

```
┌──────────────────────────────────────────────────────┐
│  Template: DR Group - Notificación General          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ✅ Template guardado exitosamente                  │
│                                                       │
│  📋 Template ID:                                     │
│  ┌────────────────────────────────────────┐        │
│  │ template_abc123xyz                      │ [Copy] │
│  └────────────────────────────────────────┘        │
│                                                       │
│  💾 GUARDA ESTE ID para el archivo .env            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## ❓ PREGUNTAS FRECUENTES

### **P1: ¿Dónde configuro las otras variables como {{to_name}}, {{message}}, etc?**

**R**: ¡NO NECESITAS! EmailJS las detecta automáticamente del HTML. Solo configura en "Settings":
- `{{to_email}}`
- `{{subject}}`
- `From Name` (texto fijo: "DR Group")

### **P2: ¿Qué pasa si escribo `to_email` sin llaves en "To Email"?**

**R**: ❌ NO funcionará. Debe ser exactamente `{{to_email}}` con las llaves dobles `{{ }}`.

### **P3: ¿Puedo cambiar el "From Name"?**

**R**: ✅ SÍ. Puedes poner:
- Texto fijo: `DR Group Dashboard`
- Variable: `{{from_name}}` (si quieres que sea dinámico)

### **P4: ¿El "Reply To" es obligatorio?**

**R**: ❌ NO. Es opcional. Si lo dejas vacío, las respuestas irán al email conectado en el servicio.

### **P5: ¿Cómo pruebo si funciona?**

**R**: Usa la pestaña "Test" en EmailJS O espera a configurar el .env y prueba desde la app.

---

## 🎯 RESUMEN RÁPIDO

### **3 PASOS CRÍTICOS:**

1. **Content tab** → Pegar HTML completo
2. **Settings tab** → Configurar:
   - To Email: `{{to_email}}`
   - From Name: `DR Group`
   - Subject: `{{subject}}`
3. **Save** → Copiar Template ID

### **⚠️ ERRORES COMUNES:**

❌ Escribir `to_email` sin llaves → ✅ Debe ser `{{to_email}}`  
❌ Olvidar guardar el template → ✅ Hacer clic en "Save"  
❌ No copiar el Template ID → ✅ Guardarlo para el .env  

---

## 📞 ¿NECESITAS AYUDA?

Si ves algo diferente en tu dashboard de EmailJS:
1. Verifica que estés en la versión actual de EmailJS
2. Busca secciones equivalentes con nombres similares
3. Lo importante es configurar: destinatario, remitente y asunto

---

**¡Listo! Con esto deberías poder configurar el template sin problemas.** 🚀
