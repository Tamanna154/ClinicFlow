import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import PatientCard from '../components/PatientCard';

export default function PatientListScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await patientApi.getAll();
      setPatients(data);
    } catch (err) {
      Alert.alert('Error', 'Unable to connect to the server. Please check your connection details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [])
  );

  const filteredPatients = patients.filter((patient) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (patient.name || '').toLowerCase().includes(q) ||
      (patient.phone || '').includes(q) ||
      (patient.bloodGroup || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading Patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search & Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or blood group..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✖️</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.countText}>
          {searchQuery
            ? `Found ${filteredPatients.length} of ${patients.length} patients`
            : `Total: ${patients.length} Patient${patients.length === 1 ? '' : 's'}`}
        </Text>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            onPress={() =>
              navigation.navigate('PatientDetail', { patient: item })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '🏥'}</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching patients' : 'No patients registered yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Check the spelling or try searching another keyword'
                : 'Tap the blue button below to register your first patient.'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPatients(true)}
            colors={['#1E3A8A']}
            tintColor="#1E3A8A"
          />
        }
        contentContainerStyle={
          filteredPatients.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PatientForm', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#475569', fontWeight: '500' },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 12,
    color: '#94A3B8',
    padding: 4,
  },
  countText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { fontSize: 32, color: '#ffffff', fontWeight: '300', lineHeight: 32 },
});
