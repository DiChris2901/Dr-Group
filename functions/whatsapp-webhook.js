const { onRequest } = require('firebase-functions/v2/https');

/**
 * Webhook para recibir estados de WhatsApp
 * URL: https://your-project-id.cloudfunctions.net/whatsapp-status-webhook
 */
exports.whatsappStatusWebhook = onRequest({
  cors: true,
}, (request, response) => {
  try {
    console.log('📡 Webhook WhatsApp recibido:');
    console.log('🔧 Método:', request.method);
    console.log('📨 Headers:', JSON.stringify(request.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(request.body, null, 2));
    console.log('🔍 Query:', JSON.stringify(request.query, null, 2));

    // Responder a Twilio que recibimos el webhook
    response.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    response.status(500).send('Error');
  }
});

/**
 * Webhook para mensajes entrantes de WhatsApp
 */
exports.whatsappIncomingWebhook = onRequest({
  cors: true,
}, (request, response) => {
  try {
    console.log('📱 Mensaje entrante de WhatsApp:');
    console.log('📦 Datos:', JSON.stringify(request.body, null, 2));
    
    // Aquí puedes procesar mensajes entrantes si es necesario
    // Por ejemplo, respuestas automáticas o comandos
    
    response.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error procesando mensaje entrante:', error);
    response.status(500).send('Error');
  }
});
