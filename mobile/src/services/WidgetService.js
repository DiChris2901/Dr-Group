/**
 * WidgetService.js
 *
 * Puente entre AuthContext (React Native) y el widget nativo Android.
 * Escribe en SharedPreferences via el módulo nativo SharedPrefsModule.kt
 * para que el widget de jornada laboral se actualice en tiempo real.
 *
 * Solo actúa en Android; en otros platforms es un no-op.
 */
import { NativeModules, Platform } from 'react-native';

const { SharedPrefs } = NativeModules;

/**
 * Convierte un campo timestamp de Firestore (Timestamp object o Date) a ms unix.
 */
function toMs(val) {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  return 0;
}

/**
 * Actualiza el widget con los datos de la sesión activa.
 * Llamar siempre que activeSession cambie en AuthContext.
 *
 * @param {object|null} activeSession - Estado completo de la sesión desde Firestore
 */
function updateSession(activeSession) {
  if (Platform.OS !== 'android' || !SharedPrefs) return;

  try {
    if (!activeSession || activeSession.estadoActual === 'finalizado') {
      SharedPrefs.clearSessionData();
      return;
    }

    const estado = activeSession.estadoActual || 'off';

    // ── Hora de entrada ────────────────────────────────────────────────────
    const entradaMs = toMs(activeSession.entrada?.hora);
    const horaEntrada = entradaMs
      ? new Date(entradaMs).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '--:--';

    // ── Breaks completados ─────────────────────────────────────────────────
    let breaksTotalMs = 0;
    if (activeSession.breaks) {
      for (const b of activeSession.breaks) {
        if (b.inicio && b.fin) {
          breaksTotalMs += toMs(b.fin) - toMs(b.inicio);
        }
      }
    }

    // ── Almuerzo completado ────────────────────────────────────────────────
    let almuerzoMs = 0;
    const alm = activeSession.almuerzo;
    if (alm?.inicio && alm?.fin) {
      almuerzoMs = toMs(alm.fin) - toMs(alm.inicio);
    }

    // ── Inicio de pausa actual (break/almuerzo en curso) ───────────────────
    let currentPauseStartMs = 0;
    if (estado === 'break') {
      const openBreak = activeSession.breaks?.find(b => b.inicio && !b.fin);
      if (openBreak) currentPauseStartMs = toMs(openBreak.inicio);
    } else if (estado === 'almuerzo') {
      if (alm?.inicio && !alm?.fin) {
        currentPauseStartMs = toMs(alm.inicio);
      }
    }

    SharedPrefs.setSessionData(
      estado,
      horaEntrada,
      entradaMs,
      breaksTotalMs,
      almuerzoMs,
      currentPauseStartMs,
    );
  } catch (e) {
    // Widget update es no crítico — no romper el flujo principal
    console.warn('[WidgetService] update failed:', e?.message);
  }
}

/**
 * Limpia el widget (logout o sesión finalizada completamente).
 */
function clearSession() {
  if (Platform.OS !== 'android' || !SharedPrefs) return;
  try {
    SharedPrefs.clearSessionData();
  } catch (e) {
    console.warn('[WidgetService] clear failed:', e?.message);
  }
}

const WidgetService = { updateSession, clearSession };
export default WidgetService;
