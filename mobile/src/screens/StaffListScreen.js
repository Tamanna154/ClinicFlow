import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { staffApi } from '../api/staffApi';
import { colors, borderRadius, shadows } from '../theme';

export default function StaffListScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchStaff = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await staffApi.getMyStaff();
      setStaff(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const handleRemove = (item) => {
    Alert.alert('Remove Staff', `Remove ${item.staffName} from your staff?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { await staffApi.removeStaff(item.id); fetchStaff(); }
          catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={staff}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardTop} onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.7}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.staffName?.charAt(0)?.toUpperCase() || 'S'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.staffName}>{item.staffName}</Text>
                  <Text style={styles.staffRole}>{item.roleTitle || 'Staff'}</Text>
                  <Text style={styles.staffUsername}>@{item.staffUsername}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.detailsSection}>
                  <View style={styles.detailGrid}>
                    {item.phone && <DetailItem label="Phone" value={item.phone} />}
                    {item.age && <DetailItem label="Age" value={String(item.age)} />}
                    {item.email && <DetailItem label="Email" value={item.email} />}
                    {item.address && <DetailItem label="Address" value={item.address} />}
                    {item.aadharNumber && <DetailItem label="Aadhar" value={item.aadharNumber} />}
                    {item.panNumber && <DetailItem label="PAN" value={item.panNumber} />}
                    {item.bankAccountNo && <DetailItem label="Bank A/c" value={item.bankAccountNo} />}
                    {item.bankName && <DetailItem label="Bank Name" value={item.bankName} />}
                    {item.ifscCode && <DetailItem label="IFSC" value={item.ifscCode} />}
                    {item.emergencyContact && <DetailItem label="Emergency" value={item.emergencyContact} />}
                    {item.notes && <DetailItem label="Notes" value={item.notes} />}
                  </View>

                  <TouchableOpacity
                    style={styles.permissionsBtn}
                    onPress={() => navigation.navigate('PermissionsScreen', { staffId: item.id, staffName: item.staffName })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.permissionsBtnText}>
                      Manage Permissions ({item.permissions?.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)} activeOpacity={0.7}>
                    <Text style={styles.removeBtnText}>Remove Staff</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>S</Text></View>
            <Text style={styles.emptyTitle}>No staff yet</Text>
            <Text style={styles.emptySub}>Tap + to add a staff member with their details</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStaff(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={staff.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('StaffForm')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface, marginHorizontal: 16, marginVertical: 5,
    borderRadius: borderRadius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.primary },
  cardInfo: { flex: 1, marginLeft: 12 },
  staffName: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  staffRole: { fontSize: 12, fontWeight: '600', color: colors.primaryLight, marginTop: 1 },
  staffUsername: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  cardActions: { alignItems: 'center' },
  expandIcon: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  detailsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  detailGrid: { gap: 8 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 2, textAlign: 'right' },
  permissionsBtn: {
    marginTop: 12, backgroundColor: colors.primary + '08', borderRadius: borderRadius.md,
    paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '15',
  },
  permissionsBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  removeBtn: { marginTop: 8, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error + '20' },
  removeBtnText: { fontSize: 13, fontWeight: '700', color: colors.error },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
