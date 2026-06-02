import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import DoctorCard from '../components/DoctorCard';
import { colors, borderRadius, shadows } from '../theme';

export default function DoctorListScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const canManageDoctors = user?.role === 'DOCTOR';

  const fetchDoctors = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await doctorApi.getAll();
      setDoctors(data);
    } catch (err) {
      Alert.alert('Connection Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDoctors(); }, []));

  const filtered = doctors.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (d.name || '').toLowerCase().includes(q) ||
           (d.specialization || '').toLowerCase().includes(q) ||
           (d.email || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.countText}>
          {searchQuery ? `${filtered.length} of ${doctors.length}` : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} onPress={() => navigation.navigate('DoctorDetail', { doctor: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>D</Text></View>
            <Text style={styles.emptyTitle}>{searchQuery ? 'No results' : 'No doctors yet'}</Text>
            <Text style={styles.emptySub}>{searchQuery ? 'Try a different search' : 'Tap + to add a doctor'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDoctors(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      {canManageDoctors && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('DoctorForm', {})} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  searchSection: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: borderRadius.md, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, height: 42,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 8, marginLeft: 2 },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    ...shadows.lg,
  },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
