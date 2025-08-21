import admin from 'firebase-admin';

// Verificar si ya está inicializado
if (!admin.apps.length) {
  // Usar las variables de entorno o archivo de configuración
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dr-group-dashboard'
  });
}

const db = admin.firestore();

async function checkUserData() {
  try {
    console.log('🔍 Buscando datos de usuarios...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No se encontraron usuarios');
      return;
    }

    console.log(`✅ Encontrados ${usersSnapshot.size} usuarios:`);
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`\n👤 Usuario ID: ${doc.id}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Nombre: ${userData.name || userData.displayName || 'Sin nombre'}`);
      console.log(`   Teléfono: ${userData.phone || 'Sin teléfono'}`);
      console.log(`   Cargo: ${userData.position || 'Sin cargo'}`);
      console.log(`   Departamento: ${userData.department || 'Sin departamento'}`);
      console.log(`   Empresa: ${userData.company || 'Sin empresa'}`);
      console.log(`   Ubicación: ${userData.location || 'Sin ubicación'}`);
      console.log(`   Rol: ${userData.role || 'Sin rol'}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Intentar con configuración alternativa
    console.log('\n🔄 Intentando configuración alternativa...');
    try {
      // Reiniciar admin con configuración del proyecto
      import('firebase/app').then(async ({ initializeApp }) => {
        const { getFirestore, collection, getDocs, limit, query } = await import('firebase/firestore');
        
        const firebaseConfig = {
          apiKey: "AIzaSyDONVcNFdlD-nD_VnV3SLJ1Q4gWWVJvPeI",
          authDomain: "dr-group-dashboard.firebaseapp.com", 
          projectId: "dr-group-dashboard",
          storageBucket: "dr-group-dashboard.appspot.com",
          messagingSenderId: "123456789012",
          appId: "1:123456789012:web:abcdef123456"
        };
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        const usersQuery = query(collection(db, 'users'), limit(5));
        const querySnapshot = await getDocs(usersQuery);
        
        if (querySnapshot.empty) {
          console.log('❌ No se encontraron usuarios con configuración alternativa');
          return;
        }
        
        console.log(`✅ Configuración alternativa exitosa. Encontrados ${querySnapshot.size} usuarios:`);
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log(`\n👤 Usuario ID: ${doc.id}`);
          console.log(`   Email: ${userData.email}`);
          console.log(`   Nombre: ${userData.name || userData.displayName || 'Sin nombre'}`);
          console.log(`   Teléfono: ${userData.phone || 'Sin teléfono'}`);
          console.log(`   Cargo: ${userData.position || 'Sin cargo'}`);
        });
      });
      
    } catch (altError) {
      console.error('❌ Error con configuración alternativa:', altError.message);
    }
  }
  
  process.exit(0);
}

checkUserData();
