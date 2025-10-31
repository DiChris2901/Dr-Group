/**
 * 🤖 Gemini AI Assistant Service
 * DR Group Dashboard - Asistente Inteligente con acceso total a Firebase
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

// API Key de Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Lista de modelos a intentar (en orden de preferencia)
const MODEL_FALLBACKS = [
  'gemini-2.5-flash',    // ✅ Modelo oficial más reciente (según docs Google)
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro'
];

let cachedModel = null;

/**
 * 📅 Analizar contexto temporal de la pregunta
 */
const analyzeTimeContext = (question) => {
  const now = new Date();
  const questionLower = question.toLowerCase();
  
  const timeContext = {
    period: null,
    startDate: null,
    endDate: null,
    description: ''
  };
  
  // Detectar "este mes" o "del mes"
  if (questionLower.includes('este mes') || 
      questionLower.includes('del mes') ||
      questionLower.includes('en el mes')) {
    timeContext.period = 'current_month';
    timeContext.startDate = startOfMonth(now);
    timeContext.endDate = endOfMonth(now);
    timeContext.description = format(now, 'MMMM yyyy', { locale: es });
  }
  
  // Detectar "este año" o "del año" o "en lo que va del año"
  else if (questionLower.includes('este año') || 
           questionLower.includes('del año') ||
           questionLower.includes('en lo que va') ||
           questionLower.includes('lo que va de') ||
           questionLower.includes('lo que va del')) {
    timeContext.period = 'current_year';
    timeContext.startDate = startOfYear(now);
    timeContext.endDate = now; // Hasta hoy
    timeContext.description = `año ${now.getFullYear()} (hasta hoy)`;
  }
  
  // Detectar "hoy"
  else if (questionLower.includes('hoy')) {
    timeContext.period = 'today';
    timeContext.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    timeContext.endDate = now;
    timeContext.description = 'hoy';
  }
  
  return timeContext;
};

/**
 * 💰 Filtrar pagos por rango de fechas
 */
const filterPaymentsByDateRange = (payments, startDate, endDate) => {
  if (!startDate || !endDate) return payments;
  
  return payments.filter(payment => {
    const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
    return isWithinInterval(paymentDate, { start: startDate, end: endDate });
  });
};

/**
 * 📊 Calcular estadísticas de pagos
 */
const calculatePaymentStats = (payments) => {
  if (payments.length === 0) {
    return { total: 0, count: 0, average: 0 };
  }
  
  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const count = payments.length;
  const average = total / count;
  
  return { total, count, average };
};

/**
 * 📋 Filtrar compromisos por rango de fechas
 */
const filterCommitmentsByDateRange = (commitments, startDate, endDate) => {
  if (!startDate || !endDate) return commitments;
  
  return commitments.filter(commitment => {
    const dueDate = commitment.dueDate instanceof Date ? commitment.dueDate : new Date(commitment.dueDate);
    return isWithinInterval(dueDate, { start: startDate, end: endDate });
  });
};

/**
 * 🎯 Normalizar texto para búsqueda (sin acentos, minúsculas)
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
};

/**
 * 🔍 Extraer palabras clave de la pregunta (mejorado)
 */
const extractKeywords = (text) => {
  const stopWords = [
    'cual', 'cuales', 'es', 'son', 'el', 'la', 'los', 'las', 'de', 'del', 
    'para', 'por', 'en', 'con', 'sin', 'que', 'donde', 'como', 'cuando',
    'ultimo', 'ultima', 'ultimos', 'ultimas', 'fue', 'fueron', 'esta',
    'estan', 'tiene', 'tienen', 'hay', 'dame', 'muestra', 'muestrame',
    'dime', 'cuanto', 'cuantos', 'nit', 'empresa', 'sas', 'sa', 'ltda',
    'cual', 'cuales', 'dime', 'dame'
  ];
  
  const words = normalizeText(text)
    .replace(/[¿?¡!.,;:()]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  return words;
};

/**
 * 🏢 Buscar empresas por nombre o NIT (búsqueda fuzzy mejorada)
 */
const searchCompanies = async (keywords) => {
  try {
    const companiesRef = collection(db, 'companies');
    const snapshot = await getDocs(companiesRef);
    
    const companies = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(company => {
        // Normalizar textos de la empresa
        const nameNormalized = normalizeText(company.name || '');
        const nitNormalized = normalizeText(company.nit || '');
        const contactNormalized = normalizeText(company.contactName || '');
        
        // Dividir el nombre en palabras individuales
        const companyWords = nameNormalized.split(/\s+/);
        
        // Buscar si algún keyword coincide
        return keywords.some(keyword => {
          const keywordNormalized = normalizeText(keyword);
          
          // 1. Coincidencia exacta en nombre completo o NIT
          if (nameNormalized.includes(keywordNormalized) || 
              nitNormalized.includes(keywordNormalized) ||
              contactNormalized.includes(keywordNormalized)) {
            return true;
          }
          
          // 2. Coincidencia con palabras individuales del nombre
          return companyWords.some(word => 
            word.includes(keywordNormalized) || 
            keywordNormalized.includes(word) ||
            word.startsWith(keywordNormalized)
          );
        });
      });
    
    console.log(`✅ Encontradas ${companies.length} empresas para keywords:`, keywords);
    return companies;
  } catch (error) {
    console.error('Error buscando empresas:', error);
    return [];
  }
};

/**
 * 🎰 Buscar salas por nombre (búsqueda fuzzy mejorada)
 */
const searchSalas = async (keywords) => {
  try {
    const salasRef = collection(db, 'salas');
    const snapshot = await getDocs(salasRef);
    
    const salas = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(sala => {
        const nameNormalized = normalizeText(sala.name || '');
        const addressNormalized = normalizeText(sala.address || '');
        
        return keywords.some(keyword => {
          const keywordNormalized = normalizeText(keyword);
          return nameNormalized.includes(keywordNormalized) || 
                 addressNormalized.includes(keywordNormalized);
        });
      });
    
    // Enriquecer con datos de la empresa
    for (const sala of salas) {
      if (sala.companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', sala.companyId));
          if (companyDoc.exists()) {
            sala.company = { id: companyDoc.id, ...companyDoc.data() };
          }
        } catch (err) {
          console.error('Error obteniendo empresa de sala:', err);
        }
      }
    }
    
    return salas;
  } catch (error) {
    console.error('Error buscando salas:', error);
    return [];
  }
};

