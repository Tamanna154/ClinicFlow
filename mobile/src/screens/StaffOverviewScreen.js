import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { colors, borderRadius, shadows } from '../theme';

const STAFF_TILES = [
  { key: 'doctors', icon: '🩺', label: 'Doctors', color: '#3B82F6', screen: 'Doctors', tab: 'Doctors' },
  { key: 'receptionist', icon: '💁', label: 'Receptionist', color: '#8B5CF6', screen: 'StaffList', tab: 'Staff' },
  { key: 'inventory_manager', icon: '📋', label: 'Inventory Manager', color: '#EC4899', screen: 'StaffList', tab: 'Staff' },
  { key: 'pharmacist', icon: '💊', label: 'Pharmacist', color: '#F59E0B', screen: 'StaffList', tab: 'Staff' },
  { key: 'accountant', icon: '💰', label: 'Accountant', color: '#10B981', screen: 'StaffList', tab: 'Staff' },
];

export default function StaffOverviewScreen({ navigation }) {
  const handleTile = (tile) => {
    if (tile.tab) {
      navigation.getParent()?.navigate(tile.tab, { screen: tile.screen });
    } else {
      navigation.navigate(tile.screen);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Overview</Text>
        <Text style={styles.headerSub}>Manage your clinic team and departments</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {STAFF_TILES.map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={[styles.tile, { borderLeftColor: tile.color }]}
            onPress={() => handleTile(tile)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: tile.color + '15' }]}>
              <Text style={styles.icon}>{tile.icon}</Text>
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Text style={styles.tileArrow}>➔</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },
  grid: { padding: 16, gap: 10, paddingBottom: 40 },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 24 },
  tileLabel: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  tileArrow: { fontSize: 16, color: colors.textMuted },
});
