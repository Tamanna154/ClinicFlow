import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { colors, borderRadius, shadows } from '../theme';

export function DatePickerModal({ visible, onClose, onSelect, value, minDate }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDateStr, setSelectedDateStr] = useState(value || '');

  useEffect(() => {
    if (value) {
      setSelectedDateStr(value);
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value, visible]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (direction) => {
    const nextDate = new Date(year, month + direction, 1);
    setCurrentDate(nextDate);
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const daysArray = [];
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handleSelectDay = (day) => {
    if (!day) return;
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    if (minDate && dateStr < minDate) {
      return;
    }

    onSelect(dateStr);
    onClose();
  };

  const renderDays = () => {
    return daysArray.map((day, index) => {
      if (day === null) {
        return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
      }

      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

      const isSelected = selectedDateStr === dateStr;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const isPast = minDate && dateStr < minDate;

      return (
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isToday && !isSelected && styles.dayCellToday
          ]}
          disabled={isPast}
          onPress={() => handleSelectDay(day)}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isToday && !isSelected && styles.dayTextToday,
              isPast && styles.dayTextDisabled
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{monthNames[month]} {year}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
              <Text key={i} style={styles.weekdayText}>{wd}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {renderDays()}
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.todayBtn} onPress={() => {
              const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
              const formattedDay = String(today.getDate()).padStart(2, '0');
              const dateStr = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
              onSelect(dateStr);
              onClose();
            }}>
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function TimePickerModal({ visible, onClose, onSelect, value }) {
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmpm, setSelectedAmpm] = useState('AM');

  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      if (hStr && mStr) {
        let hr = parseInt(hStr, 10);
        let ampm = 'AM';
        if (hr >= 12) {
          ampm = 'PM';
          if (hr > 12) hr -= 12;
        } else if (hr === 0) {
          hr = 12;
        }
        setSelectedHour(String(hr).padStart(2, '0'));
        setSelectedMinute(mStr);
        setSelectedAmpm(ampm);
      }
    }
  }, [value, visible]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const handleConfirm = () => {
    let hr = parseInt(selectedHour, 10);
    if (selectedAmpm === 'PM' && hr < 12) hr += 12;
    if (selectedAmpm === 'AM' && hr === 12) hr = 0;
    const timeStr = `${String(hr).padStart(2, '0')}:${selectedMinute}`;
    onSelect(timeStr);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { width: '85%' }]}>
          <Text style={styles.pickerTitle}>Select Time</Text>

          <View style={styles.pickerColumnsRow}>
            {/* Hours Column */}
            <View style={styles.pickerColumn}>
              <Text style={styles.columnLabel}>Hour</Text>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {hours.map((h) => {
                  const isSel = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.scrollItem, isSel && styles.scrollItemActive]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.scrollItemText, isSel && styles.scrollItemTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Minutes Column */}
            <View style={styles.pickerColumn}>
              <Text style={styles.columnLabel}>Min</Text>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {minutes.map((m) => {
                  const isSel = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.scrollItem, isSel && styles.scrollItemActive]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.scrollItemText, isSel && styles.scrollItemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* AM/PM Column */}
            <View style={[styles.pickerColumn, { flex: 0.8 }]}>
              <Text style={styles.columnLabel}>Period</Text>
              <View style={styles.ampmContainer}>
                {['AM', 'PM'].map((p) => {
                  const isSel = selectedAmpm === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.ampmBtn, isSel && styles.ampmBtnActive]}
                      onPress={() => setSelectedAmpm(p)}
                    >
                      <Text style={[styles.ampmBtnText, isSel && styles.ampmBtnTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 26, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.text,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
  },
  navBtnText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  todayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '10',
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '750',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pickerScroll: {
    width: '90%',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scrollItemActive: {
    backgroundColor: colors.primary,
  },
  scrollItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  scrollItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ampmContainer: {
    flex: 1,
    width: '90%',
    justifyContent: 'center',
    gap: 12,
  },
  ampmBtn: {
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  ampmBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ampmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ampmBtnTextActive: {
    color: '#FFFFFF',
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
