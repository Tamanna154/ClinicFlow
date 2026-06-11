import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import { appointmentApi } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import PatientCard from '../components/PatientCard';
import { colors, borderRadius, shadows } from '../theme';

function BulkSmsBtn({ navigation }) {
  const { hasPermission } = usePermission();
  if (!hasPermission('SEND_SMS')) return null;
  return (
    <TouchableOpacity onPress={() => navigation.navigate('BulkSms')} style={{ marginRight: 12, backgroundColor: '#FFFFFF20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>SMS</Text>
    </TouchableOpacity>
  );
}

export default function PatientListScreen({ navigation }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BulkSmsBtn navigation={navigation} />,
    });
  }, [navigation]);
  const [patients, setPatients] = useState([]);
  const [relatedPatientIds, setRelatedPatientIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canManagePatients = hasPermission('MANAGE_PATIENTS');
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchPatients = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await patientApi.getAll(showArchived || undefined);
      setPatients(data);
      // If doctor, fetch only related patients
      if (isDoctor && user?.doctorId) {
        const appts = await appointmentApi.getByDoctor(user.doctorId).catch(() => []);
        const ids = new Set(appts.map(a => a.patientId).filter(Boolean));
        setRelatedPatientIds([...ids]);
      } else {
        setRelatedPatientIds([]);
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPatients(); }, [showArchived]));

  const filtered = patients
    .filter(p => {
      if (isDoctor && !isAdmin && relatedPatientIds.length > 0) {
        return relatedPatientIds.includes(p.id);
      }
      return true;
    })
    .filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q) || (p.bloodGroup || '').toLowerCase().includes(q);
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading patients...</Text>
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
            placeholder="Search patients..."
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
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterBtn, !showArchived && styles.filterBtnActive]} onPress={() => setShowArchived(false)}>
            <Text style={[styles.filterText, !showArchived && styles.filterTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, showArchived && styles.filterBtnActive]} onPress={() => setShowArchived(true)}>
            <Text style={[styles.filterText, showArchived && styles.filterTextActive]}>Archived</Text>
          </TouchableOpacity>
          <Text style={styles.countText}>{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PatientCard patient={item} onPress={() => navigation.navigate('PatientDetail', { patient: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>P</Text></View>
            <Text style={styles.emptyTitle}>{searchQuery ? 'No results' : showArchived ? 'No archived patients' : 'No patients yet'}</Text>
            <Text style={styles.emptySub}>{searchQuery ? 'Try a different search' : showArchived ? 'Archive patients from their profile' : 'Tap + to register a patient'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPatients(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      {canManagePatients && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PatientForm', {})} activeOpacity={0.85}>
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
  filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: borderRadius.sm, backgroundColor: colors.bg },
  filterBtnActive: { backgroundColor: colors.primary + '12' },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.primary },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginLeft: 'auto' },
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
