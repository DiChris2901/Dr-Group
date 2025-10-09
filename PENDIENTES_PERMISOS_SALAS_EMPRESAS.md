# 🔐 Pendientes: Permisos Granulares para Salas y Empresas

> **Fecha**: Octubre 9, 2025  
> **Estado**: Detección de admin implementada, falta restricción real

---

## ✅ Lo que ya funciona

- ✅ **Helper centralizado de permisos**: `src/utils/permissions.js`
  - Función `isAdminUser(currentUser, userProfile)` detecta ADMIN/SUPER_ADMIN o usuarios del sistema
- ✅ **Detección de admin en páginas clave**:
  - `SalasPage.jsx`: calcula `isAdmin`
  - `CompaniesPage.jsx`: calcula `isAdmin`
  - Logs de auditoría incluyen `performedByRole` y `performedByIsAdmin`
- ✅ **Servidor dev corriendo**: http://localhost:5173/

---

## ❌ Lo que NO está restringido (CRÍTICO)

### 1. Firestore Rules (Seguridad Real)

**Problema actual** en `firestore.rules`:
```javascript
// Salas: Solo usuarios autenticados
match /salas/{salaId} {
  allow read, write: if request.auth != null;
}

// Empresas: Solo usuarios autenticados
match /companies/{companyId} {
  allow read, write: if request.auth != null;
}
```

**Resultado**: Cualquier usuario autenticado puede crear/editar/eliminar salas y empresas.

**Solución requerida**:
```javascript
// Helper para detectar admin
function isAdmin() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'SUPER_ADMIN'];
}

// Helper para verificar permisos por empresa (opcional)
function hasCompanyPermission(companyId) {
  return request.auth != null && (
    isAdmin() ||
    companyId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companiesWrite
  );
}

// Salas: Solo admins o usuarios con permiso en la empresa de la sala
match /salas/{salaId} {
  allow read: if request.auth != null;
  allow create: if isAdmin() || hasCompanyPermission(request.resource.data.companyId);
  allow update, delete: if isAdmin() || hasCompanyPermission(resource.data.companyId);
}

// Empresas: Solo admins o usuarios autorizados
match /companies/{companyId} {
  allow read: if request.auth != null;
  allow create: if isAdmin();
  allow update, delete: if isAdmin() || hasCompanyPermission(companyId);
}
```

---

### 2. Storage Rules (Documentos de Empresas)

**Problema actual** en `storage.rules`:
```javascript
match /company-documents/{companyId}/{fileName} {
  allow read, write: if request.auth != null;
}
```

**Solución requerida**:
```javascript
match /company-documents/{companyId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.email in [
    'admin@drgroup.com', 
    'diego@drgroup.com',
    'daruedagu@gmail.com'
  ] || hasCompanyPermission(companyId);
}
```

---

### 3. UI/UX (Restricción Visual)

**Archivos a modificar**:
- `src/pages/SalasPage.jsx`
- `src/pages/CompaniesPage.jsx`

**Cambios necesarios**:

#### En `SalasPage.jsx`:
```jsx
// Calcular permisos de edición
const canEditSala = (sala) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(sala.companyId);
};

// Ocultar/deshabilitar botones
<Tooltip title={!canEditSala(sala) ? "No tienes permisos" : "Editar sala"}>
  <span>
    <IconButton
      disabled={!canEditSala(sala)}
      onClick={() => handleEditSala(sala)}
    >
      <Edit />
    </IconButton>
  </span>
</Tooltip>

<Tooltip title={!canEditSala(sala) ? "No tienes permisos" : "Eliminar sala"}>
  <span>
    <IconButton
      disabled={!canEditSala(sala)}
      onClick={() => handleDeleteSala(sala)}
    >
      <Delete />
    </IconButton>
  </span>
</Tooltip>
```

#### En `CompaniesPage.jsx`:
```jsx
// Calcular permisos de edición
const canEditCompany = (company) => {
  if (isAdmin) return true;
  if (!userProfile?.companiesWrite) return false;
  return userProfile.companiesWrite.includes(company.id);
};

// Aplicar misma lógica de deshabilitar botones
```

