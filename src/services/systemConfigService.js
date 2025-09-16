import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const CONFIG_COLLECTION = 'system_config';
const CONFIG_DOC = 'general';

class SystemConfigService {
  getRef() {
    return doc(db, CONFIG_COLLECTION, CONFIG_DOC);
  }

  async getConfig() {
    const snap = await getDoc(this.getRef());
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  listenConfig(callback) {
    return onSnapshot(this.getRef(), snap => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() });
      }
    });
  }

  async updateSMMLV({ valor, usuario }) {
    if (typeof valor !== 'number' || isNaN(valor)) throw new Error('Valor SMMLV inválido');
    await setDoc(this.getRef(), {
      smmlvActual: valor,
      ultimaActualizacion: serverTimestamp(),
      actualizadoPor: usuario ? {
        uid: usuario.uid,
        email: usuario.email,
        nombre: usuario.name || usuario.displayName || usuario.email
      } : null
    }, { merge: true });
  }
}

export default new SystemConfigService();
