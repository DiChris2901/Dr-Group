import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Text, 
  useTheme,
  Surface,
  ProgressBar,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import GamificationService from '../../services/GamificationService';
import { SobrioCard, OverlineText } from '../../components';
import materialTheme from '../../../material-theme.json';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function AchievementsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [asistencias, setAsistencias] = useState([]);
  const [stats, setStats] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [nextAchievement, setNextAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = new Animated.Value(0);

  const surfaceColors = theme.dark 
    ? materialTheme.schemes.dark 
    : materialTheme.schemes.light;

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar todas las asistencias del usuario
      const q = query(
        collection(db, 'asistencias'),
        where('uid', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const asistenciasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setAsistencias(asistenciasData);
      
      // Calcular estadísticas y logros
      const userStats = GamificationService.calculateUserStats(asistenciasData);
      const badges = GamificationService.evaluateAchievements(asistenciasData);
      const next = GamificationService.getNextAchievement(asistenciasData);
      
      setStats(userStats);
      setEarnedBadges(badges);
      setNextAchievement(next);
    } catch (error) {
      console.error('Error cargando logros:', error);
    } finally {
      setLoading(false);
    }
  };

  const BadgeCard = ({ achievement, earned = false }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Surface
        style={[
          styles.badgeCard,
          {
            backgroundColor: earned 
              ? surfaceColors.primaryContainer 
              : surfaceColors.surfaceContainerLow,
            borderColor: earned ? achievement.color : surfaceColors.outline,
            borderWidth: earned ? 2 : 1,
            opacity: earned ? 1 : 0.6
          }
        ]}
        elevation={earned ? 1 : 0}
      >
        <MaterialCommunityIcons 
          name={achievement.icon} 
          size={48} 
          color={earned ? achievement.color : surfaceColors.onSurfaceVariant} 
        />
        <Text 
          variant="titleMedium" 
          style={{ 
            marginTop: 12, 
            fontWeight: '600',
            textAlign: 'center',
            color: earned ? surfaceColors.onPrimaryContainer : surfaceColors.onSurfaceVariant
          }}
        >
          {achievement.name}
        </Text>
        <Text 
          variant="bodySmall" 
          style={{ 
            marginTop: 4, 
            textAlign: 'center',
            color: surfaceColors.onSurfaceVariant 
          }}
        >
          {achievement.description}
        </Text>
        {earned && (
          <Chip
            icon="check-circle"
            style={{
              marginTop: 12,
              backgroundColor: achievement.color,
            }}
            textStyle={{ color: 'white', fontSize: 12, fontWeight: '600' }}
          >
            Desbloqueado
          </Chip>
        )}
      </Surface>
    </Animated.View>
  );

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderColor: color, borderWidth: 2 }]}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
      <Text variant="headlineMedium" style={{ fontWeight: '700', color, marginTop: 8 }}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando logros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text 
            variant="displaySmall" 
            style={{ 
              fontWeight: '400', 
              color: surfaceColors.onSurface,
              letterSpacing: -0.5,
              fontFamily: 'Roboto-Flex',
              marginBottom: 4
            }}
          >
            Logros
          </Text>
          <Text variant="titleMedium" style={{ color: surfaceColors.onSurfaceVariant }}>
            Tu progreso y estadísticas
          </Text>
        </View>

        {/* Estadísticas Generales */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <OverlineText style={{ marginBottom: 16 }}>Estadísticas Generales</OverlineText>
          <View style={styles.statsGrid}>
            <StatCard 
              icon="calendar-check" 
              label="Días Trabajados" 
              value={stats?.totalDays || 0} 
              color={surfaceColors.primary} 
            />
            <StatCard 
              icon="clock" 
              label="Horas Totales" 
              value={`${stats?.totalHours || 0}h`} 
              color={surfaceColors.secondary} 
            />
            <StatCard 
              icon="fire" 
              label="Racha Actual" 
              value={stats?.currentStreak || 0} 
              color="#FF5722" 
            />
            <StatCard 
              icon="star" 
              label="Puntualidad" 
              value={`${stats?.punctualityRate || 0}%`} 
              color="#FFD700" 
            />
          </View>
        </View>

        {/* Próximo Logro */}
        {nextAchievement && (
          <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
            <OverlineText style={{ marginBottom: 16 }}>Próximo Logro</OverlineText>
            <SobrioCard style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons 
                  name={nextAchievement.icon} 
                  size={48} 
                  color={nextAchievement.color} 
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text variant="titleLarge" style={{ fontWeight: '600' }}>
                    {nextAchievement.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
                    {nextAchievement.description}
                  </Text>
                </View>
              </View>
              
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                    Progreso: {nextAchievement.progress}/{nextAchievement.target}
                  </Text>
                  <Text variant="bodySmall" style={{ fontWeight: '600', color: nextAchievement.color }}>
                    {nextAchievement.percentage}%
                  </Text>
                </View>
                <ProgressBar 
                  progress={nextAchievement.percentage / 100} 
                  color={nextAchievement.color} 
                  style={{ height: 8, borderRadius: 4 }}
                />
              </View>
            </SobrioCard>
          </View>
        )}

        {/* Logros Desbloqueados */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <OverlineText style={{ marginBottom: 16 }}>
            Desbloqueados ({earnedBadges.length}/{Object.keys(GamificationService.ACHIEVEMENTS).length})
          </OverlineText>
          <View style={styles.badgesGrid}>
            {earnedBadges.map(badge => (
              <BadgeCard key={badge.id} achievement={badge} earned={true} />
            ))}
          </View>
        </View>

        {/* Logros Bloqueados */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <OverlineText style={{ marginBottom: 16 }}>Por Desbloquear</OverlineText>
          <View style={styles.badgesGrid}>
            {Object.values(GamificationService.ACHIEVEMENTS)
              .filter(a => !earnedBadges.find(b => b.id === a.id))
              .map(badge => (
                <BadgeCard key={badge.id} achievement={badge} earned={false} />
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    minHeight: 200,
  },
});
