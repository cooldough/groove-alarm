import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Gift } from 'lucide-react-native';

import AlarmCard from '../components/AlarmCard';
import CreateAlarmModal from '../components/CreateAlarmModal';
import { useAppStore, AlarmConfig } from '../lib/store';
import { scheduleAlarm, cancelAlarm } from '../lib/notifications';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    isPremium,
    activeAlarmId,
    setActiveAlarmId,
    alarms,
    addAlarm,
    updateAlarm,
    deleteAlarm,
  } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmConfig | null>(null);

  useEffect(() => {
    if (activeAlarmId) {
      const alarm = alarms.find((a) => a.id === activeAlarmId);
      if (alarm) {
        navigation.navigate('AlarmTrigger', {
          alarmId: alarm.id,
          duration: alarm.duration,
          isTestAlarm: false,
        });
        setActiveAlarmId(null);
      }
    }
  }, [activeAlarmId, alarms]);

  const handleToggleAlarm = async (id: number, isActive: boolean) => {
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return;

    if (isActive) {
      const notifIds = await scheduleAlarm(
        id,
        alarm.time,
        alarm.label,
        alarm.days,
        alarm.isOneTime,
      );
      updateAlarm(id, { isActive: true, notificationIds: notifIds });
    } else {
      await cancelAlarm(alarm.notificationIds);
      updateAlarm(id, { isActive: false, notificationIds: [] });
    }
  };

  const handleEditAlarm = (alarm: AlarmConfig) => {
    setEditingAlarm(alarm);
    setModalVisible(true);
  };

  const handleDeleteAlarm = (id: number) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const alarm = alarms.find((a) => a.id === id);
            if (alarm) {
              await cancelAlarm(alarm.notificationIds);
            }
            deleteAlarm(id);
          },
        },
      ],
    );
  };

  const handleSaveAlarm = async (
    alarmData: Omit<AlarmConfig, 'id' | 'notificationIds'>,
  ) => {
    if (editingAlarm) {
      await cancelAlarm(editingAlarm.notificationIds);
      updateAlarm(editingAlarm.id, { ...alarmData, notificationIds: [] });

      if (alarmData.isActive) {
        const notifIds = await scheduleAlarm(
          editingAlarm.id,
          alarmData.time,
          alarmData.label,
          alarmData.days,
          alarmData.isOneTime,
        );
        updateAlarm(editingAlarm.id, { notificationIds: notifIds });
      }
    } else {
      const newAlarm = addAlarm(alarmData);

      if (alarmData.isActive) {
        const notifIds = await scheduleAlarm(
          newAlarm.id,
          alarmData.time,
          alarmData.label,
          alarmData.days,
          alarmData.isOneTime,
        );
        updateAlarm(newAlarm.id, { notificationIds: notifIds });
      }
    }
    setModalVisible(false);
    setEditingAlarm(null);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingAlarm(null);
  };

  const handleTestAlarm = () => {
    const lastAlarm = alarms.length > 0 ? alarms[alarms.length - 1] : null;
    navigation.navigate('AlarmTrigger', {
      alarmId: lastAlarm?.id || 0,
      duration: lastAlarm?.duration || 15,
      isTestAlarm: true,
    });
  };

  const handleAddAlarm = () => {
    if (!isPremium && alarms.length >= 1) {
      Alert.alert(
        'Free Tier Limit',
        'Free users can only set 1 alarm. Upgrade to Pro for unlimited alarms!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => navigation.navigate('Paywall', {}),
          },
        ],
      );
      return;
    }
    setEditingAlarm(null);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.titleLine1}>GROOVE</Text>
            <Text style={styles.titleLine2}>ALARM</Text>
          </View>
        </View>
        {!isPremium ? (
          <TouchableOpacity
            style={styles.proBadge}
            onPress={() => navigation.navigate('Paywall', {})}
            testID="button-upgrade"
          >
            <Gift size={14} color="#FFFFFE" />
            <Text style={styles.proBadgeText}>Pro</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.proBadgeActive}>
            <Gift size={14} color="#0F0E17" />
            <Text style={styles.proBadgeActiveText}>Pro</Text>
          </View>
        )}
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            isPremium={isPremium}
            onToggle={handleToggleAlarm}
            onEdit={handleEditAlarm}
            onDelete={handleDeleteAlarm}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Image
              source={require('../../assets/images/adaptive-icon.png')}
              style={styles.emptyLogo}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first dance alarm
            </Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.testAlarmButton}
          onPress={handleTestAlarm}
          testID="button-test-alarm"
        >
          <Text style={styles.testAlarmText}>Test Alarm</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddAlarm}
        testID="button-create-alarm"
      >
        <Plus size={32} color="#0F0E17" />
      </TouchableOpacity>

      <CreateAlarmModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveAlarm}
        editingAlarm={editingAlarm}
        isPremium={isPremium}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  emptyLogo: {
    width: 64,
    height: 64,
    opacity: 0.4,
    marginBottom: 8,
  },
  titleLine1: {
    fontSize: 22,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    lineHeight: 26,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  titleLine2: {
    fontSize: 22,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    lineHeight: 26,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF00FF',
  },
  proBadgeText: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
  },
  proBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00FFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  proBadgeActiveText: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#0F0E17',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  testAlarmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A50',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  testAlarmText: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00FFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
