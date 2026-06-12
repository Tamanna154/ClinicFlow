import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator, Modal, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { staffApi } from '../api/staffApi';
import { doctorApi } from '../api/doctorApi';
import { colors, borderRadius, shadows } from '../theme';

const STAFF_TILES = [
  { key: 'DOCTOR', icon: '🩺', label: 'Doctors', color: '#3B82F6', bgColor: '#EFF6FF', isDoctor: true },
  { key: 'RECEPTIONIST', icon: '💁', label: 'Receptionist', roles: ['RECEPTIONIST'], color: '#8B5CF6', bgColor: '#F5F3FF' },
  { key: 'INVENTORY_MANAGER', icon: '📋', label: 'Inventory Manager', roles: ['INVENTORY_MANAGER'], color: '#EC4899', bgColor: '#FDF2F8' },
  { key: 'PHARMACIST', icon: '💊', label: 'Pharmacist', roles: ['PHARMACIST'], color: '#F59E0B', bgColor: '#FFFBEB' },
  { key: 'ACCOUNTANT', icon: '💰', label: 'Accountant', roles: ['ACCOUNTANT'], color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'LAB_TECHNICIAN', icon: '🔬', label: 'Lab Technician', roles: ['LAB_TECHNICIAN'], color: '#6366F1', bgColor: '#EEF2FF' },
  { key: 'OTHER', icon: '👥', label: 'Other Staff', roles: ['NURSE', 'CLEANER', 'OTHER'], color: '#6B7280', bgColor: '#F3F4F6' },
];

function getRoleColor(role) {
  const colors_map = {
    'RECEPTIONIST': '#8B5CF6', 'INVENTORY_MANAGER': '#EC4899',
    'PHARMACIST': '#F59E0B', 'ACCOUNTANT': '#10B981',
    'DOCTOR': '#3B82F6', 'NURSE': '#14B8A6', 'LAB_TECHNICIAN': '#6366F1',
    'CLEANER': '#F97316', 'OTHER': '#6B7280',
  };
  return colors_map[role] || '#6B7280';
}

