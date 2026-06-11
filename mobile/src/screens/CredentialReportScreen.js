import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { patientApi } from '../api/patientApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

export default function CredentialReportScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('doctors');
  const { user } = useAuth();

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const docList = await doctorApi.getAll().catch(() => []);
      const enrichedDocs = [];
      for (const doc of docList) {
        try {
          const full = await doctorApi.getById(doc.id);
          enrichedDocs.push(full);
        } catch (e) {
          enrichedDocs.push(doc);
        }
      }
      setDoctors(enrichedDocs);

      const patList = await patientApi.getAll().catch(() => []);
      const enrichedPats = [];
      for (const pat of patList) {
        try {
          const full = await patientApi.getById(pat.id);
          enrichedPats.push(full);
        } catch (e) {
          enrichedPats.push(pat);
        }
      }
      setPatients(enrichedPats);

    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary, fontWeight: '500' }}>Loading user credentials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Login Credential Report</Text>
        <Text style={styles.headerSub}>All registered users with their login access</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'doctors' && styles.tabActive]}
          onPress={() => setActiveTab('doctors')}
        >
          <Text style={[styles.tabText, activeTab === 'doctors' && styles.tabTextActive]}>
            Doctors ({doctors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patients' && styles.tabActive]}
          onPress={() => setActiveTab('patients')}
        >
          <Text style={[styles.tabText, activeTab === 'patients' && styles.tabTextActive]}>
            Patients ({patients.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} />}
      >
        <View style={styles.tableHeader}>
          <Text style={[styles.col, styles.colNo]}>#</Text>
          <Text style={[styles.col, styles.colName]}>Name</Text>
          <Text style={[styles.col, styles.colUser]}>Username</Text>
          <Text style={[styles.col, styles.colPass]}>Password</Text>
          <Text style={[styles.col, styles.colRole]}>Access</Text>
        </View>

        {activeTab === 'doctors' ? (
          doctors.length === 0 ? (
            <Text style={styles.empty}>No doctors registered</Text>
          ) : (
            doctors.map((doc, i) => (
              <View key={doc.id || i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.col, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.col, styles.colName]}>Dr. {doc.name || '-'}</Text>
                <Text style={[styles.col, styles.colUser]}>{doc.tempUsername || doc.email || doc.user?.username || '-'}</Text>
                <Text style={[styles.col, styles.colPass]}>{doc.tempPassword || 'Set on create'}</Text>
                <Text style={[styles.col, styles.colRole, { color: doc.isActive ? colors.success : colors.warning }]}>
                  {doc.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            ))
          )
        ) : (
          patients.length === 0 ? (
            <Text style={styles.empty}>No patients registered</Text>
          ) : (
            patients.map((pat, i) => (
              <View key={pat.id || i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.col, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.col, styles.colName]}>{pat.name || '-'}</Text>
                <Text style={[styles.col, styles.colUser]}>{pat.tempUsername || pat.user?.username || pat.phone || '-'}</Text>
                <Text style={[styles.col, styles.colPass]}>{pat.tempPassword || 'Set on create'}</Text>
                <Text style={[styles.col, styles.colRole, { color: pat.archived ? colors.textMuted : colors.success }]}>
                  {pat.archived ? 'Archived' : 'Active'}
                </Text>
              </View>
            ))
          )
        )}

        <View style={styles.formatCard}>
          <Text style={styles.formatTitle}>🔐 Standard Credential Format</Text>
          <View style={styles.formatRow}>
            <Text style={styles.formatRole}>Doctors</Text>
            <Text style={styles.formatExample}>doctor.john.smith</Text>
          </View>
          <View style={styles.formatRow}>
            <Text style={styles.formatRole}>Patients</Text>
            <Text style={styles.formatExample}>patient.jane.doe</Text>
          </View>
          <View style={styles.formatRow}>
            <Text style={styles.formatRole}>Staff</Text>
            <Text style={styles.formatExample}>staff.sarah.jones</Text>
          </View>
          <Text style={styles.formatNote}>Default Password: <Text style={{ fontWeight: '800' }}>Clinic@123</Text> (change on first login)</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ℹ️ About Credentials</Text>
          <Text style={styles.noteText}>
            • Username format: role.firstname.lastname (all lowercase).
          </Text>
          <Text style={styles.noteText}>
            • Password shown here is auto-generated by the system.
          </Text>
          <Text style={styles.noteText}>
            • Users must change password after first login for security.
          </Text>
          <Text style={styles.noteText}>
            • If password shows "Set on create", it was only available at creation time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#FFFFFFAA', marginTop: 4 },
  tabRow: { flexDirection: 'row', margin: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: colors.primary + '10',
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: colors.bg },
  col: { fontSize: 12, fontWeight: '600', color: colors.text },
  colNo: { width: 30, fontWeight: '700', color: colors.textMuted },
  colName: { flex: 2, fontWeight: '700' },
  colUser: { flex: 2 },
  colPass: { flex: 2 },
  colRole: { flex: 1, textAlign: 'right', fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: 40, fontSize: 14 },
  formatCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  formatTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  formatRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  formatRole: { fontSize: 12, fontWeight: '700', color: colors.text },
  formatExample: { fontSize: 12, fontWeight: '600', color: colors.primaryLight, fontFamily: 'monospace' },
  formatNote: { fontSize: 11, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
  noteCard: {
    backgroundColor: colors.infoLight, borderRadius: 12, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: colors.info + '20',
  },
  noteTitle: { fontSize: 14, fontWeight: '700', color: colors.info, marginBottom: 8 },
  noteText: { fontSize: 11, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
});
