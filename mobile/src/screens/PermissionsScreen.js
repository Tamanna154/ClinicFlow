import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { staffApi } from '../api/staffApi';
import { colors, borderRadius, shadows } from '../theme';

const PERMISSION_LABELS = {
  VIEW_PATIENTS: 'View Patients',
  MANAGE_PATIENTS: 'Manage Patients (Add/Edit)',
  VIEW_APPOINTMENTS: 'View Appointments',
  MANAGE_APPOINTMENTS: 'Manage Appointments (Book/Cancel)',
  VIEW_CALENDAR: 'View Calendar',
  MANAGE_CALENDAR: 'Manage Calendar',
  VIEW_DOCTORS: 'View Doctors',
  SEND_SMS: 'Send Bulk SMS',
  VIEW_REMINDERS: 'View Reminders',
  MANAGE_REMINDERS: 'Manage Reminders',
  MANAGE_PERMISSIONS: 'Manage Permissions',
  VIEW_INVENTORY: 'View Inventory',
  MANAGE_INVENTORY: 'Manage Inventory (Add/Edit/Adjust)',
};

const PERMISSION_GROUPS = [
  { title: 'Patients', perms: ['VIEW_PATIENTS', 'MANAGE_PATIENTS'] },
  { title: 'Appointments', perms: ['VIEW_APPOINTMENTS', 'MANAGE_APPOINTMENTS'] },
  { title: 'Calendar', perms: ['VIEW_CALENDAR', 'MANAGE_CALENDAR'] },
  { title: 'Other', perms: ['VIEW_DOCTORS', 'SEND_SMS', 'VIEW_REMINDERS', 'MANAGE_REMINDERS'] },
  { title: 'Inventory', perms: ['VIEW_INVENTORY', 'MANAGE_INVENTORY'] },
  { title: 'Admin', perms: ['MANAGE_PERMISSIONS'] },
];

export default function PermissionsScreen({ route, navigation }) {
  const { staffId, staffName } = route.params;
  const [allPermissions, setAllPermissions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [perms, current] = await Promise.all([
          staffApi.getAllPermissionsList(),
          staffApi.getPermissions(staffId),
        ]);
        setAllPermissions(perms);
        setSelected(new Set(current));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [staffId]);

  const toggle = (perm) => {
    const next = new Set(selected);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    setSelected(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await staffApi.updatePermissions(staffId, Array.from(selected));
      Alert.alert('Saved', 'Permissions updated successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading permissions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{staffName?.charAt(0)?.toUpperCase() || 'S'}</Text>
        </View>
        <Text style={styles.headerTitle}>{staffName}</Text>
        <Text style={styles.headerSub}>Toggle permissions to control what this staff member can access</Text>
      </View>

      {PERMISSION_GROUPS.map((group) => (
        <View key={group.title} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.perms.map((perm) => (
            <TouchableOpacity
              key={perm}
              style={[styles.permItem, selected.has(perm) && styles.permItemSelected]}
              onPress={() => toggle(perm)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selected.has(perm) && styles.checkboxSelected]}>
                {selected.has(perm) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.permLabel, selected.has(perm) && styles.permLabelSelected]}>
                {PERMISSION_LABELS[perm] || perm}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Permissions</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  headerCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: 20,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  groupCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  groupTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  permItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: borderRadius.sm, backgroundColor: colors.bg, marginBottom: 6,
  },
  permItemSelected: { backgroundColor: colors.primary + '06' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 12, color: '#FFFFFF', fontWeight: '800' },
  permLabel: { fontSize: 14, fontWeight: '500', color: colors.text, flex: 1 },
  permLabelSelected: { fontWeight: '700', color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...shadows.md,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
