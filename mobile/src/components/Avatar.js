import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

const AVATAR_COLORS = [
  ['#0D5E6E', '#1A8A9E'],
  ['#E8634A', '#FF7B62'],
  ['#059669', '#34D399'],
  ['#0284C7', '#38BDF8'],
  ['#D97706', '#FBBF24'],
  ['#7C3AED', '#A78BFA'],
  ['#DB2777', '#F472B6'],
  ['#6B7280', '#9CA3AF'],
];

function getColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getNameInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Avatar({ name, size = 44, style }) {
  const [bgColor] = getColor(name);
  const initials = getNameInitials(name);

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 4,
      backgroundColor: bgColor,
      justifyContent: 'center', alignItems: 'center',
    }, style]}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: '#FFFFFF' }}>
        {initials}
      </Text>
    </View>
  );
}

export function StatusDot({ color, size = 10 }) {
  return (
    <View style={{
      position: 'absolute', bottom: -1, right: -1,
      width: size + 3, height: size + 3, borderRadius: (size + 3) / 2,
      backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color || colors.success }} />
    </View>
  );
}
