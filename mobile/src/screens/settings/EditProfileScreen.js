import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme as usePaperTheme, IconButton, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { OverlineText } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, updateProfile, EmailAuthProvider } from 'firebase/auth';
import { db, storage, auth } from '../../services/firebase';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';

export default function EditProfileScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { user, userProfile, reloadUserProfile } = useAuth();
  const { can } = usePermissions();
  
  const [name, setName] = useState(userProfile?.displayName || userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Surface colors dinámicos
  const surfaceColors = useMemo(() => {
    const scheme = theme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      background: scheme.background,
      outlineVariant: scheme.outlineVariant,
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer
    };
  }, [theme.dark]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        handleUploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  }, []);

  const handleUploadPhoto = useCallback(async (uri) => {
    setUploading(true);
    try {
      // 1. Delete old photo if exists and is from firebase
      if (userProfile?.photoURL && userProfile.photoURL.includes('firebasestorage')) {
        try {
          // Extract path from URL or just use the known structure if possible
          // Simple way: create ref from URL
          const oldRef = ref(storage, userProfile.photoURL);
          await deleteObject(oldRef).catch(err => console.log('Old photo not found or already deleted'));
        } catch (e) {
          console.log('Error deleting old photo:', e);
        }
      }

      // 2. Upload new photo
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_photos/${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      setPhotoURL(downloadURL);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  }, [userProfile, user, setPhotoURL]);

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name.trim(),
        name: name.trim(), // Keep both for compatibility
        phone: phone.trim(),
        photoURL: photoURL
      });

      // Update Auth Profile (Sync Auth object)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { 
          displayName: name.trim(), 
          photoURL: photoURL 
        });
      }

      await reloadUserProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [name, phone, photoURL, user, reloadUserProfile, navigation]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos de contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las nuevas contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      Alert.alert('Éxito', 'Contraseña actualizada. Por favor inicia sesión nuevamente.');
      // Optionally sign out
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Contraseña actual incorrecta o error al actualizar.');
    } finally {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // ✅ Validación de permiso (después de todos los hooks)
  if (!can(APP_PERMISSIONS.PERFIL)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={surfaceColors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>No tienes permiso para editar perfil</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
      {/* Header Material You Expressive */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Header Top - Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <IconButton
            icon="account-edit-outline"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{
              backgroundColor: surfaceColors.primaryContainer,
            }}
          />
        </View>
        
        {/* Header Content - Title */}
        <View style={{ paddingHorizontal: 4 }}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57,
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}>
            Editar Perfil
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Photo Section */}
          <View style={styles.photoContainer}>
            <View style={styles.avatarWrapper}>
              {uploading ? (
                <ActivityIndicator size="large" color={surfaceColors.primary} style={styles.loader} />
              ) : (
                <Avatar.Image 
                  size={120} 
                  source={{ uri: photoURL || 'https://ui-avatars.com/api/?name=' + (name || 'User') }} 
                  style={{ backgroundColor: surfaceColors.primaryContainer }}
                />
              )}
              <TouchableOpacity 
                style={[styles.editBadge, { backgroundColor: surfaceColors.primary }]}
                onPress={handlePickImage}
              >
                <IconButton icon="camera" iconColor="white" size={20} />
              </TouchableOpacity>
            </View>
            <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 12 }}>
              Toca la cámara para cambiar tu foto
            </Text>
          </View>

          <Divider style={{ marginVertical: 24 }} />

          {/* Basic Info */}
          <OverlineText color={surfaceColors.primary} style={{ marginBottom: 16 }}>INFORMACIÓN BÁSICA</OverlineText>
          
          <TextInput
            label="Nombre Completo"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={[styles.input, { backgroundColor: surfaceColors.surfaceContainerLow }]}
            outlineStyle={{ borderRadius: 24 }}
          />

          <TextInput
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: surfaceColors.surfaceContainerLow }]}
            outlineStyle={{ borderRadius: 24 }}
          />

          <TextInput
            label="Correo Electrónico"
            value={user.email}
            mode="outlined"
            disabled
            style={[styles.input, { backgroundColor: surfaceColors.surfaceContainer }]}
            outlineStyle={{ borderRadius: 24 }}
          />

          <Button 
            mode="contained" 
            onPress={handleSaveProfile} 
            loading={loading}
            disabled={loading || uploading}
            style={{ marginTop: 16, borderRadius: 24 }}
            contentStyle={{ height: 48 }}
          >
            Guardar Cambios
          </Button>

          <Divider style={{ marginVertical: 32 }} />

          {/* Security Section */}
          <TouchableOpacity onPress={() => setShowPasswordSection(!showPasswordSection)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <OverlineText color={surfaceColors.error}>SEGURIDAD</OverlineText>
              <IconButton icon={showPasswordSection ? "chevron-up" : "chevron-down"} size={20} />
            </View>
          </TouchableOpacity>

          {showPasswordSection && (
            <Surface style={[styles.securityCard, { backgroundColor: surfaceColors.surfaceContainerLow, borderColor: surfaceColors.outlineVariant }]} elevation={0}>
              <Text variant="bodyMedium" style={{ marginBottom: 16, color: surfaceColors.onSurfaceVariant }}>
                Para cambiar tu contraseña, ingresa la actual y la nueva.
              </Text>

              <TextInput
                label="Contraseña Actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                mode="outlined"
                style={[styles.input, { backgroundColor: surfaceColors.surfaceContainerLow }]}
                outlineStyle={{ borderRadius: 24 }}
              />

              <TextInput
                label="Nueva Contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                mode="outlined"
                style={[styles.input, { backgroundColor: surfaceColors.surfaceContainerLow }]}
                outlineStyle={{ borderRadius: 24 }}
              />

              <TextInput
                label="Confirmar Nueva Contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                mode="outlined"
                style={[styles.input, { backgroundColor: surfaceColors.surfaceContainerLow }]}
                outlineStyle={{ borderRadius: 24 }}
              />

              <Button 
                mode="outlined" 
                onPress={handleChangePassword} 
                loading={loading}
                disabled={loading}
                textColor={surfaceColors.error}
                style={{ marginTop: 8, borderColor: surfaceColors.error, borderRadius: 24 }}
              >
                Actualizar Contraseña
              </Button>
            </Surface>
          )}

          <View style={{ height: 40 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  content: {
    padding: 24,
    paddingTop: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  loader: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  securityCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  }
});
