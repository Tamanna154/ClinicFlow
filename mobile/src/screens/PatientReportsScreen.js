import React, { useState, useCallback } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { patientApi } from '../api/patientApi';
import { colors, borderRadius, shadows } from '../theme';

export default function PatientReportsScreen({ navigation }) {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (isRefresh = false) => {
    if (!user?.patientId) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await patientApi.getVisits(user.patientId);
      setVisits(data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchReports(); }, [user?.patientId]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>My Medical Reports</Text>
        <Text style={styles.headerSub}>{visits.length} visit{visits.length !== 1 ? 's' : ''} on record</Text>
      </View>

      <FlatList
        data={visits}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => {
          const visitDate = item.visitDate ? new Date(item.visitDate) : null;
          const dateStr = visitDate
            ? visitDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
            : '—';
          const timeStr = visitDate
            ? visitDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={[styles.visitBadge, { backgroundColor: colors.primary + '12' }]}>
                  <Text style={styles.visitBadgeText}>#{visits.length - index}</Text>
                </View>
                <View style={styles.reportMeta}>
                  <Text style={styles.visitDate}>{dateStr}</Text>
                  {timeStr ? <Text style={styles.visitTime}>{timeStr}</Text> : null}
                </View>
                {item.doctorName && (
                  <Text style={styles.doctorLabel}>Dr. {item.doctorName}</Text>
                )}
              </View>

              {item.diagnosis ? (
                <View style={styles.reportSection}>
                  <Text style={styles.reportSectionLabel}>Diagnosis</Text>
                  <Text style={styles.reportSectionText}>{item.diagnosis}</Text>
                </View>
              ) : null}

              {item.prescription ? (
                <View style={styles.reportSection}>
                  <Text style={styles.reportSectionLabel}>Prescription</Text>
                  <Text style={styles.reportSectionText}>{item.prescription}</Text>
                </View>
              ) : null}

              {item.additionalNotes ? (
                <View style={[styles.reportSection, styles.reportSectionLast]}>
                  <Text style={styles.reportSectionLabel}>Notes</Text>
                  <Text style={styles.reportSectionText}>{item.additionalNotes}</Text>
                </View>
              ) : null}

              {!item.diagnosis && !item.prescription && !item.additionalNotes && (
                <Text style={styles.noDataText}>No medical records for this visit</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>R</Text></View>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptySub}>Your medical reports and prescriptions will appear here after your visits</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)}
            tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={visits.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  headerSection: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  listContent: { paddingVertical: 8, paddingBottom: 32 },
  reportCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginHorizontal: 16, marginVertical: 5, borderWidth: 1, borderColor: colors.borderLight,
    ...shadows.sm, borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  visitBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  visitBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  reportMeta: { flex: 1 },
  visitDate: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  visitTime: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginTop: 1 },
  doctorLabel: { fontSize: 12, fontWeight: '600', color: colors.primaryLight },
  reportSection: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reportSectionLast: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  reportSectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  reportSectionText: { fontSize: 14, fontWeight: '500', color: colors.text, lineHeight: 20 },
  noDataText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
