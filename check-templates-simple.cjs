const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');

async function checkTemplatesSimple() {
  console.log('📄 VERIFICANDO PLANTILLAS DISPONIBLES\n');
  
  try {
    // Obtener plantillas
    const templates = await client.content.v1.contents.list();
    
    console.log(`✅ Encontradas ${templates.length} plantillas:\n`);
    
    for (const template of templates) {
      console.log(`📄 ${template.friendlyName}`);
      console.log(`   Content SID: ${template.sid}`);
      console.log(`   Idioma: ${template.language}`);
      console.log(`   Fecha: ${template.dateCreated?.toLocaleDateString()}`);
      
      // Intentar obtener detalles del template
      try {
        const details = await client.content.v1.contents(template.sid).fetch();
        if (details.types?.whatsapp) {
          console.log(`   ✅ Es plantilla WhatsApp`);
          console.log(`   Tipo: ${details.types.whatsapp.content_type || 'text'}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error obteniendo detalles`);
      }
      
      console.log('');
    }
    
    console.log('🧪 PARA PROBAR UNA PLANTILLA:');
    console.log('1. Copia cualquier Content SID de arriba');
    console.log('2. Pégalo en el campo "Content SID de la Plantilla" en la app');
    console.log('3. Haz clic en "Enviar Plantilla"');
    console.log('4. Si funciona, esa plantilla está aprobada ✅');
    console.log('5. Si falla, necesita aprobación ⏳');
    
    console.log('\n💡 PLANTILLA RECOMENDADA PARA PROBAR:');
    if (templates.length > 0) {
      console.log(`Content SID: ${templates[0].sid}`);
      console.log(`Nombre: ${templates[0].friendlyName}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTemplatesSimple();
