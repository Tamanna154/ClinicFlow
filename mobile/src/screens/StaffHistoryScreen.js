import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../api/client';
import { ensureApiConnected } from '../api/patientApi';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function StaffHistoryScreen() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const apiBase = await ensureApiConnected();
      const res = await authFetch(`${apiBase}/activities?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load activity history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchActivities(); }, []));

  const filtered = activities.filter(act => {
    const q = search.toLowerCase();
    const name = (act.userName || '').toLowerCase();
    const desc = (act.description || '').toLowerCase();
    const type = (act.activityType || '').toLowerCase();
    return name.includes(q) || desc.includes(q) || type.includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Staff name or description..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>{item.userName || 'System Action'}</Text>
              <View style={[styles.typeBadge, { backgroundColor: colors.info + '12' }]}>
                <Text style={[styles.typeText, { color: colors.info }]}>{item.activityType?.replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <Text style={styles.descText}>{item.description}</Text>
            {item.referenceType && (
              <Text style={styles.refText}>
                Reference: {item.referenceType} (ID: {item.referenceId})
              </Text>
            )}
            <Text style={styles.dateText}>🕒 {new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activities logged yet.</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchActivities(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  searchBarContainer: { padding: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  listContent: { paddingVertical: 10, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userName: { fontSize: 14, fontWeight: '800', color: colors.text },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  descText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  refText: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  dateText: { fontSize: 10, color: colors.textMuted, marginTop: 8, alignSelf: 'flex-end' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
