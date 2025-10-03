# 📧 GUÍA DE CONFIGURACIÓN - EmailJS para DR Group

**Fecha**: 3 de octubre de 2025  
**Estado**: 🚀 LISTO PARA CONFIGURAR

---

## 📋 PASO 1: CREAR CUENTA EN EMAILJS

### 1.1 Registro
1. Ve a: **https://www.emailjs.com/**
2. Haz clic en **"Sign Up"**
3. Regístrate con tu email (recomendado: usar email corporativo de DR Group)
4. Verifica tu email

### 1.2 Plan Gratuito
- ✅ **200 emails/mes GRATIS**
- ✅ Sin tarjeta de crédito requerida
- ✅ Perfecto para inicio

---

## 📋 PASO 2: CONFIGURAR SERVICIO DE EMAIL

### 2.1 Conectar Gmail (Recomendado)
1. En el dashboard de EmailJS, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona **"Gmail"**
4. Sigue las instrucciones para conectar tu cuenta de Gmail
5. **IMPORTANTE**: Usa una cuenta Gmail específica para DR Group
   - Ejemplo: `notificaciones@drgroup.com` o similar
   - NO uses tu email personal principal

### 2.2 Copiar Service ID
- Una vez conectado, verás tu **Service ID**
- Ejemplo: `service_abc123xyz`
- **GUÁRDALO**: Lo necesitarás para el archivo `.env`

---

## 📋 PASO 3: CREAR TEMPLATE DE EMAIL

### 3.1 Crear Nuevo Template
1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Dale un nombre: **"DR Group - Notificación General"**

### 3.2 Diseño del Template HTML

