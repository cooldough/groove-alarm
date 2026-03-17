import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { X, Clock, Upload, Lock, ChevronDown } from 'lucide-react-native';

import Badge from './Badge';
import { AlarmConfig } from '../lib/store';
import {
  ALARM_SOUNDS as ALARM_SOUND_OPTIONS,
  DANCE_SOUNDS as DANCE_SOUND_OPTIONS,
  getDefaultAlarmSoundId,
  getDefaultDanceSoundId,
} from '../lib/sounds';

interface CreateAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarm: Omit<AlarmConfig, 'id' | 'notificationIds'>) => void;
  editingAlarm: AlarmConfig | null;
  isPremium: boolean;
}

const DAYS_LABEL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_MAP = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 ... Sun=0

const ALARM_SOUNDS = ALARM_SOUND_OPTIONS.map((s) => ({
  id: s.id,
  name: s.label,
  premium: s.isPro,
}));

const DANCE_SOUNDS = DANCE_SOUND_OPTIONS.map((s) => ({
  id: s.id,
  name: s.label,
  premium: s.isPro,
}));

const DURATIONS = [
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 180, label: '3 minutes' },
];

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0-59

interface WheelPickerProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  width?: number;
}

function WheelPicker({ data, selectedValue, onValueChange, formatValue, width = 80 }: WheelPickerProps) {
  const flatListRef = useRef<FlatList>(null);
  const isScrollingRef = useRef(false);

  const selectedIndex = data.indexOf(selectedValue);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0 && !isScrollingRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    isScrollingRef.current = false;
    if (data[clampedIndex] !== selectedValue) {
      onValueChange(data[clampedIndex]);
    }
  }, [data, selectedValue, onValueChange]);

  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  const renderItem = useCallback(({ item, index }: { item: number; index: number }) => {
    const isSelected = item === selectedValue;
    return (
      <View style={[pickerStyles.item, { height: ITEM_HEIGHT, width }]}>
        <Text style={[
          pickerStyles.itemText,
          isSelected && pickerStyles.itemTextSelected,
        ]}>
          {formatValue ? formatValue(item) : item.toString()}
        </Text>
      </View>
    );
  }, [selectedValue, formatValue, width]);

  return (
    <View style={[pickerStyles.container, { height: PICKER_HEIGHT, width }]}>
      {/* Selection highlight */}
      <View style={pickerStyles.selectionHighlight} pointerEvents="none" />

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT, // one blank slot above
          paddingBottom: ITEM_HEIGHT, // one blank slot below
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        bounces={false}
      />
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT, // middle slot
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255, 0, 255, 0.15)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FF00FF',
    borderRadius: 8,
    zIndex: 1,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 28,
    fontFamily: 'Orbitron',
    color: '#555',
  },
  itemTextSelected: {
    color: '#FFFFFE',
    fontSize: 32,
  },
});

