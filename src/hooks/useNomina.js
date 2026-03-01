import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ===== CONSTANTES LEGALES COLOMBIA (CST) =====
const PORCENTAJES = {
  // Deducciones empleado
  SALUD_EMPLEADO: 4,        // 4% del IBC
  PENSION_EMPLEADO: 4,      // 4% del IBC

  // Aportes empleador
  SALUD_EMPLEADOR: 8.5,     // 8.5% del IBC
  PENSION_EMPLEADOR: 12,    // 12% del IBC
  CAJA_COMPENSACION: 4,     // 4% del IBC

  // Provisiones prestacionales (sobre salario + auxilio transporte)
  CESANTIAS: 8.33,          // 8.33%
  INTERESES_CESANTIAS: 1,   // 1% mensual sobre cesantías
  PRIMA: 8.33,              // 8.33%

  // Provisiones prestacionales (solo sobre salario)
  VACACIONES: 4.17,         // 4.17% del salario base

  // ARL Niveles de riesgo
  ARL: {
    'I': 0.522,
    'II': 1.044,
    'III': 2.436,
    'IV': 4.350,
    'V': 6.960
  }
};

// SMMLV y Auxilio de Transporte (valores 2026 - actualizados desde configuracion_nomina/{year})
const DEFAULTS = {
  SMMLV: 1750905,
  AUX_TRANSPORTE: 249095
};

/**
 * Calcula la línea de nómina para un empleado en un período
 */
const calcularLineaNomina = (empleado, diasTrabajados, bono, bonoDescripcion, smmlv, auxTransporte, tipoNomina, esPrimeraQuincena, pagosAdicionales = [], tasas = null) => {
  const P = tasas || PORCENTAJES; // Tasas desde Firestore; PORCENTAJES del código como fallback
  const salarioBase = empleado.salarioBase || 0;
  const nivelArl = empleado.nivelRiesgoArl || 'I';
  const arlPorcentaje = P.ARL[nivelArl] || 0.522;
  const dias = diasTrabajados ?? 30;

  // === DEVENGADOS ===
  const salarioDevengado = Math.round((salarioBase / 30) * dias);
  // Auxilio de transporte: solo si salario <= 2 SMMLV
  const aplicaAuxTransporte = salarioBase <= (2 * smmlv);
  const auxTransporteCalculado = aplicaAuxTransporte ? Math.round((auxTransporte / 30) * dias) : 0;

  // Para quincenal primera quincena: anticipo sin deducciones
  if (tipoNomina === 'quincenal' && esPrimeraQuincena) {
    const anticipo = Math.round(salarioBase * 0.5);
    return {
      empleadoId: empleado.id,
      empleadoNombre: `${empleado.nombres} ${empleado.apellidos}`,
      empleadoDocumento: empleado.numeroDocumento || '',
      empresaContratante: empleado.empresaContratante || '',
      cargo: empleado.cargo || '',
      salarioBase,
      diasTrabajados: 15,
      salarioDevengado: anticipo,
      auxTransporte: 0,
      bonos: 0,
      bonoDescripcion: '',
      totalDevengado: anticipo,
      saludEmpleado: 0,
      pensionEmpleado: 0,
      otrasDeduccciones: 0,
      totalDeducciones: 0,
      netoAPagar: anticipo,
      anticipo: 0,
      // Provisiones empleador (no se calculan en anticipo)
      saludEmpleador: 0,
      pensionEmpleador: 0,
      arl: 0,
      arlPorcentaje,
      caja: 0,
      cesantias: 0,
      interesesCesantias: 0,
      prima: 0,
      vacaciones: 0,
      totalProvisionesEmpleador: 0,
      observaciones: 'Anticipo primera quincena (50% del salario base)',
      eps: empleado.eps || '',
      fondoPension: empleado.fondoPension || '',
      fondoCesantias: empleado.fondoCesantias || '',
      arlNombre: empleado.arl || '',
      cajaCompensacion: empleado.cajaCompensacion || '',
      tipoNomina: 'quincenal',
      banco: empleado.banco || '',
      tipoCuenta: empleado.tipoCuenta || '',
      numeroCuenta: empleado.numeroCuenta || ''
    };
  }

  // Base para deducciones y aportes (IBC = Ingreso Base de Cotización)
  // IBC = salario devengado (NO incluye auxilio de transporte ni bonos no salariales)
  const ibc = salarioDevengado;

  // Bonos (no constituyen factor salarial según acuerdo con usuario)
  const bonosTotal = bono || 0;
  const totalPagosAdicionales = (pagosAdicionales || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);

  const totalDevengado = salarioDevengado + auxTransporteCalculado + bonosTotal + totalPagosAdicionales;

  // === DEDUCCIONES EMPLEADO ===
  const saludEmpleado = Math.round(ibc * P.SALUD_EMPLEADO / 100);
  const pensionEmpleado = Math.round(ibc * P.PENSION_EMPLEADO / 100);
  const totalDeducciones = saludEmpleado + pensionEmpleado;

  // === NETO A PAGAR ===
  let anticipo = 0;
  let netoAPagar = totalDevengado - totalDeducciones;

  // Si es segunda quincena: restar anticipo de primera quincena
  if (tipoNomina === 'quincenal' && !esPrimeraQuincena) {
    anticipo = Math.round(salarioBase * 0.5);
    netoAPagar = totalDevengado - totalDeducciones - anticipo;
  }

  // === APORTES EMPLEADOR ===
  const saludEmpleador = Math.round(ibc * P.SALUD_EMPLEADOR / 100);
  const pensionEmpleador = Math.round(ibc * P.PENSION_EMPLEADOR / 100);
  const arlMonto = Math.round(ibc * arlPorcentaje / 100);
  const cajaMonto = Math.round(ibc * P.CAJA_COMPENSACION / 100);

  // === PROVISIONES PRESTACIONALES ===
  // Base prestacional = salario devengado + aux transporte (CST Art. 127)
  const basePrestacional = salarioDevengado + auxTransporteCalculado;
  const cesantias = Math.round(basePrestacional * P.CESANTIAS / 100);
  const interesesCesantias = Math.round(cesantias * P.INTERESES_CESANTIAS / 100);
  const prima = Math.round(basePrestacional * P.PRIMA / 100);
  // Vacaciones se calculan solo sobre salario (CST Art. 186)
  const vacaciones = Math.round(salarioDevengado * P.VACACIONES / 100);

  const totalProvisionesEmpleador = saludEmpleador + pensionEmpleador + arlMonto + cajaMonto + cesantias + interesesCesantias + prima + vacaciones;

  return {
    empleadoId: empleado.id,
    empleadoNombre: `${empleado.nombres} ${empleado.apellidos}`,
    empleadoDocumento: empleado.numeroDocumento || '',
    empresaContratante: empleado.empresaContratante || '',
    cargo: empleado.cargo || '',
    salarioBase,
    diasTrabajados: dias,
    salarioDevengado,
    auxTransporte: auxTransporteCalculado,
    bonos: bonosTotal,
    bonoDescripcion: bonoDescripcion || '',
    totalDevengado,
    saludEmpleado,
    pensionEmpleado,
    otrasDeduccciones: 0,
    totalDeducciones,
    netoAPagar,
    anticipo,
    pagosAdicionales: pagosAdicionales || [],
    // Provisiones empleador
    saludEmpleador,
    pensionEmpleador,
    arl: arlMonto,
    arlPorcentaje,
    caja: cajaMonto,
    cesantias,
    interesesCesantias,
    prima,
    vacaciones,
    totalProvisionesEmpleador,
    observaciones: '',
    eps: empleado.eps || '',
    fondoPension: empleado.fondoPension || '',
    fondoCesantias: empleado.fondoCesantias || '',
    arlNombre: empleado.arl || '',
    cajaCompensacion: empleado.cajaCompensacion || '',
    tipoNomina: tipoNomina || 'mensual',
    banco: empleado.banco || '',
    tipoCuenta: empleado.tipoCuenta || '',
    numeroCuenta: empleado.numeroCuenta || ''
  };
};

