import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { X } from 'lucide-react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import Button from './Button';
import Badge from './Badge';
import { Alarm } from '../lib/api';

interface CreateAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id'>) => void;
  editingAlarm: Alarm | null;
  isPremium: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATIONS = [15, 30, 60, 90, 120, 150, 180];

export default function CreateAlarmModal({
  visible,
  onClose,
  onSave,
  editingAlarm,
  isPremium,
}: CreateAlarmModalProps) {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [duration, setDuration] = useState(30);
  const [isOneTime, setIsOneTime] = useState(true);

  useEffect(() => {
    if (editingAlarm) {
      setTime(editingAlarm.time);
      setLabel(editingAlarm.label);
      setSelectedDays(editingAlarm.days);
      setDuration(editingAlarm.duration);
      setIsOneTime(editingAlarm.isOneTime);
    } else {
      resetForm();
    }
  }, [editingAlarm, visible]);

  const resetForm = () => {
    setTime('07:00');
    setLabel('');
    setSelectedDays([]);
    setDuration(15);
    setIsOneTime(true);
  };

  const toggleDay = (day: number) => {
    if (!isPremium) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      return;
    }

    ReactNativeHapticFeedback.trigger('impactLight');
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
      setIsOneTime(false);
    }
  };

  const selectDuration = (dur: number) => {
    if (!isPremium && dur > 15) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      return;
    }
    ReactNativeHapticFeedback.trigger('impactLight');
    setDuration(dur);
  };

  const handleSave = () => {
    onSave({
      time,
      label: label || 'Alarm',
      isActive: true,
      days: isOneTime ? [] : selectedDays,
      soundId: 1,
      danceSoundId: 2,
      customAlarmSound: null,
      customDanceSound: null,
      isSnoozeEnabled: false,
      duration: isPremium ? duration : 15,
      isOneTime: !isPremium || isOneTime || selectedDays.length === 0,
    });
  };

  const [hours, minutes] = time.split(':');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
            </Text>
            <TouchableOpacity onPress={onClose} testID="button-close-modal">
              <X size={24} color="#A0A0B0" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.timeText}
                  value={hours}
                  onChangeText={(h) => setTime(`${h.padStart(2, '0')}:${minutes}`)}
                  keyboardType="number-pad"
                  maxLength={2}
                  testID="input-hours"
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.timeText}
                  value={minutes}
                  onChangeText={(m) => setTime(`${hours}:${m.padStart(2, '0')}`)}
                  keyboardType="number-pad"
                  maxLength={2}
                  testID="input-minutes"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Label</Text>
              <TextInput
                style={styles.textInput}
                value={label}
                onChangeText={setLabel}
                placeholder="Morning Dance"
                placeholderTextColor="#A0A0B0"
                testID="input-label"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Repeat</Text>
                {!isPremium && <Badge text="PRO" variant="primary" />}
              </View>
              <View style={styles.daysContainer}>
                {DAYS.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(index) && styles.dayButtonActive,
                      !isPremium && styles.dayButtonDisabled,
                    ]}
                    onPress={() => toggleDay(index)}
                    testID={`button-day-${index}`}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedDays.includes(index) && styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!isPremium && (
                <Text style={styles.proHint}>
                  Upgrade to Pro to set repeating alarms
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Dance Duration</Text>
                {!isPremium && <Badge text="PRO" variant="primary" />}
              </View>
              <View style={styles.durationsContainer}>
                {DURATIONS.map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationButton,
                      duration === dur && styles.durationButtonActive,
                      !isPremium && dur > 15 && styles.durationButtonDisabled,
                    ]}
                    onPress={() => selectDuration(dur)}
                    testID={`button-duration-${dur}`}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        duration === dur && styles.durationTextActive,
                      ]}
                    >
                      {dur < 60 ? `${dur}s` : `${Math.floor(dur / 60)}m${dur % 60 ? `${dur % 60}s` : ''}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!isPremium && (
                <Text style={styles.proHint}>
                  Free: 15s only. Upgrade to Pro for longer durations
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              style={{ flex: 1 }}
              testID="button-cancel"
            />
            <Button
              title="Save"
              onPress={handleSave}
              style={{ flex: 1 }}
              testID="button-save"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0F0E17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A50',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
  },
  content: {
    padding: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  timeInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 48,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    marginHorizontal: 8,
  },
  field: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#FFFFFE',
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  dayButtonActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderColor: '#FF00FF',
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
  },
  dayTextActive: {
    color: '#FF00FF',
  },
  durationsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  durationButtonActive: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderColor: '#00FFFF',
  },
  durationButtonDisabled: {
    opacity: 0.5,
  },
  durationText: {
    fontSize: 16,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
  },
  durationTextActive: {
    color: '#00FFFF',
  },
  proHint: {
    fontSize: 12,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A50',
  },
});
