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
    
    // 1.5 Detectar cambio de NOMBRE DE SALA
    if (oldData.name !== newData.name && (oldData.name || newData.name)) {
      changes.push({
        salaId,
        salaName: newData.name || oldData.name, // Usar el nuevo nombre
        changeType: 'nombre_sala',
        oldValue: oldData.name || '',
        newValue: newData.name || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        reason
      });
    }
    
    // 1.6 Detectar cambio de DIRECCIÓN
    if (oldData.address !== newData.address && (oldData.address || newData.address)) {
      changes.push({
        salaId,
        salaName,
        changeType: 'direccion',
        oldValue: oldData.address || '',
        newValue: newData.address || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        reason
      });
    }
    
    // 1.7 Detectar cambios en DOCUMENTOS (attachments)
    const oldAttachments = oldData.attachments || {};
    const newAttachments = newData.attachments || {};
    
    // Cambio en Cámara de Comercio
    if (JSON.stringify(oldAttachments.camaraComercio) !== JSON.stringify(newAttachments.camaraComercio)) {
      const actionType = !oldAttachments.camaraComercio && newAttachments.camaraComercio ? 'carga' :
                        oldAttachments.camaraComercio && !newAttachments.camaraComercio ? 'eliminación' :
                        'reemplazo';
      
      changes.push({
        salaId,
        salaName,
        changeType: 'documento_camara_comercio',
        action: actionType,
        oldValue: oldAttachments.camaraComercio?.name || '',
        newValue: newAttachments.camaraComercio?.name || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        reason
      });
    }
    
    // Cambio en Uso de Suelos
    if (JSON.stringify(oldAttachments.usoSuelos) !== JSON.stringify(newAttachments.usoSuelos)) {
      const actionType = !oldAttachments.usoSuelos && newAttachments.usoSuelos ? 'carga' :
                        oldAttachments.usoSuelos && !newAttachments.usoSuelos ? 'eliminación' :
                        'reemplazo';
      
      changes.push({
        salaId,
        salaName,
        changeType: 'documento_uso_suelos',
        action: actionType,
        oldValue: oldAttachments.usoSuelos?.name || '',
        newValue: newAttachments.usoSuelos?.name || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
        },
        reason
      });
    }
    
    // Cambio en Validación Uso de Suelos
    if (JSON.stringify(oldAttachments.validacionUsoSuelos) !== JSON.stringify(newAttachments.validacionUsoSuelos)) {
      const actionType = !oldAttachments.validacionUsoSuelos && newAttachments.validacionUsoSuelos ? 'carga' :
                        oldAttachments.validacionUsoSuelos && !newAttachments.validacionUsoSuelos ? 'eliminación' :
                        'reemplazo';
      
      changes.push({
        salaId,
        salaName,
        changeType: 'documento_validacion_uso_suelos',
        action: actionType,
        oldValue: oldAttachments.validacionUsoSuelos?.name || '',
        newValue: newAttachments.validacionUsoSuelos?.name || '',
        timestamp: serverTimestamp(),
        changedBy: {
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email
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

    // Detectar cambio de representante legal principal (solo si hay un cambio real, no vacío → vacío)
    const hasRealRepLegalChange = () => {
      const nombreChanged = oldData.nombreRepLegal !== newData.nombreRepLegal;
      const tipoDocChanged = oldData.tipoDocumentoRepLegal !== newData.tipoDocumentoRepLegal;
      const cedulaChanged = oldData.cedulaRepLegal !== newData.cedulaRepLegal;
      
      // Solo registrar si hay un valor nuevo Y es diferente al anterior
      const nombreHasRealChange = nombreChanged && (oldData.nombreRepLegal || newData.nombreRepLegal);
      const tipoDocHasRealChange = tipoDocChanged && (oldData.tipoDocumentoRepLegal || newData.tipoDocumentoRepLegal);
      const cedulaHasRealChange = cedulaChanged && (oldData.cedulaRepLegal || newData.cedulaRepLegal);
      
      return nombreHasRealChange || tipoDocHasRealChange || cedulaHasRealChange;
    };

    if (hasRealRepLegalChange()) {
      const repLegalChanges = {};
      
      if (oldData.nombreRepLegal !== newData.nombreRepLegal && (oldData.nombreRepLegal || newData.nombreRepLegal)) {
        repLegalChanges.nombreRepLegal = {
          old: oldData.nombreRepLegal || '',
          new: newData.nombreRepLegal || ''
        };
      }
      
      if (oldData.tipoDocumentoRepLegal !== newData.tipoDocumentoRepLegal && (oldData.tipoDocumentoRepLegal || newData.tipoDocumentoRepLegal)) {
        repLegalChanges.tipoDocumentoRepLegal = {
          old: oldData.tipoDocumentoRepLegal || 'CC',
          new: newData.tipoDocumentoRepLegal || 'CC'
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
          changeType: 'representante_legal_principal',
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

    // Detectar cambio de representante legal SUPLENTE
    const hasRealRepLegalSuplenteChange = () => {
      const nombreChanged = oldData.nombreRepLegalSuplente !== newData.nombreRepLegalSuplente;
      const tipoDocChanged = oldData.tipoDocumentoRepLegalSuplente !== newData.tipoDocumentoRepLegalSuplente;
      const cedulaChanged = oldData.cedulaRepLegalSuplente !== newData.cedulaRepLegalSuplente;
      
      const nombreHasRealChange = nombreChanged && (oldData.nombreRepLegalSuplente || newData.nombreRepLegalSuplente);
      const tipoDocHasRealChange = tipoDocChanged && (oldData.tipoDocumentoRepLegalSuplente || newData.tipoDocumentoRepLegalSuplente);
      const cedulaHasRealChange = cedulaChanged && (oldData.cedulaRepLegalSuplente || newData.cedulaRepLegalSuplente);
      
      return nombreHasRealChange || tipoDocHasRealChange || cedulaHasRealChange;
    };

    if (hasRealRepLegalSuplenteChange()) {
      const repLegalSuplenteChanges = {};
      
      if (oldData.nombreRepLegalSuplente !== newData.nombreRepLegalSuplente && (oldData.nombreRepLegalSuplente || newData.nombreRepLegalSuplente)) {
        repLegalSuplenteChanges.nombreRepLegalSuplente = {
          old: oldData.nombreRepLegalSuplente || '',
          new: newData.nombreRepLegalSuplente || ''
        };
      }
      
      if (oldData.tipoDocumentoRepLegalSuplente !== newData.tipoDocumentoRepLegalSuplente && (oldData.tipoDocumentoRepLegalSuplente || newData.tipoDocumentoRepLegalSuplente)) {
        repLegalSuplenteChanges.tipoDocumentoRepLegalSuplente = {
          old: oldData.tipoDocumentoRepLegalSuplente || 'CC',
          new: newData.tipoDocumentoRepLegalSuplente || 'CC'
        };
      }
      
      if (oldData.cedulaRepLegalSuplente !== newData.cedulaRepLegalSuplente && (oldData.cedulaRepLegalSuplente || newData.cedulaRepLegalSuplente)) {
        repLegalSuplenteChanges.cedulaRepLegalSuplente = {
          old: oldData.cedulaRepLegalSuplente || '',
          new: newData.cedulaRepLegalSuplente || ''
        };
      }

      if (Object.keys(repLegalSuplenteChanges).length > 0) {
        changes.push({
          salaId,
          salaName,
          changeType: 'representante_legal_suplente',
          changes: repLegalSuplenteChanges,
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
