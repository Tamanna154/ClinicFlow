import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.warn('ErrorBoundary caught:', error?.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>⚠</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error?.message || 'An unexpected error occurred'}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false })} activeOpacity={0.8}>
              <Text style={styles.btnText}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 32, alignItems: 'center', width: '100%' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