export default function StaffOverviewScreen({ navigation }) {
  const [allStaff, setAllStaff] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [staff, doctors] = await Promise.all([
        staffApi.getMyStaff().catch(() => []),
        doctorApi.getAll().catch(() => []),
      ]);
      setAllStaff(staff);
      setAllDoctors(doctors);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const getStaffByRoles = (roles) => allStaff.filter(s => roles.includes(s.role));

  const handleTilePress = (tile) => {
    setSelectedTile(tile);
    setModalVisible(true);
  };

  const roleDetails = selectedTile
    ? selectedTile.isDoctor
      ? allDoctors
      : getStaffByRoles(selectedTile.roles)
    : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Overview</Text>
        <Text style={styles.headerSub}>{(allDoctors.length + allStaff.length)} team members</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allDoctors.length}</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allStaff.filter(s => s.role === 'RECEPTIONIST').length}</Text>
            <Text style={styles.statLabel}>Reception</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allStaff.filter(s => s.role === 'PHARMACIST').length}</Text>
            <Text style={styles.statLabel}>Pharmacy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allStaff.filter(s => s.role === 'ACCOUNTANT').length}</Text>
            <Text style={styles.statLabel}>Accounts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allStaff.filter(s => s.role === 'LAB_TECHNICIAN').length}</Text>
            <Text style={styles.statLabel}>Lab</Text>
          </View>
        </View>

        <Text style={styles.gridTitle}>Departments</Text>
        {STAFF_TILES.map((tile) => {
          const count = tile.isDoctor
            ? allDoctors.length
            : getStaffByRoles(tile.roles).length;
          return (
            <TouchableOpacity
              key={tile.key}
              style={[styles.tile, { backgroundColor: tile.bgColor, borderLeftColor: tile.color }]}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: tile.color + '20' }]}>
                <Text style={styles.icon}>{tile.icon}</Text>
              </View>
              <View style={styles.tileInfo}>
                <Text style={styles.tileLabel}>{tile.label}</Text>
                <Text style={styles.tileCount}>{count} member{count !== 1 ? 's' : ''}</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: tile.color + '20' }]}>
                <Text style={[styles.countBadgeText, { color: tile.color }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('StaffList')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllBtnText}>View All Staff Details</Text>
          <Text style={styles.viewAllArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addStaffBtn}
          onPress={() => navigation.navigate('StaffForm')}
          activeOpacity={0.85}
        >
          <Text style={styles.addStaffIcon}>+</Text>
          <Text style={styles.addStaffText}>Add New Staff Member</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Role Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalIcon}>{selectedTile?.icon}</Text>
                <Text style={styles.modalTitle}>{selectedTile?.label}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{roleDetails.length} member{roleDetails.length !== 1 ? 's' : ''}</Text>

            <ScrollView style={styles.modalStaffList} showsVerticalScrollIndicator={false}>
              {roleDetails.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>👤</Text>
                  <Text style={styles.modalEmptyTitle}>No members in this category</Text>
                  <Text style={styles.modalEmptySub}>Add members to see them here</Text>
                </View>
              ) : (
                roleDetails.map((member) => {
                  if (selectedTile?.isDoctor) {
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.staffCard}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.getParent()?.navigate('Doctors', { screen: 'DoctorDetail', params: { doctor: member } });
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.staffAvatar, { backgroundColor: '#3B82F615' }]}>
                          <Text style={[styles.staffAvatarText, { color: '#3B82F6' }]}>
                            {member.name?.charAt(0)?.toUpperCase() || 'D'}
                          </Text>
                        </View>
                        <View style={styles.staffInfo}>
                          <Text style={styles.staffName}>Dr. {member.name}</Text>
                          <Text style={styles.staffRole}>{member.specialization || 'General'}</Text>
                          {member.phone && <Text style={styles.staffPhone}>📞 {member.phone}</Text>}
                          {member.email && <Text style={styles.staffPhone}>✉️ {member.email}</Text>}
                        </View>
                        <View style={[styles.activeDot, { backgroundColor: member.isActive ? colors.success : colors.textMuted }]} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.staffCard}
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('StaffForm', { staff: member });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.staffAvatar, { backgroundColor: getRoleColor(member.role) + '15' }]}>
                        <Text style={[styles.staffAvatarText, { color: getRoleColor(member.role) }]}>
                          {member.staffName?.charAt(0)?.toUpperCase() || 'S'}
                        </Text>
                      </View>
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{member.staffName}</Text>
                        <View style={styles.staffRoleRow}>
                          <View style={[styles.rolePill, { backgroundColor: getRoleColor(member.role) + '15' }]}>
                            <Text style={[styles.rolePillText, { color: getRoleColor(member.role) }]}>
                              {member.roleTitle || member.role}
                            </Text>
                          </View>
                        </View>
                        {member.phone && <Text style={styles.staffPhone}>📞 {member.phone}</Text>}
                        {member.dutyTime && <Text style={styles.staffDuty}>🕒 {member.dutyTime}</Text>}
                      </View>
                      <Text style={styles.staffArrow}>›</Text>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },

  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 8, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.borderLight, marginHorizontal: 2 },

  grid: { padding: 16, paddingBottom: 40 },
  gridTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, letterSpacing: -0.2 },

  tile: {
    borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 5, borderWidth: 1, borderColor: colors.borderLight,
    ...shadows.sm,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  tileInfo: { flex: 1 },
  tileLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  tileCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  countBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  countBadgeText: { fontSize: 12, fontWeight: '800' },

  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: colors.primary + '30', ...shadows.sm,
  },
  viewAllBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
  viewAllArrow: { fontSize: 18, color: colors.primary, fontWeight: '300' },

  addStaffBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent, borderRadius: 14, padding: 14, marginTop: 10, ...shadows.sm,
  },
  addStaffIcon: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginRight: 6 },
  addStaffText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay: { flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 20, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalIcon: { fontSize: 22 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  modalCloseX: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 12 },
  modalStaffList: { maxHeight: 400 },
  staffCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  staffAvatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  staffAvatarText: { fontSize: 18, fontWeight: '800' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: '700', color: colors.text },
  staffRole: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  staffRoleRow: { flexDirection: 'row', marginTop: 3 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 10, fontWeight: '700' },
  staffPhone: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  staffDuty: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  staffArrow: { fontSize: 18, color: colors.textMuted, fontWeight: '300' },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  modalEmpty: { alignItems: 'center', paddingVertical: 30 },
  modalEmptyIcon: { fontSize: 36, marginBottom: 10 },
  modalEmptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalEmptySub: { fontSize: 12, color: colors.textMuted },
});
