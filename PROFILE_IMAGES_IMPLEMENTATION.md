# Sistema de Fotos de Perfil con Firebase Storage

## Características Implementadas

### 🖼️ **ProfileAvatar Component**
- Carga automática de imágenes desde Firebase Storage
- Fallback a iniciales del usuario si no hay imagen
- Loading state con spinner
- Hover effects y animaciones
- Soporte para diferentes tamaños
- Badge opcional para subir imagen

### 📁 **Rutas de Storage Soportadas**
El sistema busca imágenes en múltiples rutas:
```
profile-images/{userId}
profile-images/{userId}.jpg
profile-images/{userId}.jpeg  
profile-images/{userId}.png
profile-images/{userId}.webp
users/{userId}/profile
users/{userId}/profile.jpg
users/{userId}/profile.jpeg
users/{userId}/profile.png
users/{userId}/profile.webp
```

### 🔧 **Hook useProfileImage**
```javascript
const { imageUrl, loading, error, refreshImage } = useProfileImage(userId, userEmail);
```

### 📤 **ProfileImageUpload Component**
- Modal de subida con preview
- Validación de formato y tamaño (max 5MB)
- Soporte para JPG, PNG, WEBP
- Progress bar durante la subida
- Opción para eliminar imagen existente
- Actualización automática en Firestore

## Uso en UserManagementPage

### En la tabla de usuarios:
```jsx
<ProfileAvatar
  userId={user.id}
  userEmail={user.email}
  displayName={user.displayName}
  size={40}
  border={true}
/>
```

### En el modal de edición:
```jsx
<ProfileAvatar
  userId={editingUser.id}
  userEmail={editingUser.email}
  displayName={formData.displayName}
  size={64}
  showUploadBadge={true}
  onUploadClick={() => setOpenImageUpload(true)}
/>
```

### Modal de subida:
```jsx
<ProfileImageUpload
  open={openImageUpload}
  onClose={() => setOpenImageUpload(false)}
  userId={editingUser?.id}
  userEmail={editingUser?.email}
  displayName={formData.displayName}
  onImageUpdated={(newImageUrl) => {
    loadUsers(); // Recargar usuarios
    setOpenImageUpload(false);
  }}
/>
```

## Estructura de Datos en Firestore

Cuando se sube una imagen, se actualiza el documento del usuario:
```javascript
{
  photoURL: "https://firebasestorage.googleapis.com/...",
  profileImagePath: "profile-images/userId",
  updatedAt: serverTimestamp()
}
```

## Firebase Storage Rules

Asegúrate de tener las reglas apropiadas en Firebase Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura de imágenes de perfil a usuarios autenticados
    match /profile-images/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Ruta alternativa
    match /users/{userId}/profile {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Características de Seguridad

1. **Validación de archivos**: Solo JPG, PNG, WEBP
2. **Límite de tamaño**: Máximo 5MB
3. **Autenticación**: Solo usuarios autenticados pueden subir
4. **Autorización**: Solo el propietario puede modificar su imagen
5. **Paths seguros**: Uso de userId como identificador único

## Próximas Mejoras Sugeridas

- [ ] Redimensionamiento automático de imágenes
- [ ] Múltiples tamaños (thumbnails)
- [ ] Compresión automática
- [ ] Soporte para arrastrar y soltar
- [ ] Crop/recorte de imágenes
- [ ] Cache local con service worker
