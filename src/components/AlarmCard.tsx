import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { Trash2, Edit2 } from 'lucide-react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import Card from './Card';
import Badge from './Badge';
import { Alarm } from '../lib/api';

interface AlarmCardProps {
  alarm: Alarm;
  isPremium: boolean;
  onToggle: (id: number, isActive: boolean) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: number) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AlarmCard({
  alarm,
  isPremium,
  onToggle,
  onEdit,
  onDelete,
}: AlarmCardProps) {
  const handleToggle = (value: boolean) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onToggle(alarm.id, value);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return { time: `${displayHours}:${minutes.toString().padStart(2, '0')}`, period };
  };

  const { time, period } = formatTime(alarm.time);

  return (
    <Card
      testID={`card-alarm-${alarm.id}`}
      style={{ marginBottom: 12, opacity: alarm.isActive ? 1 : 0.6 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 48,
                fontFamily: 'Orbitron',
                color: alarm.isActive ? '#FF00FF' : '#A0A0B0',
              }}
            >
              {time}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Rajdhani',
                color: '#A0A0B0',
                marginLeft: 8,
              }}
            >
              {period}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Rajdhani',
              color: '#FFFFFE',
              marginBottom: 8,
            }}
          >
            {alarm.label || 'Alarm'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {alarm.isOneTime ? (
              <Badge text="One-time" variant="muted" />
            ) : (
              alarm.days.map((day) => (
                <Badge key={day} text={DAYS[day]} variant="muted" />
              ))
            )}
            <Badge text={`${alarm.duration}s dance`} variant="accent" />
            {!isPremium && alarm.duration > 30 && (
              <Badge text="PRO" variant="primary" />
            )}
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 12 }}>
          <Switch
            testID={`switch-alarm-${alarm.id}`}
            value={alarm.isActive}
            onValueChange={handleToggle}
            trackColor={{ false: '#3A3A50', true: '#FF00FF' }}
            thumbColor="#FFFFFF"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              testID={`button-edit-alarm-${alarm.id}`}
              onPress={() => onEdit(alarm)}
            >
              <Edit2 size={20} color="#A0A0B0" />
            </TouchableOpacity>
            <TouchableOpacity
              testID={`button-delete-alarm-${alarm.id}`}
              onPress={() => onDelete(alarm.id)}
            >
              <Trash2 size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );
}
