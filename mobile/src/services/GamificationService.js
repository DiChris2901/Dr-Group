/**
 * Sistema de Gamificación para DR Group
 * Badges, logros y estadísticas motivacionales
 */

export const ACHIEVEMENTS = {
  // 🎯 Puntualidad
  EARLY_BIRD: {
    id: 'early_bird',
    name: '🌅 Madrugador',
    description: 'Llega temprano 5 días consecutivos',
    icon: 'weather-sunny',
    color: '#FF9800',
    criteria: { type: 'punctuality', consecutive: 5 }
  },
  PERFECT_WEEK: {
    id: 'perfect_week',
    name: '✨ Semana Perfecta',
    description: 'Puntualidad 100% durante una semana',
    icon: 'star-circle',
    color: '#FFD700',
    criteria: { type: 'perfect_week', threshold: 7 }
  },
  NEVER_LATE: {
    id: 'never_late',
    name: '⏰ Siempre Puntual',
    description: 'Sin retrasos durante un mes completo',
    icon: 'clock-check',
    color: '#4CAF50',
    criteria: { type: 'no_delays', days: 30 }
  },

  // 📅 Asistencia
  PERFECT_ATTENDANCE: {
    id: 'perfect_attendance',
    name: '💯 Asistencia Perfecta',
    description: 'Sin ausencias durante el mes',
    icon: 'calendar-check',
    color: '#2196F3',
    criteria: { type: 'full_attendance', days: 30 }
  },
  CONSISTENT_WORKER: {
    id: 'consistent_worker',
    name: '🎯 Trabajador Constante',
    description: '20 días trabajados en un mes',
    icon: 'briefcase-check',
    color: '#9C27B0',
    criteria: { type: 'days_worked', threshold: 20 }
  },

  // 💪 Productividad
  OVERTIME_HERO: {
    id: 'overtime_hero',
    name: '🦸 Héroe del Tiempo Extra',
    description: 'Trabaja más de 9 horas en un día',
    icon: 'clock-fast',
    color: '#FF5722',
    criteria: { type: 'overtime', hours: 9 }
  },
  WORK_MACHINE: {
    id: 'work_machine',
    name: '🔥 Máquina de Trabajo',
    description: 'Supera las 180 horas en un mes',
    icon: 'fire',
    color: '#E91E63',
    criteria: { type: 'monthly_hours', threshold: 180 }
  },

  // 🍽️ Hábitos Saludables
  LUNCH_LOVER: {
    id: 'lunch_lover',
    name: '🍽️ Amante del Almuerzo',
    description: 'Registra almuerzo todos los días del mes',
    icon: 'food',
    color: '#FF6F00',
    criteria: { type: 'lunch_streak', days: 30 }
  },
  BREAK_MASTER: {
    id: 'break_master',
    name: '☕ Maestro del Descanso',
    description: 'Toma breaks saludables durante el mes',
    icon: 'coffee',
    color: '#795548',
    criteria: { type: 'healthy_breaks', days: 20 }
  },

  // 🌟 Especiales
  FIRST_DAY: {
    id: 'first_day',
    name: '🎉 Primer Día',
    description: 'Completa tu primera jornada',
    icon: 'party-popper',
    color: '#00BCD4',
    criteria: { type: 'first_session', count: 1 }
  },
  CENTURY_CLUB: {
    id: 'century_club',
    name: '💎 Club del Centenar',
    description: 'Completa 100 jornadas laborales',
    icon: 'diamond',
    color: '#3F51B5',
    criteria: { type: 'total_sessions', threshold: 100 }
  },
  YEAR_VETERAN: {
    id: 'year_veteran',
    name: '👑 Veterano del Año',
    description: 'Un año completo trabajando',
    icon: 'crown',
    color: '#FFD700',
    criteria: { type: 'days_worked', threshold: 365 }
  }
};

/**
 * Calcula estadísticas de usuario para gamificación
 * @param {Array} asistencias - Lista de registros de asistencia
 * @returns {Object} Estadísticas calculadas
 */
