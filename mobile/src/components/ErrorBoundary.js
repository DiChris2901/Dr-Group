import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import materialTheme from '../../material-theme.json';

const lightScheme = materialTheme.schemes.light;

/**
 * ErrorBoundary — Catches unhandled JS errors in the component tree.
 * React Native requires a class component for componentDidCatch.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <ScreenContent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in dev; extend to Crashlytics/Sentry if needed
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color={lightScheme.error}
            />
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'Ocurrió un error inesperado.'}
            </Text>
            <Pressable
              style={styles.button}
              onPress={this.handleRetry}
              android_ripple={{ color: `${lightScheme.primary}1F` }}
            >
              <Text style={styles.buttonText}>Reintentar</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightScheme.surface,
    padding: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: lightScheme.errorContainer,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: lightScheme.onErrorContainer,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: lightScheme.onErrorContainer,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    backgroundColor: lightScheme.error,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: lightScheme.onError,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ErrorBoundary;