/**
 * Hook para gestión completa de nómina
 */
const useNomina = () => {
  const { currentUser, userProfile } = useAuth();
  const [nominas, setNominas] = useState([]);
  const [nominaActual, setNominaActual] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Configuración editable
  const [config, setConfig] = useState({
    smmlv: DEFAULTS.SMMLV,
    auxTransporte: DEFAULTS.AUX_TRANSPORTE,
    tasas: null,
  });

  // Cargar empleados activos
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'empleados'),
      orderBy('apellidos', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((d) => {
        const emp = { id: d.id, ...d.data() };
        // Solo empleados activos (no retirados)
        if (!emp.retirado) {
          data.push(emp);
        }
      });
      setEmpleados(data);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Cargar histórico de nóminas
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'nomina'),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data() });
      });
      setNominas(data);
    }, (err) => {
      console.error('Error cargando nóminas:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  /**
   * Genera las líneas de nómina para todos los empleados
   */
  const generarLineas = useCallback((tipo, datosEditables = {}) => {
    const esPrimeraQuincena = tipo === 'quincenal-1';

    return empleados
      .filter(emp => {
        // Para quincenal, solo empleados con tipoNomina quincenal
        if (tipo === 'quincenal-1' || tipo === 'quincenal-2') {
          return emp.tipoNomina === 'quincenal';
        }
        // Para mensual, solo empleados con tipoNomina mensual (o sin definir)
        return emp.tipoNomina !== 'quincenal';
      })
      .map(emp => {
        const editable = datosEditables[emp.id] || {};
        return calcularLineaNomina(
          emp,
          editable.diasTrabajados ?? 30,
          editable.bonos ?? 0,
          editable.bonoDescripcion ?? '',
          config.smmlv,
          config.auxTransporte,
          tipo === 'quincenal-1' || tipo === 'quincenal-2' ? 'quincenal' : 'mensual',
          esPrimeraQuincena,
          editable.pagosAdicionales ?? [],
          config.tasas
        );
      });
  }, [empleados, config]);

  /**
   * Crea una nueva nómina en estado borrador
   */
  const crearNomina = useCallback(async (periodo, tipo, lineas) => {
    try {
      setSaving(true);
      setError(null);

      const totalDevengado = lineas.reduce((sum, l) => sum + l.totalDevengado, 0);
      const totalDeducciones = lineas.reduce((sum, l) => sum + l.totalDeducciones, 0);
      const totalNeto = lineas.reduce((sum, l) => sum + l.netoAPagar, 0);
      const totalProvisionesEmpleador = lineas.reduce((sum, l) => sum + l.totalProvisionesEmpleador, 0);

      const docRef = await addDoc(collection(db, 'nomina'), {
        periodo,
        tipo,
        estado: 'borrador',
        smmlv: config.smmlv,
        auxTransporte: config.auxTransporte,
        totalDevengado,
        totalDeducciones,
        totalNeto,
        totalProvisionesEmpleador,
        cantidadEmpleados: lineas.length,
        lineas,
        fechaCreacion: serverTimestamp(),
        fechaProcesamiento: null,
        fechaPago: null,
        creadoPor: currentUser.uid,
        creadoPorNombre: userProfile?.name || userProfile?.displayName || 'Usuario'
      });

      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentUser, userProfile, config]);

  /**
   * Actualiza una nómina existente (solo en estado borrador)
   */
  const actualizarNomina = useCallback(async (nominaId, lineas) => {
    try {
      setSaving(true);
      setError(null);

      const totalDevengado = lineas.reduce((sum, l) => sum + l.totalDevengado, 0);
      const totalDeducciones = lineas.reduce((sum, l) => sum + l.totalDeducciones, 0);
      const totalNeto = lineas.reduce((sum, l) => sum + l.netoAPagar, 0);
      const totalProvisionesEmpleador = lineas.reduce((sum, l) => sum + l.totalProvisionesEmpleador, 0);

      await updateDoc(doc(db, 'nomina', nominaId), {
        lineas,
        totalDevengado,
        totalDeducciones,
        totalNeto,
        totalProvisionesEmpleador,
        cantidadEmpleados: lineas.length,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Cambia el estado de la nómina
   */
  const cambiarEstado = useCallback(async (nominaId, nuevoEstado) => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        estado: nuevoEstado,
        updatedAt: serverTimestamp()
      };

      if (nuevoEstado === 'procesada') {
        updateData.fechaProcesamiento = serverTimestamp();
      }
      if (nuevoEstado === 'pagada') {
        updateData.fechaPago = serverTimestamp();
      }

      await updateDoc(doc(db, 'nomina', nominaId), updateData);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Verifica si existe una nómina para un período específico
   */
  const verificarPeriodoExistente = useCallback(async (periodo, tipo) => {
    const q = query(
      collection(db, 'nomina'),
      where('periodo', '==', periodo),
      where('tipo', '==', tipo)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const existente = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      return existente;
    }
    return null;
  }, []);

  /**
   * Obtener solicitudes aprobadas del período para alertas de novedades
   */
  const obtenerNovedadesPeriodo = useCallback(async (periodo) => {
    try {
      const [year, month] = periodo.split('-');
      const inicioMes = new Date(parseInt(year), parseInt(month) - 1, 1);
      const finMes = new Date(parseInt(year), parseInt(month), 0);

      const q = query(
        collection(db, 'solicitudes'),
        where('estado', '==', 'aprobada')
      );
      const snapshot = await getDocs(q);
      const novedades = [];

      snapshot.forEach((d) => {
        const sol = d.data();
        // Verificar si la solicitud cae en el período
        const fechaInicio = sol.fechaInicio ? new Date(sol.fechaInicio) : null;
        if (fechaInicio && fechaInicio >= inicioMes && fechaInicio <= finMes) {
          novedades.push({
            id: d.id,
            tipo: sol.tipo,
            empleadoNombre: sol.empleadoNombre || sol.solicitante || '',
            fechaInicio: sol.fechaInicio,
            fechaFin: sol.fechaFin,
            dias: sol.dias || 0,
            descripcion: sol.motivo || sol.descripcion || ''
          });
        }
      });

      return novedades;
    } catch (err) {
      console.error('Error cargando novedades:', err);
      return [];
    }
  }, []);

  return {
    // Estado
    nominas,
    nominaActual,
    setNominaActual,
    empleados,
    loading,
    saving,
    error,
    config,
    setConfig,

    // Constantes
    PORCENTAJES,
    DEFAULTS,

    // Acciones
    generarLineas,
    crearNomina,
    actualizarNomina,
    cambiarEstado,
    verificarPeriodoExistente,
    obtenerNovedadesPeriodo,
    calcularLineaNomina
  };
};

export default useNomina;
