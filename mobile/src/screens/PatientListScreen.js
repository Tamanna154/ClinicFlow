import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import { useAuth } from '../context/AuthContext';
import PatientCard from '../components/PatientCard';
import { colors, borderRadius, shadows } from '../theme';

function BulkSmsBtn({ navigation }) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('BulkSms')} style={{ marginRight: 12 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>SMS</Text>
    </TouchableOpacity>
  );
}

export default function PatientListScreen({ navigation }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({ 
      headerRight: () => <BulkSmsBtn navigation={navigation} /> 
    });
  }, [navigation]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();

  const fetchPatients = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await patientApi.getAll(showArchived || undefined);
      setPatients(data);
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPatients(); }, [showArchived]));

  const filtered = patients.filter((p) => {
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
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput style={styles.searchInput} placeholder="Search by name, phone, blood group..." placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}><Text style={styles.clearIcon}>✕</Text></TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.countText}>
            {showArchived ? 'Archived' : 'Active'} — {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, !showArchived && styles.toggleBtnActive]} onPress={() => setShowArchived(false)}><Text style={[styles.toggleText, !showArchived && styles.toggleTextActive]}>Active</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, showArchived && styles.toggleBtnActive]} onPress={() => setShowArchived(true)}><Text style={[styles.toggleText, showArchived && styles.toggleTextActive]}>Archived</Text></TouchableOpacity>
          </View>
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
            <Text style={styles.emptySub}>{searchQuery ? 'Try different search' : showArchived ? 'Archive patients from their profile' : 'Tap + to register'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPatients(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PatientForm', {})} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  headerContainer: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, height: 42 },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 4 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: colors.bg },
  toggleBtnActive: { backgroundColor: colors.primary + '15' },
  toggleText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.primary },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