/**
 * 💰 Buscar pagos por empresa o concepto
 */
const searchPayments = async (companyIds = [], keywords = [], limitCount = 10) => {
  try {
    const paymentsRef = collection(db, 'payments');
    let q;
    
    if (companyIds.length > 0) {
      // Buscar por empresa específica
      q = query(
        paymentsRef,
        where('companyId', 'in', companyIds.slice(0, 10)), // Firestore límite: 10 IDs
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    } else {
      // Buscar todos ordenados por fecha
      q = query(
        paymentsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    let payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertir Timestamp a Date
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      };
    });
    
    // Filtrar por palabras clave en concepto si se especificaron (normalizado)
    if (keywords.length > 0) {
      payments = payments.filter(payment => {
        const conceptNormalized = normalizeText(payment.concept || '');
        const beneficiaryNormalized = normalizeText(payment.beneficiary || '');
        
        return keywords.some(keyword => {
          const keywordNormalized = normalizeText(keyword);
          return conceptNormalized.includes(keywordNormalized) || 
                 beneficiaryNormalized.includes(keywordNormalized);
        });
      });
    }
    
    return payments;
  } catch (error) {
    console.error('Error buscando pagos:', error);
    return [];
  }
};

/**
 * 📋 Buscar compromisos por empresa o estado
 */
const searchCommitments = async (companyIds = [], status = null, limitCount = 10) => {
  try {
    const commitmentsRef = collection(db, 'commitments');
    let q;
    
    if (companyIds.length > 0 && status) {
      q = query(
        commitmentsRef,
        where('companyId', 'in', companyIds.slice(0, 10)),
        where('status', '==', status),
        orderBy('dueDate', 'asc'),
        limit(limitCount)
      );
    } else if (companyIds.length > 0) {
      q = query(
        commitmentsRef,
        where('companyId', 'in', companyIds.slice(0, 10)),
        orderBy('dueDate', 'asc'),
        limit(limitCount)
      );
    } else if (status) {
      q = query(
        commitmentsRef,
        where('status', '==', status),
        orderBy('dueDate', 'asc'),
        limit(limitCount)
      );
    } else {
      q = query(
        commitmentsRef,
        orderBy('dueDate', 'asc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const commitments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate)
      };
    });
    
    return commitments;
  } catch (error) {
    console.error('Error buscando compromisos:', error);
    return [];
  }
};

/**
 * 💵 Buscar liquidaciones por sala o mes
 */
const searchLiquidaciones = async (companyIds = [], limitCount = 5) => {
  try {
    const liquidacionesRef = collection(db, 'liquidaciones');
    let q;
    
    if (companyIds.length > 0) {
      q = query(
        liquidacionesRef,
        where('companyId', 'in', companyIds.slice(0, 10)),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        liquidacionesRef,
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const liquidaciones = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha)
      };
    });
    
    return liquidaciones;
  } catch (error) {
    console.error('Error buscando liquidaciones:', error);
    return [];
  }
};

/**
 * 🧠 Analizar intención del usuario con Gemini (Pre-análisis)
 */
