import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  startAfter,
  and
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Servicio para consultas inteligentes de IA sobre datos empresariales
 */
class AIDataService {
  
  /**
   * Obtiene información completa de una empresa por nombre o NIT
   */
  async getCompanyInfo(searchTerm, userId) {
    try {
      console.log('🔍 Buscando empresa:', searchTerm, 'para usuario:', userId);
      
      const companiesRef = collection(db, 'companies');
      const q = query(
        companiesRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const companies = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('📄 Empresa encontrada:', data);
        companies.push({ id: doc.id, ...data });
      });

      console.log(`📊 Total empresas encontradas: ${companies.length}`);

      if (companies.length === 0) {
        return {
          found: false,
          message: 'No se encontraron empresas registradas en tu cuenta.',
          suggestions: [],
          totalCompanies: 0
        };
      }

      // Buscar por nombre o NIT (búsqueda más flexible)
      const searchLower = searchTerm.toLowerCase();
      const matchingCompany = companies.find(company => {
        const nameMatch = company.name?.toLowerCase().includes(searchLower);
        const nitMatch = company.nit?.toLowerCase().includes(searchLower);
        const businessNameMatch = company.businessName?.toLowerCase().includes(searchLower);
        const aliasMatch = company.alias?.toLowerCase().includes(searchLower);
        
        console.log(`🔍 Comparando "${searchLower}" con:`, {
          name: company.name?.toLowerCase(),
          nit: company.nit?.toLowerCase(),
          businessName: company.businessName?.toLowerCase(),
          alias: company.alias?.toLowerCase()
        });
        
        return nameMatch || nitMatch || businessNameMatch || aliasMatch;
      });

      if (matchingCompany) {
        console.log('✅ Empresa encontrada:', matchingCompany);
        return {
          found: true,
          company: matchingCompany,
          totalCompanies: companies.length
        };
      }

      // Si no encontró coincidencia exacta, mostrar empresas disponibles
      return {
        found: false,
        message: `No se encontró una empresa que coincida con "${searchTerm}".`,
        suggestions: companies.map(c => ({
          name: c.name || c.businessName || 'Sin nombre',
          nit: c.nit || 'Sin NIT'
        })),
        totalCompanies: companies.length,
        availableCompanies: companies.slice(0, 5) // Mostrar primeras 5 para referencia
      };
    } catch (error) {
      console.error('❌ Error al consultar empresa:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de pagos específico por empresa y concepto
   */
  async getPaymentHistory(companyName, concept, userId, months = 3) {
    try {
      const paymentsRef = collection(db, 'payments');
      const commitmentsRef = collection(db, 'commitments');
      
      // Fecha límite para la consulta
      const endDate = new Date();
      const startDate = subMonths(endDate, months);

      // Obtener pagos
      const paymentsQuery = query(
        paymentsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);
      const payments = [];
      
      paymentsSnapshot.forEach(doc => {
        const data = doc.data();
        payments.push({ 
          id: doc.id, 
          ...data,
          date: data.createdAt?.toDate() || data.paymentDate?.toDate() || new Date()
        });
      });

      // Filtrar por empresa y concepto
      const searchCompany = companyName.toLowerCase();
      const searchConcept = concept?.toLowerCase();
      
      const filteredPayments = payments.filter(payment => {
        const companyMatch = payment.companyName?.toLowerCase().includes(searchCompany);
        const conceptMatch = !searchConcept || 
          payment.concept?.toLowerCase().includes(searchConcept) ||
          payment.description?.toLowerCase().includes(searchConcept);
        
        return companyMatch && conceptMatch;
      });

      // Calcular estadísticas
      const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const averageAmount = filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;

      // Agrupar por mes
      const monthlyData = {};
      filteredPayments.forEach(payment => {
        const monthKey = format(payment.date, 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { amount: 0, count: 0, payments: [] };
        }
        monthlyData[monthKey].amount += payment.amount || 0;
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].payments.push(payment);
      });

      return {
        found: filteredPayments.length > 0,
        payments: filteredPayments,
        summary: {
          totalAmount,
          averageAmount,
          paymentCount: filteredPayments.length,
          period: `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`
        },
        monthlyBreakdown: monthlyData
      };
    } catch (error) {
      console.error('Error al consultar historial de pagos:', error);
      throw error;
    }
  }

  /**
   * Obtiene análisis de compromisos por empresa
   */
  async getCommitmentsAnalysis(companyName, userId) {
    try {
      const commitmentsRef = collection(db, 'commitments');
      const q = query(
        commitmentsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const commitments = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        commitments.push({ 
          id: doc.id, 
          ...data,
          dueDate: data.dueDate?.toDate() || new Date()
        });
      });

      // Filtrar por empresa si se especifica
      let filteredCommitments = commitments;
      if (companyName) {
        const searchCompany = companyName.toLowerCase();
        filteredCommitments = commitments.filter(commitment =>
          commitment.companyName?.toLowerCase().includes(searchCompany)
        );
      }

      const now = new Date();
      
      // Categorizar compromisos
      const active = filteredCommitments.filter(c => !this.isCommitmentPaid(c));
      const paid = filteredCommitments.filter(c => this.isCommitmentPaid(c));
      const overdue = active.filter(c => c.dueDate < now);
      const upcoming = active.filter(c => {
        const daysDiff = (c.dueDate - now) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 7;
      });

      // Calcular totales
      const totalAmount = filteredCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const pendingAmount = active.reduce((sum, c) => sum + (c.amount || 0), 0);
      const paidAmount = paid.reduce((sum, c) => sum + (c.amount || 0), 0);

      return {
        found: filteredCommitments.length > 0,
        companyName,
        summary: {
          total: filteredCommitments.length,
          active: active.length,
          paid: paid.length,
          overdue: overdue.length,
          upcoming: upcoming.length,
          totalAmount,
          pendingAmount,
          paidAmount
        },
        commitments: {
          all: filteredCommitments.slice(0, 10), // Limitar respuesta
          overdue: overdue.slice(0, 5),
          upcoming: upcoming.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Error al analizar compromisos:', error);
      throw error;
    }
  }

  /**
   * Verifica si un compromiso está pagado
   */
  isCommitmentPaid(commitment) {
    return commitment.status === 'completed' || 
           commitment.status === 'paid' || 
           commitment.status === 'Pagado' ||
           commitment.status === 'pagado' ||
           commitment.status === 'PAGADO' ||
           commitment.paid === true ||
           commitment.isPaid === true ||
           commitment.paymentStatus === 'paid' ||
           commitment.paymentStatus === 'Pagado' ||
           commitment.paymentStatus === 'pagado' ||
           commitment.completed === true;
  }

  /**
   * Obtiene estadísticas generales para contexto IA
   */
  async getGeneralStats(userId) {
    try {
      const [companiesSnapshot, commitmentsSnapshot, paymentsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'companies'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'commitments'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'payments'), where('userId', '==', userId), limit(100)))
      ]);

