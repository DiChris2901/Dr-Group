import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ===== VALORES LEGALES POR AÑO (fallback si no hay doc en Firestore) =====
export const VALORES_LEGALES = {
  2024: { smmlv: 1300000,  auxTransporte: 162000  },
  2025: { smmlv: 1423500,  auxTransporte: 200000  },
  2026: { smmlv: 1750905,  auxTransporte: 249095  },
};

// ===== TASAS PARAFISCALES LEGALES (Colombia — CST y Ley 100/93) =====
// Solo cambian por decreto legislativo. Compatibles con PORCENTAJES en useNomina.js.
export const TASAS_DEFAULT = {
  SALUD_EMPLEADO:      4,      // 4% IBC — Art. 204 Ley 100/93
  PENSION_EMPLEADO:    4,      // 4% IBC — Art. 20 Ley 797/03
  SALUD_EMPLEADOR:     8.5,    // 8.5% IBC
  PENSION_EMPLEADOR:   12,     // 12% IBC
  CAJA_COMPENSACION:   4,      // 4% IBC
  CESANTIAS:           8.33,   // 8.33% base prestacional
  INTERESES_CESANTIAS: 1,      // 1% mensual sobre cesaítías — Ley 52/75
  PRIMA:               8.33,   // 8.33% base prestacional
  VACACIONES:          4.17,   // 4.17% salario — CST Art. 186
  ARL: { 'I': 0.522, 'II': 1.044, 'III': 2.436, 'IV': 4.350, 'V': 6.960 },
};

const getFallback = (year) => {
  const base = VALORES_LEGALES[year] || VALORES_LEGALES[2026];
  return { ...base, tasas: TASAS_DEFAULT };
};

/**
 * Hook para leer y actualizar la configuración anual de nómina.
 * Lee/escribe en: configuracion_nomina/{year}
 *
 * Uso en RecursosHumanosPage (edición):
 *   const { config, loading, saving, guardarConfig } = useConfigNomina(year);
 *
 * Uso en NominaPage (solo lectura):
 *   const { config, loading } = useConfigNomina(year);
 */
const useConfigNomina = (year) => {
  const { currentUser, userProfile } = useAuth();
  const [config, setConfig] = useState(getFallback(year));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !year) return;

    let cancelled = false;
    setLoading(true);

    const loadConfig = async () => {
      try {
        const ref = doc(db, 'configuracion_nomina', String(year));
        const snap = await getDoc(ref);
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data();
            setConfig({ smmlv: data.smmlv, auxTransporte: data.auxTransporte, tasas: data.tasas || TASAS_DEFAULT });
          } else {
            setConfig(getFallback(year));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando config nómina:', err);
          setError(err.message);
          setConfig(getFallback(year));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadConfig();
    return () => { cancelled = true; };
  }, [currentUser, year]);

  /**
   * Guarda la configuración del año en Firestore.
   * Solo llama a esto desde el formulario de admin en RecursosHumanosPage.
   */
  const guardarConfig = useCallback(async ({ smmlv, auxTransporte, tasas }) => {
    setSaving(true);
    setError(null);
    const tasasFinal = tasas || TASAS_DEFAULT;
    try {
      const ref = doc(db, 'configuracion_nomina', String(year));
      await setDoc(ref, {
        year: Number(year),
        smmlv,
        auxTransporte,
        tasas: tasasFinal,
        fechaVigencia: `${year}-01-01`,
        actualizadoPor: userProfile?.name || userProfile?.displayName || 'Usuario',
        actualizadoEn: serverTimestamp(),
      });
      setConfig({ smmlv, auxTransporte, tasas: tasasFinal });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [year, userProfile]);

  return { config, loading, saving, error, guardarConfig, VALORES_LEGALES, TASAS_DEFAULT };
};

export default useConfigNomina;