**Copia y pega este template en EmailJS:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f6f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px 40px;
      color: #333333;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #667eea;
    }
    .message {
      font-size: 16px;
      margin-bottom: 25px;
      white-space: pre-line;
    }
    .notification-type {
      display: inline-block;
      padding: 8px 16px;
      background-color: #e8f4fd;
      color: #1976d2;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 DR Group Dashboard</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hola {{to_name}},
      </div>

      <div class="notification-type">
        📧 {{notification_type}}
      </div>

      <div class="message">
        {{message}}
      </div>

      <!-- Call to Action -->
      <div style="text-align: center;">
        <a href="{{action_url}}" class="cta-button">
          🚀 Ir al Dashboard
        </a>
      </div>

      <!-- Additional Info -->
      <div class="info-box">
        <strong>📅 Fecha:</strong> {{timestamp}}<br>
        <strong>🏢 Empresa:</strong> {{company_name}}
      </div>

      <!-- Security Notice -->
      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        <strong>🔐 Nota de seguridad:</strong> Si no reconoces esta actividad, contacta inmediatamente al administrador del sistema.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Este es un correo automático del sistema DR Group.</p>
      <p>© 2025 DR Group. Todos los derechos reservados.</p>
      <p>
        <a href="https://dr-group-cd21b.web.app">Dashboard</a> |
        <a href="mailto:soporte@drgroup.com">Soporte</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### 3.3 Configurar Variables del Template en EmailJS

**IMPORTANTE**: EmailJS detecta automáticamente las variables `{{variable}}` del HTML. Solo necesitas configurar estas 3 en la sección **"Settings"** del template:

#### **Paso a paso:**

1. **En el editor de template de EmailJS**, busca la pestaña **"Settings"** (arriba del editor)

2. **Configura estos 3 campos obligatorios:**

   - **To Email**: Escribe exactamente → `{{to_email}}`
   - **From Name**: Escribe exactamente → `DR Group`
   - **Reply To**: Escribe tu email corporativo o deja vacío
   - **Subject**: Escribe exactamente → `{{subject}}`

3. **Guarda el template** (botón "Save" arriba a la derecha)

#### **Variables que EmailJS detecta automáticamente:**

✅ Estas variables están en tu HTML y EmailJS las detecta solo:
- `{{to_name}}` - Nombre del usuario
- `{{message}}` - Mensaje principal
- `{{notification_type}}` - Tipo de notificación
- `{{action_url}}` - URL al dashboard
- `{{timestamp}}` - Fecha y hora
- `{{company_name}}` - DR Group

**NO necesitas configurarlas manualmente**, solo asegúrate de que estén en tu HTML (ya están en el template que copiaste).

#### **Screenshot de referencia:**
```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ To Email:    {{to_email}}          │
│ From Name:   DR Group              │
│ Reply To:    (opcional)            │
│ Subject:     {{subject}}           │
└─────────────────────────────────────┘
```

### 3.4 Copiar Template ID
- Después de guardar, verás tu **Template ID**
- Ejemplo: `template_xyz789abc`
- **GUÁRDALO**: Lo necesitarás para el archivo `.env`

---

## 📋 PASO 4: OBTENER PUBLIC KEY

### 4.1 Obtener API Key
1. Ve a **"Account"** → **"General"**
2. Busca **"Public Key"** o **"API Key"**
3. Copia tu Public Key
4. Ejemplo: `pk_abc123xyz789`
5. **GUÁRDALO**: Lo necesitarás para el archivo `.env`

---

## 📋 PASO 5: CONFIGURAR VARIABLES DE ENTORNO

### 5.1 Editar archivo `.env`

Abre el archivo `.env` en la raíz del proyecto y reemplaza:

```env
# EmailJS Configuration - Notificaciones por Email
VITE_EMAILJS_SERVICE_ID=service_abc123xyz      # ← TU SERVICE ID AQUÍ
VITE_EMAILJS_TEMPLATE_ID=template_xyz789abc    # ← TU TEMPLATE ID AQUÍ
VITE_EMAILJS_PUBLIC_KEY=pk_abc123xyz789        # ← TU PUBLIC KEY AQUÍ
```

### 5.2 Verificar que .env está en .gitignore

**IMPORTANTE**: Asegúrate de que `.env` esté en `.gitignore` para no subir credenciales a Git.

---

## 📋 PASO 6: PROBAR ENVÍO

### 6.1 Reiniciar el servidor de desarrollo
```bash
# Detener el servidor actual (Ctrl + C)
# Iniciar de nuevo para cargar las nuevas variables
npm run dev
```

### 6.2 Probar desde la aplicación
1. Ve a: `http://localhost:5173/users`
2. Haz clic en el icono de campana (🔔) de cualquier usuario
3. Activa **Email**
4. Haz clic en **"Prueba"**
5. **Verifica tu bandeja de entrada**

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Cuenta de EmailJS creada
- [ ] Servicio de Gmail conectado
- [ ] Template HTML creado y guardado
- [ ] Service ID copiado
- [ ] Template ID copiado
- [ ] Public Key copiada
- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor de desarrollo reiniciado
- [ ] Email de prueba enviado y recibido

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema 1: "EmailJS - Falta PUBLIC_KEY en variables de entorno"
**Solución**: Verifica que las variables en `.env` usen el prefijo `VITE_`

### Problema 2: "Error 403 - Invalid API Key"
**Solución**: Verifica que la Public Key sea correcta y esté activa en tu cuenta

### Problema 3: "No recibo el email"
**Solución**: 
- Revisa la carpeta de spam
- Verifica que el servicio de Gmail esté correctamente conectado
- Revisa los logs en el dashboard de EmailJS

### Problema 4: "Error de CORS"
**Solución**: EmailJS maneja CORS automáticamente, pero asegúrate de usar el dominio correcto

---

## 📚 RECURSOS ADICIONALES

- **Dashboard EmailJS**: https://dashboard.emailjs.com/
- **Documentación oficial**: https://www.emailjs.com/docs/
- **Límites del plan gratuito**: 200 emails/mes
- **Upgrade**: $7/mes para 1000 emails/mes

---

## 🎯 PRÓXIMOS PASOS

Una vez configurado EmailJS:
1. ✅ Probar envío manual desde el modal
2. ✅ Implementar envío automático en eventos de usuario
3. 🚀 Configurar Telegram Bot (siguiente fase)
4. 🔄 Crear Firebase Functions para envío diario

---

**¿Necesitas ayuda?** Revisa este documento paso a paso y verifica cada checkpoint.