      const companies = [];
      companiesSnapshot.forEach(doc => companies.push({ id: doc.id, ...doc.data() }));

      const commitments = [];
      commitmentsSnapshot.forEach(doc => {
        const data = doc.data();
        commitments.push({ 
          id: doc.id, 
          ...data,
          dueDate: data.dueDate?.toDate() || new Date()
        });
      });

      const payments = [];
      paymentsSnapshot.forEach(doc => {
        const data = doc.data();
        payments.push({ 
          id: doc.id, 
          ...data,
          date: data.createdAt?.toDate() || new Date()
        });
      });

      // Calcular estadísticas
      const now = new Date();
      const activeCommitments = commitments.filter(c => !this.isCommitmentPaid(c));
      const overdueCommitments = activeCommitments.filter(c => c.dueDate < now);
      const totalPendingAmount = activeCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalPaidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        companies: {
          total: companies.length,
          active: companies.filter(c => c.status === 'active').length
        },
        commitments: {
          total: commitments.length,
          active: activeCommitments.length,
          overdue: overdueCommitments.length,
          totalAmount: commitments.reduce((sum, c) => sum + (c.amount || 0), 0),
          pendingAmount: totalPendingAmount
        },
        payments: {
          total: payments.length,
          totalAmount: totalPaidAmount,
          thisMonth: payments.filter(p => {
            const paymentMonth = format(p.date, 'yyyy-MM');
            const currentMonth = format(now, 'yyyy-MM');
            return paymentMonth === currentMonth;
          }).length
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      throw error;
    }
  }

  /**
   * Procesa consulta de IA y determina qué datos obtener
   */
  async processAIQuery(query, userId) {
    const queryLower = query.toLowerCase();
    console.log('🤖 Procesando consulta:', queryLower);
    
    try {
      // Detectar consulta sobre empresas
      if (queryLower.includes('nit') || (queryLower.includes('empresa') && !queryLower.includes('pag'))) {
        console.log('📋 Detectada consulta de empresa');
        
        // Extraer nombres de empresas comunes
        const possibleCompanies = ['divergames', 'montecarlo', 'coljuegos', 'casino', 'juegos'];
        let matchedCompany = possibleCompanies.find(name => queryLower.includes(name));
        
        // Si no encuentra una empresa específica, buscar cualquier palabra que parezca nombre de empresa
        if (!matchedCompany) {
          // Buscar palabras que puedan ser nombres de empresas (capitalizadas o con patrones específicos)
          const words = query.split(/\s+/);
          for (let word of words) {
            if (word.length > 3 && (word[0] === word[0].toUpperCase() || word.toLowerCase().endsWith('games') || word.toLowerCase().includes('s.a'))) {
              matchedCompany = word.toLowerCase();
              break;
            }
          }
        }
        
        console.log('🏢 Empresa detectada:', matchedCompany);
        return await this.getCompanyInfo(matchedCompany || '', userId);
      }

      // Detectar consulta sobre pagos
      if ((queryLower.includes('pag') || queryLower.includes('cuanto')) && (queryLower.includes('mes') || queryLower.includes('historial'))) {
        console.log('💰 Detectada consulta de pagos');
        
        // Extraer empresa y concepto
        const companyNames = ['montecarlo', 'divergames', 'casino'];
        const concepts = ['coljuegos', 'licencia', 'impuesto', 'operacion', 'operación'];
        
        const matchedCompany = companyNames.find(name => queryLower.includes(name));
        const matchedConcept = concepts.find(concept => queryLower.includes(concept));
        
        console.log('💰 Parámetros:', { company: matchedCompany, concept: matchedConcept });
        return await this.getPaymentHistory(matchedCompany || '', matchedConcept || '', userId);
      }

      // Detectar consulta sobre compromisos
      if (queryLower.includes('compromiso') || queryLower.includes('deuda') || queryLower.includes('venc') || queryLower.includes('debe')) {
        console.log('📋 Detectada consulta de compromisos');
        
        const companyNames = ['montecarlo', 'divergames'];
        const matchedCompany = companyNames.find(name => queryLower.includes(name));
        
        console.log('📋 Empresa para compromisos:', matchedCompany);
        return await this.getCommitmentsAnalysis(matchedCompany || '', userId);
      }

      // Si pregunta por resumen o estadísticas generales
      if (queryLower.includes('resumen') || queryLower.includes('estado') || queryLower.includes('general') || queryLower.includes('todo')) {
        console.log('📊 Detectada consulta general');
        return await this.getGeneralStats(userId);
      }

      // Consulta no reconocida - devolver ayuda
      console.log('❓ Consulta no reconocida, devolviendo ayuda');
      return {
        help: true,
        message: `No pude identificar exactamente qué información necesitas.\n\n**Ejemplos de preguntas que puedo responder:**\n\n🏢 **Sobre empresas:**\n• "¿Cuál es el NIT de DiverGames?"\n• "Información de Montecarlo"\n• "Empresas registradas"\n\n💰 **Sobre pagos:**\n• "¿Cuánto pagué a Coljuegos el mes pasado?"\n• "Pagos de Montecarlo en agosto"\n• "Historial de pagos a licencias"\n\n📋 **Sobre compromisos:**\n• "Compromisos de DiverGames"\n• "¿Cuántos compromisos vencidos tengo?"\n• "Estado de mis obligaciones"\n\n📊 **Resúmenes:**\n• "Resumen general"\n• "Estado de mi dashboard"\n• "Estadísticas generales"`
      };
    } catch (error) {
      console.error('❌ Error procesando consulta IA:', error);
      throw error;
    }
  }
}

export default new AIDataService();
