import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePermission } from '../hooks/usePermission';
import { colors, borderRadius, shadows } from '../theme';

export default function SupplierListScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // null means adding
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermission();
  const canManage = hasPermission('MANAGE_INVENTORY');

  const fetchSuppliers = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const base = require('../api/apiBase').getApiBase();
      const res = await require('../api/client').authFetch(`${base}/suppliers`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      } else {
        Alert.alert('Error', 'Failed to fetch suppliers.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSuppliers();
    }, [])
  );

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      status: 'ACTIVE',
    });
    setErrors({});
    setModalVisible(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      gstNumber: supplier.gstNumber || '',
      status: supplier.status || 'ACTIVE',
    });
    setErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Supplier name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email.trim())) errs.email = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const base = require('../api/apiBase').getApiBase();
      const url = editingSupplier 
        ? `${base}/suppliers/${editingSupplier.id}` 
        : `${base}/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await require('../api/client').authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        Alert.alert('Success', editingSupplier ? 'Supplier updated!' : 'Supplier added!');
        setModalVisible(false);
        fetchSuppliers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to save supplier details.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (supplier) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const base = require('../api/apiBase').getApiBase();
              const res = await require('../api/client').authFetch(`${base}/suppliers/${supplier.id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                Alert.alert('Success', 'Supplier deleted!');
                fetchSuppliers();
              } else {
                Alert.alert('Error', 'Could not delete supplier.');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete supplier.');
            }
          },
        },
      ]
    );
  };

  const filtered = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading suppliers...</Text>
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
            placeholder="Search suppliers..."
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
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerInfo}>
                <Text style={styles.supplierName}>{item.name}</Text>
                {item.contactPerson ? (
                  <Text style={styles.contactPerson}>Contact: {item.contactPerson}</Text>
                ) : null}
              </View>
              <View style={[
                styles.statusBadge, 
                item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText, 
                  item.status === 'ACTIVE' ? styles.statusActiveText : styles.statusInactiveText
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              {item.phone ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{item.phone}</Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{item.email}</Text>
                </View>
              ) : null}
              {item.gstNumber ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GSTIN:</Text>
                  <Text style={styles.detailValue}>{item.gstNumber}</Text>
                </View>
              ) : null}
              {item.address ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{item.address}</Text>
                </View>
              ) : null}
            </View>

            {canManage && (
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.editBtn]} 
                  onPress={() => handleOpenEditModal(item)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.deleteBtn]} 
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{searchQuery ? 'No results' : 'No suppliers'}</Text>
            <Text style={styles.emptySub}>{searchQuery ? 'Try another search query' : 'Tap + to register a supplier'}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchSuppliers(true)} 
            tintColor={colors.primary} 
            colors={[colors.primary]} 
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      {canManage && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Supplier Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Text>

            <ScrollView contentContainerStyle={styles.modalFormScroll}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Supplier Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={form.name}
                  onChangeText={(v) => {
                    setForm({ ...form, name: v });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="e.g. Acme Pharmaceuticals"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  value={form.contactPerson}
                  onChangeText={(v) => setForm({ ...form, contactPerson: v })}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(v) => setForm({ ...form, phone: v })}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={form.email}
                  onChangeText={(v) => {
                    setForm({ ...form, email: v });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="e.g. info@acme.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>GST Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.gstNumber}
                  onChangeText={(v) => setForm({ ...form, gstNumber: v })}
                  placeholder="GSTIN/Tax ID"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={form.address}
                  onChangeText={(v) => setForm({ ...form, address: v })}
                  placeholder="Full business address..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {editingSupplier && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    {['ACTIVE', 'INACTIVE'].map((statusOption) => {
                      const isSel = form.status === statusOption;
                      return (
                        <TouchableOpacity
                          key={statusOption}
                          style={[styles.toggleBtn, isSel && styles.toggleBtnActive]}
                          onPress={() => setForm({ ...form, status: statusOption })}
                        >
                          <Text style={[styles.toggleBtnText, isSel && styles.toggleBtnTextActive]}>
                            {statusOption}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalBtn} 
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveModalBtn, saving && { opacity: 0.6 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  searchSection: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, height: 42 },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, height: '100%', fontWeight: '500' },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 12, color: colors.textMuted, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.textSecondary, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerInfo: { flex: 1, marginRight: 12 },
  supplierName: { fontSize: 15, fontWeight: '800', color: colors.text },
  contactPerson: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '550' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusActive: { backgroundColor: colors.successLight },
  statusInactive: { backgroundColor: colors.statusScheduledBg },
  statusText: { fontSize: 10, fontWeight: '850', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusActiveText: { color: colors.success },
  statusInactiveText: { color: colors.statusScheduled },
  detailsContainer: { gap: 6, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { fontSize: 12, color: colors.textMuted, width: 70, fontWeight: '600' },
  detailValue: { fontSize: 12, color: colors.textSecondary, flex: 1, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: borderRadius.sm },
  editBtn: { backgroundColor: colors.primary + '10' },
  editBtnText: { color: colors.primary, fontSize: 12, fontWeight: '750' },
  deleteBtn: { backgroundColor: colors.errorLight },
  deleteBtnText: { color: colors.error, fontSize: 12, fontWeight: '750' },
  fab: { position: 'absolute', right: 16, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg, zIndex: 10 },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '300', marginTop: -2 },
  
  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11, 26, 43, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, width: '90%', maxHeight: '85%', borderWidth: 1, borderColor: colors.borderLight, ...shadows.lg },
  modalTitle: { fontSize: 16, fontWeight: '850', color: colors.text, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 10 },
  modalFormScroll: { paddingBottom: 10 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 60, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  statusToggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleBtnTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 14, marginTop: 10 },
  cancelModalBtn: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  cancelModalBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  saveModalBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: borderRadius.sm, minWidth: 80, alignItems: 'center' },
  saveModalBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