export const calculateUserStats = (asistencias) => {
  if (!asistencias || asistencias.length === 0) {
    return {
      totalDays: 0,
      totalHours: 0,
      punctualityRate: 0,
      averageHoursPerDay: 0,
      longestStreak: 0,
      currentStreak: 0,
      totalBreaks: 0,
      totalLunches: 0,
      lateArrivals: 0,
      perfectDays: 0
    };
  }

  let totalMinutes = 0;
  let totalBreaks = 0;
  let totalLunches = 0;
  let lateArrivals = 0;
  let perfectDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  // Ordenar por fecha
  const sortedAsistencias = [...asistencias].sort((a, b) => {
    return new Date(a.fecha) - new Date(b.fecha);
  });

  sortedAsistencias.forEach((asist, index) => {
    // Calcular horas trabajadas
    if (asist.horasTrabajadas) {
      const [h, m, s] = asist.horasTrabajadas.split(':').map(Number);
      totalMinutes += (h * 60) + m + (s / 60);
    }

    // Contar breaks y almuerzos
    totalBreaks += asist.breaks?.length || 0;
    if (asist.almuerzo) totalLunches++;

    // Verificar puntualidad (llegada antes de las 8:15 AM)
    if (asist.entrada?.hora) {
      const entradaHora = asist.entrada.hora.toDate ? asist.entrada.hora.toDate() : new Date(asist.entrada.hora);
      const entradaMinutos = entradaHora.getHours() * 60 + entradaHora.getMinutes();
      const puntualidad = entradaMinutos <= (8 * 60 + 15); // 8:15 AM

      if (!puntualidad) {
        lateArrivals++;
      }

      // Día perfecto: puntual + almuerzo + salida completa
      if (puntualidad && asist.almuerzo && asist.salida) {
        perfectDays++;
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
  });

  const totalHours = Math.round(totalMinutes / 60);
  const averageHoursPerDay = asistencias.length > 0 ? Math.round(totalMinutes / asistencias.length / 60) : 0;
  const punctualityRate = asistencias.length > 0 ? Math.round(((asistencias.length - lateArrivals) / asistencias.length) * 100) : 0;

  return {
    totalDays: asistencias.length,
    totalHours,
    punctualityRate,
    averageHoursPerDay,
    longestStreak,
    currentStreak,
    totalBreaks,
    totalLunches,
    lateArrivals,
    perfectDays
  };
};

/**
 * Evalúa qué badges ha ganado el usuario
 * @param {Array} asistencias - Lista de registros
 * @returns {Array} Lista de badges obtenidos
 */
export const evaluateAchievements = (asistencias) => {
  const stats = calculateUserStats(asistencias);
  const earnedBadges = [];

  // Evaluar cada achievement
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    let earned = false;

    switch (achievement.criteria.type) {
      case 'first_session':
        earned = stats.totalDays >= 1;
        break;
      case 'days_worked':
        earned = stats.totalDays >= achievement.criteria.threshold;
        break;
      case 'monthly_hours':
        earned = stats.totalHours >= achievement.criteria.threshold;
        break;
      case 'punctuality':
        earned = stats.longestStreak >= achievement.criteria.consecutive;
        break;
      case 'perfect_week':
        earned = stats.longestStreak >= 7;
        break;
      case 'no_delays':
        earned = stats.lateArrivals === 0 && stats.totalDays >= achievement.criteria.days;
        break;
      case 'lunch_streak':
        earned = stats.totalLunches >= achievement.criteria.days;
        break;
      case 'healthy_breaks':
        earned = stats.totalBreaks >= achievement.criteria.days;
        break;
      case 'total_sessions':
        earned = stats.totalDays >= achievement.criteria.threshold;
        break;
      default:
        earned = false;
    }

    if (earned) {
      earnedBadges.push(achievement);
    }
  });

  return earnedBadges;
};

/**
 * Obtiene el próximo logro más cercano
 * @param {Array} asistencias - Lista de registros
 * @returns {Object} Próximo logro y progreso
 */
export const getNextAchievement = (asistencias) => {
  const stats = calculateUserStats(asistencias);
  const earnedBadges = evaluateAchievements(asistencias);
  const earnedIds = earnedBadges.map(b => b.id);

  // Buscar achievements no obtenidos
  const remaining = Object.values(ACHIEVEMENTS).filter(a => !earnedIds.includes(a.id));

  if (remaining.length === 0) {
    return null; // Ya tiene todos los logros
  }

  // Calcular progreso para cada uno
  const withProgress = remaining.map(achievement => {
    let progress = 0;
    let target = 0;

    switch (achievement.criteria.type) {
      case 'days_worked':
        progress = stats.totalDays;
        target = achievement.criteria.threshold;
        break;
      case 'monthly_hours':
        progress = stats.totalHours;
        target = achievement.criteria.threshold;
        break;
      case 'punctuality':
        progress = stats.currentStreak;
        target = achievement.criteria.consecutive;
        break;
      case 'total_sessions':
        progress = stats.totalDays;
        target = achievement.criteria.threshold;
        break;
      default:
        progress = 0;
        target = 100;
    }

    return {
      ...achievement,
      progress,
      target,
      percentage: target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0
    };
  });

  // Retornar el más cercano a completarse
  withProgress.sort((a, b) => b.percentage - a.percentage);
  return withProgress[0];
};

export default {
  ACHIEVEMENTS,
  calculateUserStats,
  evaluateAchievements,
  getNextAchievement
};
