import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Registra cambios en la información de una sala para auditoría
 * @param {string} salaId - ID de la sala
 * @param {string} salaName - Nombre de la sala
 * @param {object} oldData - Datos anteriores
 * @param {object} newData - Datos nuevos
 * @param {object} user - Usuario que realiza el cambio
 * @param {string} reason - Motivo del cambio (opcional)
 */
export const logSalaChange = async (salaId, salaName, oldData, newData, user, reason = null) => {
  try {
    const changes = [];

    // 1. Detectar cambio de ESTADO (activa/retirada)
    if (oldData.status !== newData.status) {
      changes.push({
        salaId,
        salaName,
        changeType: 'estado',
        oldValue: oldData.status || 'active',
        newValue: newData.status || 'active',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        extraData: {
          fechaRetiro: newData.fechaRetiro || null
        },
        reason
      });
    }

    // 2. Detectar cambio de EMPRESA
    if (oldData.companyId !== newData.companyId || oldData.companyName !== newData.companyName) {
      changes.push({
        salaId,
        salaName,
        changeType: 'empresa',
        oldValue: oldData.companyName || '',
        newValue: newData.companyName || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        extraData: {
          oldCompanyId: oldData.companyId || '',
          newCompanyId: newData.companyId || ''
        },
        reason
      });
    }

    // 3. Detectar cambio de PROVEEDOR ONLINE
    if (oldData.proveedorOnline !== newData.proveedorOnline) {
      changes.push({
        salaId,
        salaName,
        changeType: 'proveedor_online',
        oldValue: oldData.proveedorOnline || '',
        newValue: newData.proveedorOnline || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        extraData: {
          fechaInicioContrato: newData.fechaInicioContrato || null
        },
        reason
      });
    }

    // 4. Detectar cambio de PROPIETARIO
    if (oldData.propietario !== newData.propietario && (oldData.propietario || newData.propietario)) {
      changes.push({
        salaId,
        salaName,
        changeType: 'propietario',
        oldValue: oldData.propietario || '',
        newValue: newData.propietario || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        reason
      });
    }

    // Detectar cambio de representante legal (solo si hay un cambio real, no vacío → vacío)
    const hasRealRepLegalChange = () => {
      const nombreChanged = oldData.nombreRepLegal !== newData.nombreRepLegal;
      const cedulaChanged = oldData.cedulaRepLegal !== newData.cedulaRepLegal;
      
      // Solo registrar si hay un valor nuevo Y es diferente al anterior
      const nombreHasRealChange = nombreChanged && (oldData.nombreRepLegal || newData.nombreRepLegal);
      const cedulaHasRealChange = cedulaChanged && (oldData.cedulaRepLegal || newData.cedulaRepLegal);
      
      return nombreHasRealChange || cedulaHasRealChange;
    };

    if (hasRealRepLegalChange()) {
      const repLegalChanges = {};
      
      if (oldData.nombreRepLegal !== newData.nombreRepLegal && (oldData.nombreRepLegal || newData.nombreRepLegal)) {
        repLegalChanges.nombreRepLegal = {
          old: oldData.nombreRepLegal || '',
          new: newData.nombreRepLegal || ''
        };
      }
      
      if (oldData.cedulaRepLegal !== newData.cedulaRepLegal && (oldData.cedulaRepLegal || newData.cedulaRepLegal)) {
        repLegalChanges.cedulaRepLegal = {
          old: oldData.cedulaRepLegal || '',
          new: newData.cedulaRepLegal || ''
        };
      }

      // Solo agregar si realmente hay cambios
      if (Object.keys(repLegalChanges).length > 0) {
        changes.push({
          salaId,
          salaName,
          changeType: 'representante_legal',
          changes: repLegalChanges,
          timestamp: serverTimestamp(),
          changedBy: {
            uid: user.uid,
            name: user.displayName || user.email,
            email: user.email
          },
          reason
        });
      }
    }

    // Detectar cambio de contacto principal (solo cambios reales)
    const hasRealContacto1Change = () => {
      const nombreChanged = oldData.contactoAutorizado !== newData.contactoAutorizado && (oldData.contactoAutorizado || newData.contactoAutorizado);
      const phoneChanged = oldData.contactPhone !== newData.contactPhone && (oldData.contactPhone || newData.contactPhone);
      const emailChanged = oldData.contactEmail !== newData.contactEmail && (oldData.contactEmail || newData.contactEmail);
      
      return nombreChanged || phoneChanged || emailChanged;
    };

    if (hasRealContacto1Change()) {
      const contacto1Changes = {};
      
      if (oldData.contactoAutorizado !== newData.contactoAutorizado && (oldData.contactoAutorizado || newData.contactoAutorizado)) {
        contacto1Changes.nombre = {
          old: oldData.contactoAutorizado || '',
          new: newData.contactoAutorizado || ''
        };
      }
      
      if (oldData.contactPhone !== newData.contactPhone && (oldData.contactPhone || newData.contactPhone)) {
        contacto1Changes.telefono = {
          old: oldData.contactPhone || '',
          new: newData.contactPhone || ''
        };
      }
      
      if (oldData.contactEmail !== newData.contactEmail && (oldData.contactEmail || newData.contactEmail)) {
        contacto1Changes.email = {
          old: oldData.contactEmail || '',
          new: newData.contactEmail || ''
        };
      }

      // Solo agregar si realmente hay cambios
      if (Object.keys(contacto1Changes).length > 0) {
        changes.push({
          salaId,
          salaName,
          changeType: 'contacto_principal',
          changes: contacto1Changes,
          timestamp: serverTimestamp(),
          changedBy: {
            uid: user.uid,
            name: user.displayName || user.email,
            email: user.email
          },
          reason
        });
      }
    }

    // Detectar cambio de contacto secundario (solo cambios reales)
    const hasRealContacto2Change = () => {
      const nombreChanged = oldData.contactoAutorizado2 !== newData.contactoAutorizado2 && (oldData.contactoAutorizado2 || newData.contactoAutorizado2);
      const phoneChanged = oldData.contactPhone2 !== newData.contactPhone2 && (oldData.contactPhone2 || newData.contactPhone2);
      const emailChanged = oldData.contactEmail2 !== newData.contactEmail2 && (oldData.contactEmail2 || newData.contactEmail2);
      
      return nombreChanged || phoneChanged || emailChanged;
    };

    if (hasRealContacto2Change()) {
      const contacto2Changes = {};
      
      if (oldData.contactoAutorizado2 !== newData.contactoAutorizado2 && (oldData.contactoAutorizado2 || newData.contactoAutorizado2)) {
        contacto2Changes.nombre = {
          old: oldData.contactoAutorizado2 || '',
          new: newData.contactoAutorizado2 || ''
        };
      }
      
      if (oldData.contactPhone2 !== newData.contactPhone2 && (oldData.contactPhone2 || newData.contactPhone2)) {
        contacto2Changes.telefono = {
          old: oldData.contactPhone2 || '',
          new: newData.contactPhone2 || ''
        };
      }
      
      if (oldData.contactEmail2 !== newData.contactEmail2 && (oldData.contactEmail2 || newData.contactEmail2)) {
        contacto2Changes.email = {
          old: oldData.contactEmail2 || '',
          new: newData.contactEmail2 || ''
        };
      }

      // Solo agregar si realmente hay cambios
      if (Object.keys(contacto2Changes).length > 0) {
        changes.push({
          salaId,
          salaName,
          changeType: 'contacto_secundario',
          changes: contacto2Changes,
          timestamp: serverTimestamp(),
          changedBy: {
            uid: user.uid,
            name: user.displayName || user.email,
            email: user.email
          },
          reason
        });
      }
    }

    // Guardar todos los cambios en Firestore
    if (changes.length > 0) {
      const changePromises = changes.map(change => 
        addDoc(collection(db, 'sala_changes'), change)
      );
      
      await Promise.all(changePromises);
      console.log(`✅ ${changes.length} cambio(s) registrado(s) en sala: ${salaName}`);
      return { success: true, changesCount: changes.length };
    }

    return { success: true, changesCount: 0 };
  } catch (error) {
    console.error('❌ Error registrando cambios de sala:', error);
    throw error;
  }
};

/**
 * Registra la creación inicial de una sala
 */
export const logSalaCreation = async (salaId, salaName, salaData, user) => {
  try {
    await addDoc(collection(db, 'sala_changes'), {
      salaId,
      salaName,
      changeType: 'creation',
      timestamp: serverTimestamp(),
      changedBy: {
        uid: user.uid,
        name: user.displayName || user.email,
        email: user.email
      },
      initialData: {
        propietario: salaData.propietario || '',
        nombreRepLegal: salaData.nombreRepLegal || '',
        cedulaRepLegal: salaData.cedulaRepLegal || '',
        contactoAutorizado: salaData.contactoAutorizado || ''
      }
    });

    console.log(`✅ Creación de sala registrada: ${salaName}`);
  } catch (error) {
    console.error('❌ Error registrando creación de sala:', error);
    throw error;
  }
};

/**
 * Elimina un registro de cambio específico (útil para limpiar registros erróneos)
 */
export const deleteSalaChange = async (changeId) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'sala_changes', changeId));
    console.log(`✅ Registro de cambio eliminado: ${changeId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando registro de cambio:', error);
    throw error;
  }
};