export default function CreateAlarmModal({
  visible,
  onClose,
  onSave,
  editingAlarm,
  isPremium,
}: CreateAlarmModalProps) {
  const [hours, setHours] = useState(7);
  const [mins, setMins] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [duration, setDuration] = useState(15);
  const [isOneTime, setIsOneTime] = useState(true);
  const [soundTab, setSoundTab] = useState<'alarm' | 'dance'>('alarm');
  const [alarmSound, setAlarmSound] = useState(getDefaultAlarmSoundId());
  const [danceSound, setDanceSound] = useState(getDefaultDanceSoundId());
  const [showAlarmDropdown, setShowAlarmDropdown] = useState(false);
  const [showDanceDropdown, setShowDanceDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  useEffect(() => {
    if (editingAlarm) {
      const [h24, m] = editingAlarm.time.split(':').map(Number);
      const pm = h24 >= 12;
      const h12 = h24 % 12 || 12;
      setHours(h12);
      setMins(m);
      setIsPM(pm);
      setLabel(editingAlarm.label);
      setSelectedDays(editingAlarm.days);
      setDuration(editingAlarm.duration);
      setIsOneTime(editingAlarm.isOneTime);
      setAlarmSound(editingAlarm.alarmSoundId || getDefaultAlarmSoundId());
      setDanceSound(editingAlarm.danceSoundId || getDefaultDanceSoundId());
    } else {
      resetForm();
    }
  }, [editingAlarm, visible]);

  const resetForm = () => {
    setHours(7);
    setMins(0);
    setIsPM(false);
    setLabel('');
    setSelectedDays([]);
    setDuration(15);
    setIsOneTime(true);
    setAlarmSound(getDefaultAlarmSoundId());
    setDanceSound(getDefaultDanceSoundId());
    setSoundTab('alarm');
    setShowAlarmDropdown(false);
    setShowDanceDropdown(false);
    setShowDurationDropdown(false);
  };

  const toggleDay = (day: number) => {
    if (!isPremium) return;
    if (selectedDays.includes(day)) {
      const newDays = selectedDays.filter((d) => d !== day);
      setSelectedDays(newDays);
      if (newDays.length === 0) setIsOneTime(true);
    } else {
      setSelectedDays([...selectedDays, day]);
      setIsOneTime(false);
    }
  };

  const handleSave = () => {
    // Convert 12h to 24h
    let h24 = hours;
    if (isPM && hours !== 12) h24 = hours + 12;
    if (!isPM && hours === 12) h24 = 0;

    const time = `${h24.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    onSave({
      time,
      label: label || 'Alarm',
      isActive: true,
      days: isOneTime ? [] : selectedDays,
      duration: isPremium ? duration : 15,
      isOneTime: !isPremium || isOneTime || selectedDays.length === 0,
      alarmSoundId: alarmSound,
      danceSoundId: danceSound,
    });
  };

  const selectedAlarmSound = ALARM_SOUNDS.find((s) => s.id === alarmSound);
  const selectedDanceSound = DANCE_SOUNDS.find((s) => s.id === danceSound);
  const selectedDuration = DURATIONS.find((d) => d.value === duration);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingAlarm ? 'EDIT ALARM' : 'NEW ALARM'}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              testID="button-close-modal"
            >
              <X size={24} color="#A0A0B0" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Time Picker Wheels */}
            <View style={styles.timePickerContainer}>
              <WheelPicker
                data={HOURS}
                selectedValue={hours}
                onValueChange={setHours}
                formatValue={(v) => v.toString().padStart(2, '0')}
                width={80}
              />

              <Text style={styles.timeSeparator}>:</Text>

              <WheelPicker
                data={MINUTES}
                selectedValue={mins}
                onValueChange={setMins}
                formatValue={(v) => v.toString().padStart(2, '0')}
                width={80}
              />

              {/* AM/PM toggle */}
              <View style={styles.ampmContainer}>
                <TouchableOpacity
                  style={[styles.ampmButton, !isPM && styles.ampmButtonActive]}
                  onPress={() => setIsPM(false)}
                >
                  <Text style={[styles.ampmText, !isPM && styles.ampmTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmButton, isPM && styles.ampmButtonActive]}
                  onPress={() => setIsPM(true)}
                >
                  <Text style={[styles.ampmText, isPM && styles.ampmTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Label */}
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

            {/* Sounds */}
            <View style={styles.field}>
              <Text style={styles.fieldLabelIcon}>Sounds</Text>

              <View style={styles.soundTabs}>
                <TouchableOpacity
                  style={[styles.soundTab, soundTab === 'alarm' && styles.soundTabActive]}
                  onPress={() => setSoundTab('alarm')}
                >
                  <Text
                    style={[styles.soundTabText, soundTab === 'alarm' && styles.soundTabTextActive]}
                  >
                    ALARM SOUND
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.soundTab, soundTab === 'dance' && styles.soundTabActive]}
                  onPress={() => setSoundTab('dance')}
                >
                  <Text
                    style={[styles.soundTabText, soundTab === 'dance' && styles.soundTabTextActive]}
                  >
                    DANCE SOUND
                  </Text>
                </TouchableOpacity>
              </View>

              {soundTab === 'alarm' ? (
                <View>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowAlarmDropdown(!showAlarmDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedAlarmSound?.name}
                    </Text>
                    <ChevronDown size={18} color="#A0A0B0" />
                  </TouchableOpacity>

                  {showAlarmDropdown && (
                    <View style={styles.dropdownList}>
                      {ALARM_SOUNDS.map((sound) => (
                        <TouchableOpacity
                          key={sound.id}
                          style={[
                            styles.dropdownItem,
                            alarmSound === sound.id && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            if (sound.premium && !isPremium) return;
                            setAlarmSound(sound.id);
                            setShowAlarmDropdown(false);
                          }}
                        >
                          <View style={styles.dropdownItemRow}>
                            {alarmSound === sound.id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                            <Text style={styles.dropdownItemText}>
                              {sound.name}
                            </Text>
                            {sound.premium && (
                              <Badge text="PRO" variant="primary" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={styles.uploadButton}>
                    <Upload size={16} color="#00FFFF" />
                    <Text style={styles.uploadText}>Upload Custom Alarm</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowDanceDropdown(!showDanceDropdown)}
                  >
                    <View style={styles.dropdownItemRow}>
                      <Text style={styles.dropdownText}>
                        {selectedDanceSound?.name}
                      </Text>
                      {selectedDanceSound?.premium && (
                        <Badge text="PRO" variant="primary" />
                      )}
                    </View>
                    <ChevronDown size={18} color="#A0A0B0" />
                  </TouchableOpacity>

                  {showDanceDropdown && (
                    <View style={styles.dropdownList}>
                      {DANCE_SOUNDS.map((sound) => (
                        <TouchableOpacity
                          key={sound.id}
                          style={[
                            styles.dropdownItem,
                            danceSound === sound.id && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            if (sound.premium && !isPremium) return;
                            setDanceSound(sound.id);
                            setShowDanceDropdown(false);
                          }}
                        >
                          <View style={styles.dropdownItemRow}>
                            {danceSound === sound.id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                            <Text style={styles.dropdownItemText}>
                              {sound.name}
                            </Text>
                            {sound.premium && (
                              <Badge text="PRO" variant="primary" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Dance Duration */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Clock size={14} color="#FFFFFE" />
                <Text style={styles.fieldLabel}>Dance Duration</Text>
              </View>

              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDurationDropdown(!showDurationDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {selectedDuration?.label || '30 seconds'}
                </Text>
                <ChevronDown size={18} color="#A0A0B0" />
              </TouchableOpacity>

              {showDurationDropdown && (
                <View style={styles.dropdownList}>
                  {DURATIONS.map((d) => {
                    const locked = !isPremium && d.value > 30;
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[
                          styles.dropdownItem,
                          duration === d.value && styles.dropdownItemActive,
                          locked && styles.dropdownItemLocked,
                        ]}
                        onPress={() => {
                          if (locked) return;
                          setDuration(d.value);
                          setShowDurationDropdown(false);
                        }}
                      >
                        <View style={styles.dropdownItemRow}>
                          {duration === d.value && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                          <Text style={styles.dropdownItemText}>
                            {d.label}
                          </Text>
                          {locked && <Lock size={14} color="#A0A0B0" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Repeat */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Repeat</Text>
              <View style={styles.daysRow}>
                {DAYS_LABEL.map((dayLabel, index) => {
                  const dayValue = DAYS_MAP[index];
                  const selected = selectedDays.includes(dayValue);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCircle,
                        selected && styles.dayCircleActive,
                        !isPremium && styles.dayCircleLocked,
                      ]}
                      onPress={() => toggleDay(dayValue)}
                      testID={`button-day-${index}`}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.dayTextActive,
                        ]}
                      >
                        {dayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!isPremium && (
                <Text style={styles.proHint}>
                  Upgrade to Pro for repeating alarms
                </Text>
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="button-save"
            >
              <Text style={styles.saveButtonText}>SAVE ALARM</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A50',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Time picker
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  timeSeparator: {
    fontSize: 36,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    marginHorizontal: 4,
  },
  ampmContainer: {
    marginLeft: 12,
    gap: 8,
  },
  ampmButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0F0E17',
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  ampmButtonActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderColor: '#FF00FF',
  },
  ampmText: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    letterSpacing: 1,
  },
  ampmTextActive: {
    color: '#FF00FF',
  },

  // Fields
  field: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#FF00FF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  fieldLabelIcon: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    marginBottom: 12,
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

  // Sound tabs
  soundTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 0,
  },
  soundTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3A3A50',
  },
  soundTabActive: {
    borderBottomColor: '#FF00FF',
  },
  soundTabText: {
    fontSize: 11,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    letterSpacing: 0.5,
  },
  soundTabTextActive: {
    color: '#FFFFFE',
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Rajdhani',
    color: '#FFFFFE',
  },
  dropdownList: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#3A3A50',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A50',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  dropdownItemLocked: {
    opacity: 0.5,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'Rajdhani',
    color: '#FFFFFE',
  },
  checkmark: {
    fontSize: 16,
    color: '#FF00FF',
    fontFamily: 'Rajdhani-Bold',
  },

  // Upload
  uploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FFFF',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#00FFFF',
  },

  // Days
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  dayCircleActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderColor: '#FF00FF',
  },
  dayCircleLocked: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
  },
  dayTextActive: {
    color: '#FF00FF',
  },
  proHint: {
    fontSize: 12,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A50',
  },
  saveButton: {
    backgroundColor: '#FF00FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    letterSpacing: 2,
  },
});