const analyzeUserIntent = async (question, conversationHistory = []) => {
  try {
    const modelName = await getAvailableModel();
    const apiUrl = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
    
    // Construir contexto de conversación reciente
    const recentHistory = conversationHistory.slice(-4).map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n');
    
    const intentPrompt = `Eres un analizador de intenciones. Analiza esta pregunta considerando el historial de conversación y determina QUÉ DATOS necesitas consultar en Firebase.

${recentHistory ? `HISTORIAL DE CONVERSACIÓN RECIENTE:\n${recentHistory}\n\n` : ''}PREGUNTA ACTUAL DEL USUARIO:
"${question}"

IMPORTANTE: Si el usuario usa pronombres ("él", "ella", "esa empresa", "esas salas") refiere al historial para identificar de qué/quién habla.

RESPONDE EN JSON (sin markdown, solo JSON puro):
{
  "needsCompanies": true/false,
  "needsPayments": true/false,
  "needsCommitments": true/false,
  "needsSalas": true/false,
  "needsLiquidaciones": true/false,
  "companyNames": ["nombre1", "nombre2"] o [],
  "paymentConcepts": ["concepto1"] o [],
  "timePeriod": "current_month" | "current_year" | "today" | null,
  "searchScope": "all" | "specific",
  "intent": "breve descripción de lo que quiere el usuario"
}

EJEMPLOS:
- "¿Cuánto se pagó este mes?" → needsPayments: true, timePeriod: "current_month", searchScope: "all"
- "NIT de DiverGames" → needsCompanies: true, companyNames: ["DiverGames"], searchScope: "specific"
- "compromisos pendientes de póliza" → needsCommitments: true, paymentConcepts: ["poliza"], searchScope: "all"

RESPONDE SOLO EL JSON:`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: intentPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Más preciso
          maxOutputTokens: 500,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Limpiar markdown si viene con ```json
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const intent = JSON.parse(cleanJson);
      
      console.log('🎯 Intención detectada:', intent);
      return intent;
    }
  } catch (error) {
    console.log('⚠️ No se pudo analizar intención, usando análisis básico');
  }
  
  // Fallback: análisis básico
  return null;
};

/**
 * 🧠 Obtener contexto completo de Firebase según la pregunta
 */
export const getFirebaseContext = async (question, userProfile, conversationHistory = []) => {
  console.log('🔍 Analizando pregunta:', question);
  
  // 🎯 PASO 1: Analizar intención con Gemini (incluye historial para contexto)
  const userIntent = await analyzeUserIntent(question, conversationHistory);
  
  const keywords = extractKeywords(question);
  console.log('📌 Keywords extraídos:', keywords);
  
  // 🧠 INTELIGENCIA TEMPORAL: Analizar contexto de fecha
  const timeContext = userIntent?.timePeriod 
    ? { ...analyzeTimeContext(question), period: userIntent.timePeriod }
    : analyzeTimeContext(question);
  console.log('📅 Contexto temporal detectado:', timeContext);
  
  const context = {
    companies: [],
    salas: [],
    payments: [],
    commitments: [],
    liquidaciones: [],
    timeContext, // Incluir contexto temporal
    userIntent, // 🎯 Incluir intención detectada por Gemini
    metadata: {
      userRole: userProfile?.role || 'user',
      searchKeywords: keywords,
      timestamp: new Date().toISOString(),
      currentDate: format(new Date(), 'dd/MM/yyyy', { locale: es }),
      currentMonth: format(new Date(), 'MMMM yyyy', { locale: es }),
      currentYear: new Date().getFullYear(),
      intentDetected: userIntent?.intent || 'No detectada'
    }
  };
  
  try {
    const questionLower = question.toLowerCase();
    
    // 1. Buscar empresas mencionadas (usa intención de Gemini si está disponible)
    const shouldSearchCompanies = userIntent?.needsCompanies || keywords.length > 0;
    const companyKeywords = userIntent?.companyNames?.length > 0 
      ? userIntent.companyNames.map(n => normalizeText(n))
      : keywords;
    
    if (shouldSearchCompanies) {
      context.companies = await searchCompanies(companyKeywords);
      console.log(`✅ Empresas encontradas: ${context.companies.length}`);
    }
    
    // 2. Buscar salas mencionadas (usa intención de Gemini si está disponible)
    const shouldSearchSalas = userIntent?.needsSalas || keywords.length > 0;
    if (shouldSearchSalas && keywords.length > 0) {
      context.salas = await searchSalas(keywords);
      console.log(`✅ Salas encontradas: ${context.salas.length}`);
    }
    
    // 3. Obtener IDs de empresas para búsquedas relacionadas
    const companyIds = [
      ...context.companies.map(c => c.id),
      ...context.salas.map(s => s.companyId).filter(Boolean)
    ];
    
    // 4. Cargar pagos (usa intención de Gemini para decisión más inteligente)
    const isAboutPayments = userIntent?.needsPayments || 
      questionLower.includes('pago') || 
      questionLower.includes('cuanto') ||
      questionLower.includes('cuánto') ||
      questionLower.includes('se pago') ||
      questionLower.includes('se pagó') ||
      questionLower.includes('pagado') ||
      questionLower.includes('mes') ||
      questionLower.includes('año');
    
    if (companyIds.length > 0 || isAboutPayments) {
      // Si hay contexto temporal, traer MÁS pagos para filtrar después
      const limit = timeContext.period ? 50 : 10;
      let payments = await searchPayments(companyIds, keywords, limit);
      
      // 🧠 FILTRADO INTELIGENTE POR FECHA
      if (timeContext.period && payments.length > 0) {
        const paymentsBeforeFilter = payments.length;
        payments = filterPaymentsByDateRange(payments, timeContext.startDate, timeContext.endDate);
        console.log(`📅 Pagos filtrados por ${timeContext.description}: ${paymentsBeforeFilter} → ${payments.length}`);
        
        // Calcular estadísticas automáticamente
        const stats = calculatePaymentStats(payments);
        context.paymentStats = {
          total: stats.total,
          count: stats.count,
          average: stats.average,
          period: timeContext.description
        };
        console.log(`💰 Total pagado en ${timeContext.description}: $${stats.total.toLocaleString('es-CO')}`);
      }
      
      context.payments = payments;
      console.log(`✅ Pagos encontrados: ${payments.length}`);
    }
    
    // 5. Cargar compromisos (usa intención de Gemini para decisión más inteligente)
    const isAboutCommitments = userIntent?.needsCommitments ||
      questionLower.includes('compromiso') ||
      questionLower.includes('debe') ||
      questionLower.includes('pendiente') ||
      questionLower.includes('vencido') ||
      questionLower.includes('poliza') ||
      questionLower.includes('póliza');
    
    let status = null;
    if (questionLower.includes('pendiente') || questionLower.includes('debe')) {
      status = 'pending';
    } else if (questionLower.includes('vencido') || questionLower.includes('atrasado')) {
      status = 'overdue';
    } else if (questionLower.includes('pagado') || questionLower.includes('completado')) {
      status = 'paid';
    }
    
    if (companyIds.length > 0 || isAboutCommitments) {
      const limit = timeContext.period ? 50 : 10;
      let commitments = await searchCommitments(companyIds, status, limit);
      
      // 🧠 FILTRADO INTELIGENTE POR FECHA DE VENCIMIENTO
      if (timeContext.period && commitments.length > 0) {
        const commitmentsBeforeFilter = commitments.length;
        commitments = filterCommitmentsByDateRange(commitments, timeContext.startDate, timeContext.endDate);
        console.log(`📅 Compromisos filtrados por ${timeContext.description}: ${commitmentsBeforeFilter} → ${commitments.length}`);
      }
      
      context.commitments = commitments;
      console.log(`✅ Compromisos encontrados: ${commitments.length}`);
    }
    
    // 6. Buscar liquidaciones (usa intención de Gemini)
    const isAboutLiquidaciones = userIntent?.needsLiquidaciones ||
      questionLower.includes('liquidacion') ||
      questionLower.includes('sala');
    
    if (companyIds.length > 0 || isAboutLiquidaciones) {
      context.liquidaciones = await searchLiquidaciones(companyIds, 5);
      console.log(`✅ Liquidaciones encontradas: ${context.liquidaciones.length}`);
    }
    
    return context;
    
  } catch (error) {
    console.error('❌ Error obteniendo contexto de Firebase:', error);
    return context;
  }
};

/**
 * 📝 Construir prompt estructurado para Gemini
 */
const buildPrompt = (question, context, userProfile) => {
  // Formatear datos para el contexto
  const formatContext = () => {
    let contextStr = '';
    
    // 📅 CONTEXTO TEMPORAL Y ESTADÍSTICAS
    if (context.timeContext?.period) {
      contextStr += '\n⏰ CONTEXTO TEMPORAL DETECTADO:\n';
      contextStr += `📅 Periodo: ${context.timeContext.description}\n`;
      contextStr += `📆 Desde: ${format(context.timeContext.startDate, 'dd/MM/yyyy', { locale: es })}\n`;
      contextStr += `📆 Hasta: ${format(context.timeContext.endDate, 'dd/MM/yyyy', { locale: es })}\n`;
      
      if (context.paymentStats) {
        contextStr += `\n💰 RESUMEN DE PAGOS EN ${context.timeContext.description.toUpperCase()}:\n`;
        contextStr += `• Total pagado: $${context.paymentStats.total.toLocaleString('es-CO')}\n`;
        contextStr += `• Cantidad de pagos: ${context.paymentStats.count}\n`;
        contextStr += `• Promedio por pago: $${Math.round(context.paymentStats.average).toLocaleString('es-CO')}\n`;
        contextStr += '\n';
      }
    }
    
    // Empresas
    if (context.companies.length > 0) {
      contextStr += '\n🏢 EMPRESAS ENCONTRADAS:\n';
      context.companies.forEach(company => {
        contextStr += `- ${company.name}\n`;
        contextStr += `  NIT: ${company.nit || 'No registrado'}\n`;
        contextStr += `  Contacto: ${company.contacto || 'No registrado'}\n`;
        if (company.address) contextStr += `  Dirección: ${company.address}\n`;
        contextStr += '\n';
      });
    }
    
    // Salas
    if (context.salas.length > 0) {
      contextStr += '\n🎰 SALAS ENCONTRADAS:\n';
      context.salas.forEach(sala => {
        contextStr += `- ${sala.name}\n`;
        if (sala.company) contextStr += `  Empresa: ${sala.company.name}\n`;
        if (sala.address) contextStr += `  Ubicación: ${sala.address}\n`;
        contextStr += '\n';
      });
    }
    
    // Pagos
    if (context.payments.length > 0) {
      contextStr += '\n💰 PAGOS REGISTRADOS:\n';
      context.payments.forEach(payment => {
        contextStr += `- Empresa: ${payment.companyName || 'N/A'}\n`;
        contextStr += `  Beneficiario: ${payment.beneficiary || 'N/A'}\n`;
        contextStr += `  Monto: $${(payment.amount || payment.finalAmount || 0).toLocaleString('es-CO')}\n`;
        contextStr += `  Fecha: ${format(payment.date, 'dd/MM/yyyy', { locale: es })}\n`;
        contextStr += `  Concepto: ${payment.concept || 'N/A'}\n`;
        contextStr += '\n';
      });
    }
    
    // Compromisos
    if (context.commitments.length > 0) {
      contextStr += '\n📋 COMPROMISOS:\n';
      context.commitments.forEach(commitment => {
        contextStr += `- Empresa: ${commitment.companyName || 'N/A'}\n`;
        contextStr += `  Concepto: ${commitment.concept || 'N/A'}\n`;
        contextStr += `  Monto: $${(commitment.baseAmount || commitment.totalAmount || 0).toLocaleString('es-CO')}\n`;
        contextStr += `  Vencimiento: ${format(commitment.dueDate, 'dd/MM/yyyy', { locale: es })}\n`;
        contextStr += `  Estado: ${commitment.status === 'pending' ? 'Pendiente' : commitment.status === 'overdue' ? 'Vencido' : 'Pagado'}\n`;
        contextStr += '\n';
      });
    }
    
    // Liquidaciones
    if (context.liquidaciones.length > 0) {
      contextStr += '\n💵 LIQUIDACIONES:\n';
      context.liquidaciones.forEach(liq => {
        contextStr += `- Sala: ${liq.salaName || 'N/A'}\n`;
        contextStr += `  Fecha: ${format(liq.fecha, 'MM/yyyy', { locale: es })}\n`;
        contextStr += `  Total: $${(liq.total || 0).toLocaleString('es-CO')}\n`;
        contextStr += '\n';
      });
    }
    
    return contextStr || 'No se encontró información relevante en la base de datos.';
  };
  
  return `Eres un asistente virtual amigable y conversacional del DR Group Dashboard. Tu nombre es "Asistente IA" y hablas de forma natural, como un compañero de trabajo que conoce bien el negocio.

**TU PERSONALIDAD:**
- Hablas de forma casual y amigable, como en una conversación normal de WhatsApp
- Usas emojis para hacer la conversación más amena 😊
- Entiendes lenguaje coloquial: "cuánto se pagó", "qué onda con", "dame el dato de"
- **RECUERDAS el contexto de la conversación**: Si preguntan "¿Y él tiene más?" sabes de quién hablan
- Interpretas pronombres y referencias ("él", "ella", "esa empresa") basándote en mensajes anteriores
- Si algo no está claro, haces suposiciones inteligentes basadas en los datos
- Nunca digas "no encuentro información" si hay datos relacionados disponibles

**CONTEXTO DEL USUARIO:**
Hola ${userProfile?.name || 'amigo/a'} 👋, soy tu asistente del DR Group Dashboard.
Tu rol: ${userProfile?.role === 'admin' ? 'Administrador' : 'Usuario'}

**📅 FECHA Y HORA ACTUAL:**
🗓️ Hoy: ${context.metadata.currentDate}
📆 Mes actual: ${context.metadata.currentMonth}
📅 Año: ${context.metadata.currentYear}

${context.userIntent ? `**🎯 LO QUE ENTENDÍ:**
${context.userIntent.intent}
(Ya busqué los datos relevantes en Firebase)

` : ''}**INFORMACIÓN EN MI BASE DE DATOS:**
${formatContext()}

**EL USUARIO TE PREGUNTA:**
"${question}"

**CÓMO RESPONDER (IMPORTANTE):**

1. **LENGUAJE NATURAL**: Habla como persona, no como robot
   ❌ "He encontrado los siguientes datos en la base de datos..."
   ✅ "Claro! Aquí está lo que encontré..."

2. **SÉ SUPER INTELIGENTE CON FECHAS**: Ya analicé el contexto temporal automáticamente
   - Si pregunta "este mes" → Ya filtré los datos del mes actual
   - Si pregunta "este año" o "en lo que va del año" → Ya tengo los datos del año
   - Si hay estadísticas (RESUMEN DE PAGOS), ¡úsalas! Son cálculos automáticos
   - Responde con el TOTAL ya calculado, no necesitas contar manualmente

3. **INTERPRETA LENGUAJE CASUAL**:
   - "cuánto se pagó" = muestra el total calculado automáticamente
   - "qué onda con la póliza" → busca compromisos de pólizas
   - "último pago" → muestra los más recientes del sistema

4. **USA LOS DATOS DISPONIBLES**: Si hay información relacionada, úsala
   - Si pregunta "cuánto se pagó" y hay RESUMEN DE PAGOS, usa ese total directamente
   - Si menciona una empresa informalmente ("DiverGames"), busca coincidencias
   - Si hay estadísticas calculadas, menciónalas (total, cantidad, promedio)

5. **FORMATO VISUAL**: Usa emojis y estructura clara
   💰 Pagos  |  🏢 Empresas  |  📋 Compromisos  |  📅 Fechas

6. **SÉ BREVE Y DIRECTO**: Máximo 200 palabras, ve al punto

7. **CIFRAS COLOMBIANAS**: $1.500.000 (punto para miles)

8. **SI HAY RESUMEN CALCULADO**: Úsalo directamente, no hagas cálculos manuales
   ✅ "Este mes se han pagado $5.847.200 en total (3 pagos)"
   ❌ "Déjame sumar los pagos... Payment 1 + Payment 2..."

9. **SI NO HAY DATOS EXACTOS**: 
   - Muestra lo más relacionado que encuentres
   - Sé honesto pero útil: "No vi pagos este mes, pero estos son los más recientes..."

**EJEMPLOS DE TU ESTILO:**
- "Dale! El NIT de DiverGames es 901.001.152-4 😊"
- "Este mes se han pagado $5.847.200 en 3 transacciones 💰"
- "En lo que va del año 2025: $127.543.890 (45 pagos) 📊"
- "Perfecto! Para la póliza de Fantastic, el último pago fue $18.128.763 el 7 de agosto 👍"

**RESPONDE AHORA DE FORMA NATURAL Y CONVERSACIONAL:**`;
};

/**
 * 🔍 Obtener modelo disponible
 */
const getAvailableModel = async () => {
  if (cachedModel) {
    return cachedModel;
  }

  // Intentar cada modelo en orden
  for (const modelName of MODEL_FALLBACKS) {
    try {
      const testUrl = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "test" }] }]
        })
      });

      if (testResponse.ok || testResponse.status === 400) {
        // 400 significa que el modelo existe pero no le gustó el prompt (está ok)
        console.log(`✅ Modelo disponible: ${modelName}`);
        cachedModel = modelName;
        return modelName;
      }
    } catch (e) {
      console.log(`❌ Modelo ${modelName} no disponible`);
    }
  }

  throw new Error('No se encontró ningún modelo de Gemini disponible');
};

/**
 * 🔧 Definir herramientas/funciones que Gemini puede usar
 */
const getAvailableTools = () => {
  return [
    {
      name: "searchCompanies",
      description: "Busca empresas por nombre, NIT o cualquier palabra relacionada. Usa búsqueda flexible (fuzzy).",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Palabras clave para buscar empresas (ej: ['DiverGames'], ['Tiburon'], ['901.001'])"
          }
        },
        required: ["keywords"]
      }
    },
    {
      name: "searchPayments",
      description: "Busca pagos registrados. Puede filtrar por empresa, concepto, o periodo temporal.",
      parameters: {
        type: "object",
        properties: {
          companyIds: {
            type: "array",
            items: { type: "string" },
            description: "IDs de empresas para filtrar pagos (opcional)"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Palabras clave para buscar en conceptos de pago (opcional)"
          },
          startDate: {
            type: "string",
            description: "Fecha inicio en formato ISO (opcional, ej: '2025-01-01')"
          },
          endDate: {
            type: "string",
            description: "Fecha fin en formato ISO (opcional, ej: '2025-12-31')"
          },
          limit: {
            type: "number",
            description: "Cantidad máxima de resultados (default: 50)"
          }
        },
        required: []
      }
    },
    {
      name: "searchCommitments",
      description: "Busca compromisos financieros. Puede filtrar por empresa, estado, o periodo.",
      parameters: {
        type: "object",
        properties: {
          companyIds: {
            type: "array",
            items: { type: "string" },
            description: "IDs de empresas para filtrar (opcional)"
          },
          status: {
            type: "string",
            enum: ["pending", "paid", "overdue", "all"],
            description: "Estado del compromiso (opcional)"
          },
          limit: {
            type: "number",
            description: "Cantidad máxima de resultados (default: 50)"
          }
        },
        required: []
      }
    },
    {
      name: "searchSalas",
      description: "Busca salas/casinos por nombre o ubicación.",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Palabras clave para buscar salas"
          }
        },
        required: ["keywords"]
      }
    },
    {
      name: "getAllCompanies",
      description: "Obtiene TODAS las empresas registradas en el sistema (sin filtros).",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];
};

/**
 * 🧠 Analizar pregunta y determinar qué buscar
 */
const analyzeQuestion = (question) => {
  const q = normalizeText(question);
  
  const result = {
    type: 'general',
    needsSalas: false,
    needsPayments: false,
    searchTerm: null
  };
  
  // Detectar búsqueda por ubicación (ciudades)
  if (/salas en|salas hay en|casinos en|ubicadas en/i.test(question)) {
    result.type = 'searchByLocation';
    result.needsSalas = true;
    
    // Extraer ciudad
    const locationMatch = question.match(/(?:en|hay en)\s+([a-zñáéíóú]+)\??/i);
    if (locationMatch) {
      result.searchTerm = locationMatch[1].trim();
    }
  }
  // Detectar búsqueda de persona en salas
  else if (/tiene|salas de|salas que|casinos de|casinos que/i.test(question)) {
    result.type = 'searchPerson';
    result.needsSalas = true;
    
    // Extraer nombre (mejorado): captura DESPUÉS de "tiene" o al final
    // "Que salas tiene mauricio parra?" → captura "mauricio parra"
    const patterns = [
      /tiene\s+([a-zñáéíóú]+(?:\s+[a-zñáéíóú]+)+)\??$/i,  // "tiene NOMBRE?"
      /de\s+([a-zñáéíóú]+(?:\s+[a-zñáéíóú]+)+)/i,         // "de NOMBRE"
      /([a-zñáéíóú]+\s+[a-zñáéíóú]+)\??$/i                // "NOMBRE?" al final
    ];
    
    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        result.searchTerm = match[1].trim();
        break;
      }
    }
  }
  // Detectar cálculo de totales
  else if (/cuanto|total|suma|pagado|gastado/i.test(q)) {
    result.type = 'calculateTotal';
    result.needsPayments = true;
  }
  // Detectar listado completo
  else if (/cuantas|todas|todos|lista/i.test(q)) {
    result.type = 'listAll';
    result.needsSalas = q.includes('sala') || q.includes('casino');
  }
  
  console.log('🧠 Análisis:', result);
  return result;
};

/**
 * 🌍 Buscar salas por ubicación (ciudad)
 */
const searchSalasByLocation = async (location) => {
  console.log(`🌍 Buscando salas en: "${location}"`);
  
  const salasSnap = await getDocs(collection(db, 'salas'));
  const locationNormalized = normalizeText(location);
  
  const found = salasSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(sala => {
      const ciudad = sala.ciudad ? normalizeText(sala.ciudad) : '';
      const departamento = sala.departamento ? normalizeText(sala.departamento) : '';
      
      return ciudad.includes(locationNormalized) || departamento.includes(locationNormalized);
    });
  
  console.log(`✅ Encontradas ${found.length} salas en ${location}`);
  return found;
};

/**
 * 🔍 Buscar salas por persona (mejorado con búsqueda flexible)
 */
const searchSalasByPerson = async (searchTerm) => {
  console.log(`🔍 Buscando salas de: "${searchTerm}"`);
  
  const salasSnap = await getDocs(collection(db, 'salas'));
  const searchWords = normalizeText(searchTerm).split(/\s+/);
  
  console.log(`🔍 Palabras de búsqueda:`, searchWords);
  console.log(`� Total de salas en Firebase:`, salasSnap.docs.length);
  
  // Debug: Mostrar primera sala
  if (salasSnap.docs.length > 0) {
    const firstSala = salasSnap.docs[0].data();
    console.log(`🎰 Ejemplo de sala:`, {
      name: firstSala.name,
      propietario: firstSala.propietario,
      contactoAutorizado: firstSala.contactoAutorizado,
      contactoAutorizado2: firstSala.contactoAutorizado2
    });
  }
  
  const found = salasSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(sala => {
      const fields = [
        sala.propietario,
        sala.contactoAutorizado,
        sala.contactoAutorizado2,
        sala.nombreRepLegal
      ].filter(Boolean);
      
      console.log(`🔎 Sala "${sala.name}":`, fields);
      
      const fieldsNormalized = fields.map(f => normalizeText(f));
      
      // Buscar que TODAS las palabras estén presentes en algún campo
      const matches = fields.some(field => 
        searchWords.every(word => normalizeText(field).includes(word))
      );
      
      if (matches) {
        console.log(`✅ MATCH encontrado en sala: ${sala.name}`);
      }
      
      return matches;
    });
  
  console.log(`✅ Encontradas ${found.length} salas`);
  if (found.length > 0) {
    console.log(`📋 Salas encontradas:`, found.map(s => s.name));
  }
  return found;
};

/**
 * 📊 Obtener datos relevantes según análisis
 */
const getRelevantData = async (analysis) => {
  console.log('📂 Cargando datos relevantes...');
  
  const data = { companies: [], salas: [], payments: [] };
  
  try {
    // Siempre cargar empresas (pocas)
    const companiesSnap = await getDocs(collection(db, 'companies'));
    data.companies = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Búsqueda por ubicación
    if (analysis.type === 'searchByLocation' && analysis.searchTerm) {
      data.salas = await searchSalasByLocation(analysis.searchTerm);
    }
    // Búsqueda específica de persona
    else if (analysis.type === 'searchPerson' && analysis.searchTerm) {
      data.salas = await searchSalasByPerson(analysis.searchTerm);
    }
    // Cargar todas las salas si necesario
    else if (analysis.needsSalas) {
      const salasSnap = await getDocs(collection(db, 'salas'));
      data.salas = salasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // Cargar pagos si se necesitan
    if (analysis.needsPayments) {
      const paymentsSnap = await getDocs(
        query(collection(db, 'payments'), orderBy('date', 'desc'), limit(50))
      );
      data.payments = paymentsSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          date: d.date?.toDate ? d.date.toDate() : new Date(d.date),
          amount: d.amount || d.finalAmount || 0
        };
      });
    }
    
    console.log('✅ Datos:', {
      empresas: data.companies.length,
      salas: data.salas.length,
      pagos: data.payments.length
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return data;
  }
};

/**
 * 🤖 Hacer pregunta al asistente con contexto de Firebase
 */
export const askAssistant = async (question, userProfile, conversationHistory = []) => {
  console.log('🤖 Procesando pregunta:', question);
  
  try {
    // 1. Validar entrada
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        answer: 'Por favor escribe una pregunta.',
        context: null
      };
    }

    // 2. Validar API Key
    if (!API_KEY) {
      return {
        success: false,
        answer: '⚠️ API Key de Gemini no configurada. Por favor contacta al administrador.',
        context: null
      };
    }
    
    // 3. Obtener modelo disponible
    const modelName = await getAvailableModel();
    console.log(`📦 Modelo: ${modelName}`);
    
    // 4. NUEVO: Analizar pregunta primero
    const analysis = analyzeQuestion(question);
    
    // 5. NUEVO: Cargar SOLO datos relevantes
    const relevantData = await getRelevantData(analysis);
    
    // 6. Construir historial
    const recentHistory = conversationHistory.slice(-4).map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n');
    
    const now = new Date();
    
    // 7. Construir contexto compacto con datos relevantes
    let contextData = '';
    
    // Salas (si hay)
    if (relevantData.salas && relevantData.salas.length > 0) {
      contextData += `\n🎰 **SALAS ENCONTRADAS (${relevantData.salas.length})**:\n`;
      relevantData.salas.forEach((s, idx) => {
        const personas = [
          s.propietario ? `Propietario:${s.propietario}` : null,
          s.contactoAutorizado ? `Contacto1:${s.contactoAutorizado}` : null,
          s.contactoAutorizado2 ? `Contacto2:${s.contactoAutorizado2}` : null
        ].filter(Boolean).join(' | ');
        
        contextData += `${idx + 1}. **${s.name}**\n   Empresa: ${s.companyName || 'N/A'}\n   Personas: ${personas}\n   Ciudad: ${s.ciudad || 'N/A'}\n\n`;
      });
    }
    
    // Pagos (si hay)
    if (relevantData.payments && relevantData.payments.length > 0) {
      contextData += `\n💰 **PAGOS RECIENTES (${relevantData.payments.length})**:\n`;
      relevantData.payments.slice(0, 10).forEach(p => {
        contextData += `- ${format(p.date, 'dd/MM/yyyy')}: $${p.amount.toLocaleString('es-CO')} - ${p.concept || 'N/A'}\n`;
      });
    }
    
    // Empresas
    if (relevantData.companies && relevantData.companies.length > 0) {
      contextData += `\n🏢 **EMPRESAS (${relevantData.companies.length})**:\n`;
      relevantData.companies.forEach(c => {
        contextData += `- ${c.name} | NIT: ${c.nit || 'N/A'}\n`;
      });
    }
    
    console.log('📊 Contexto preparado:', contextData.length, 'caracteres');
    
    // 8. Construir prompt compacto y enfocado
    const completePrompt = `Eres el asistente inteligente de DR Group Dashboard.

**📅 HOY**: ${format(now, 'dd/MM/yyyy', { locale: es })} - ${format(now, 'MMMM yyyy', { locale: es })}

${recentHistory ? `**💬 CONVERSACIÓN RECIENTE**:\n${recentHistory}\n\n` : ''}**👤 USUARIO (${userProfile?.name || 'Usuario'})**: "${question}"

**📂 INFORMACIÓN RELEVANTE ENCONTRADA**:${contextData}

---

**INSTRUCCIONES**:
- Responde usando la información de arriba
- Formato colombiano ($1.500.000)
- Conversacional (máximo 200 palabras)
- Usa emojis apropiados 😊
- Si no encuentras, dilo claramente

**RESPONDE**:`;
    
    console.log('📤 Enviando TODO el contexto a Gemini...');
    console.log('📏 Tamaño del prompt:', completePrompt.length, 'caracteres');
    
    // 7. Llamar a Gemini API con contexto completo (SIN FUNCTION CALLING)
    const apiUrl = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: completePrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de API:', errorData);
      cachedModel = null;
      throw new Error(errorData.error?.message || 'Error en la API de Gemini');
    }

    const data = await response.json();
    console.log('✅ Respuesta recibida de Gemini');
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
    // 8. Extraer respuesta directa
    const candidate = data.candidates?.[0];
    const answer = candidate?.content?.parts?.[0]?.text;
    
    // Verificar si Gemini bloqueó la respuesta
    if (!answer) {
      console.warn('⚠️ Gemini no generó texto. Candidato:', candidate);
      const blockReason = candidate?.finishReason || 'UNKNOWN';
      const safetyRatings = candidate?.safetyRatings || [];
      
      console.log('🛡️ Finish reason:', blockReason);
      console.log('🛡️ Safety ratings:', safetyRatings);
      
      // Si fue bloqueado por seguridad, devolver mensaje apropiado
      if (blockReason === 'SAFETY') {
        return {
          success: false,
          answer: '⚠️ La respuesta fue bloqueada por filtros de seguridad de Gemini. Intenta reformular la pregunta.',
          sources: [],
          timestamp: new Date().toISOString()
        };
      }
      
      // Si no hay contenido pero no hay error explícito
      return {
        success: false,
        answer: 'No se pudo generar una respuesta. Es posible que no haya información disponible para tu consulta.',
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
    
    // 9. Retornar respuesta con fuentes relevantes
    return {
      success: true,
      answer,
      sources: [
        { type: 'companies', count: relevantData.companies?.length || 0 },
        { type: 'salas', count: relevantData.salas?.length || 0 },
        { type: 'payments', count: relevantData.payments?.length || 0 }
      ],
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en askAssistant:', error);
    
    // Mensajes de error específicos
    let errorMessage = 'Lo siento, ocurrió un error procesando tu pregunta.';
    
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      errorMessage = '⚠️ Error: API key no válida. Verifica la configuración en Google AI Studio.';
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = '⚠️ Límite de uso alcanzado. Por favor intenta más tarde.';
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorMessage = '⚠️ Error de conexión. Verifica tu internet e intenta de nuevo.';
    } else if (error.message?.includes('No se encontró ningún modelo')) {
      errorMessage = '⚠️ No hay modelos de Gemini disponibles para tu API key. Verifica los permisos en Google AI Studio.';
    } else {
      errorMessage = `⚠️ Error: ${error.message}`;
    }
    
    return {
      success: false,
      answer: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 💡 Generar sugerencias inteligentes
 */
export const getSuggestions = () => {
  return [
    "¿Cuál es el NIT de DiverGames?",
    "¿Cuál fue el último pago de la póliza?",
    "¿Qué compromisos están pendientes?",
    "¿En qué empresa está Festival Casino?",
    "Dame un resumen de GoodLuck Casinos",
    "¿Cuánto debemos este mes?",
    "Pagos realizados en octubre",
    "Compromisos próximos a vencer"
  ];
};
