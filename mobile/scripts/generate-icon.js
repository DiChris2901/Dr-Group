const { Jimp } = require('jimp');
const path = require('path');

async function generateNotificationIcon() {
  try {
    const iconPath = path.join(__dirname, '../assets/icon.png');
    const outputPath = path.join(__dirname, '../assets/notification-icon.png');

    console.log('🎨 Leyendo ícono original:', iconPath);
    const image = await Jimp.read(iconPath);

    console.log('🔄 Convirtiendo a silueta blanca...');
    
    // Recorrer todos los píxeles
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      // Obtener el canal Alpha (transparencia)
      const alpha = this.bitmap.data[idx + 3];

      // Si el píxel no es totalmente transparente
      if (alpha > 0) {
        // Forzar a BLANCO (R=255, G=255, B=255) manteniendo el Alpha original
        this.bitmap.data[idx + 0] = 255; // Red
        this.bitmap.data[idx + 1] = 255; // Green
        this.bitmap.data[idx + 2] = 255; // Blue
      }
    });

    await image.write(outputPath);
    console.log('✅ Ícono de notificación generado:', outputPath);
    console.log('⚠️ Recuerda: Este ícono es blanco puro sobre transparente.');

  } catch (error) {
    console.error('❌ Error generando ícono:', error);
  }
}

generateNotificationIcon();
