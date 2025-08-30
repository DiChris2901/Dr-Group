# 🗑️ Script para eliminar compromisos de Internet duplicados

## Para usar desde la consola del navegador:

1. Abrir DevTools (F12)
2. Ir a la pestaña Console
3. Pegar y ejecutar este código:

```javascript
// Función para eliminar compromisos de Internet con mes/año
async function deleteInternetCommitmentsWithDate() {
  const commitments = await firebase.firestore()
    .collection('commitments')
    .where('concept', '>=', 'Internet -')
    .where('concept', '<=', 'Internet -\uf8ff')
    .get();
  
  console.log(`Encontrados ${commitments.size} compromisos de Internet con mes/año`);
  
  const batch = firebase.firestore().batch();
  let count = 0;
  
  commitments.forEach((doc) => {
    const data = doc.data();
    if (data.concept !== 'Internet') { // Preservar el original
      console.log(`Eliminando: ${data.concept}`);
      batch.delete(doc.ref);
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Eliminados ${count} compromisos de Internet con fecha`);
  } else {
    console.log('No hay compromisos para eliminar');
  }
}

// Ejecutar la función
deleteInternetCommitmentsWithDate();
```

## O eliminar manualmente desde la interfaz:

Ve a la página de Compromisos y elimina los que tengan formato:
- "Internet - diciembre 2025"
- "Internet - enero 2026" 
- etc.

Mantén solo el que se llame "Internet" (sin fecha).