---

## 📊 Modelo de Datos Requerido

### En `users/{uid}`:
```javascript
{
  uid: "user123",
  email: "usuario@example.com",
  role: "USER", // o "ADMIN", "SUPER_ADMIN"
  
  // Array de IDs de empresas donde el usuario puede escribir
  companiesWrite: ["companyId1", "companyId2"],
  
  // O modelo alternativo con permisos granulares:
  permissions: {
    companies: {
      "companyId1": { read: true, write: true },
      "companyId2": { read: true, write: false }
    }
  }
}
```

### En `salas/{salaId}`:
```javascript
{
  id: "sala123",
  name: "Sala Principal",
  companyId: "companyId1", // ← CRÍTICO: asociar sala a empresa
  // ...resto de campos
}
```

**⚠️ Verificar**: Todas las salas existentes tienen `companyId` asignado.

---

## 🚀 Plan de Implementación

### Fase 1: Preparación de Datos (30 min)
1. ✅ Verificar que todas las salas tengan `companyId`
2. ✅ Agregar campo `companiesWrite: []` en usuarios existentes
3. ✅ Asignar empresas a usuarios según necesidad de negocio

### Fase 2: Seguridad Backend (20 min)
1. ✅ Actualizar `firestore.rules` con helpers y restricciones
2. ✅ Actualizar `storage.rules` para company-documents
3. ✅ Deploy: `firebase deploy --only firestore:rules,storage`

### Fase 3: UI/UX (40 min)
1. ✅ Modificar `SalasPage.jsx`: agregar lógica `canEditSala()`
2. ✅ Modificar `CompaniesPage.jsx`: agregar lógica `canEditCompany()`
3. ✅ Deshabilitar botones de editar/eliminar para usuarios sin permisos
4. ✅ Mostrar tooltips informativos ("No tienes permisos")

### Fase 4: Testing (15 min)
1. ✅ Login como admin → debe poder editar todo
2. ✅ Login como usuario normal → solo ver, no editar
3. ✅ Login como usuario con `companiesWrite` → editar solo sus empresas
4. ✅ Verificar que Storage respeta las reglas

### Fase 5: Deploy Final (5 min)
```bash
npm run build
firebase deploy --only hosting
```

---

## 📋 Checklist de Implementación

- [ ] Verificar `companyId` en todas las salas
- [ ] Agregar `companiesWrite` en usuarios
- [ ] Actualizar `firestore.rules`
- [ ] Actualizar `storage.rules`
- [ ] Deploy rules: `firebase deploy --only firestore:rules,storage`
- [ ] Modificar `SalasPage.jsx` con restricciones UI
- [ ] Modificar `CompaniesPage.jsx` con restricciones UI
- [ ] Testing con diferentes roles
- [ ] Build y deploy: `npm run build && firebase deploy --only hosting`
- [ ] Documentar permisos en README o wiki interna

---

## 🔗 Referencias

- Helper de permisos: `src/utils/permissions.js`
- Configuración de usuarios sistema: `src/config/systemUsers.js`
- Reglas Firestore: `firestore.rules`
- Reglas Storage: `storage.rules`
- Página Salas: `src/pages/SalasPage.jsx`
- Página Empresas: `src/pages/CompaniesPage.jsx`

---

## ⚠️ Notas Importantes

1. **No es solo UI**: Ocultar botones NO es seguridad real. Las reglas de Firestore/Storage son críticas.
2. **Testing exhaustivo**: Probar con usuarios reales antes de producción.
3. **Migración gradual**: Si hay muchos usuarios, implementar por fases.
4. **Logs de auditoría**: Ya están enriquecidos con `performedByIsAdmin`.
5. **Rollback plan**: Mantener backup de rules anteriores.

---

**Última actualización**: Octubre 9, 2025  
**Responsable**: Equipo DR Group  
**Prioridad**: 🔴 ALTA (Seguridad)
