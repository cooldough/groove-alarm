import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Crown, Settings } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Button from '../components/Button';
import AlarmCard from '../components/AlarmCard';
import CreateAlarmModal from '../components/CreateAlarmModal';
import { useAppStore } from '../lib/store';
import { getAlarms, createAlarm, updateAlarm, deleteAlarm, Alarm } from '../lib/api';
import { scheduleAlarm, cancelAlarm } from '../lib/notifications';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { isPremium, activeAlarmId, setActiveAlarmId } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  const { data: alarms = [], isLoading, refetch } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
  });

  useEffect(() => {
    if (activeAlarmId) {
      const alarm = alarms.find((a) => a.id === activeAlarmId);
      if (alarm) {
        navigation.navigate('AlarmTrigger', {
          alarmId: alarm.id,
          duration: alarm.duration,
        });
        setActiveAlarmId(null);
      }
    }
  }, [activeAlarmId, alarms]);

  const createMutation = useMutation({
    mutationFn: createAlarm,
    onSuccess: async (newAlarm) => {
      if (newAlarm.isActive) {
        await scheduleAlarm(
          newAlarm.id,
          newAlarm.time,
          newAlarm.label,
          newAlarm.days,
          newAlarm.isOneTime
        );
      }
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alarm> }) =>
      updateAlarm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  const handleToggleAlarm = async (id: number, isActive: boolean) => {
    updateMutation.mutate({ id, data: { isActive } });
    
    const alarm = alarms.find((a) => a.id === id);
    if (alarm && isActive) {
      await scheduleAlarm(id, alarm.time, alarm.label, alarm.days, alarm.isOneTime);
    }
  };

  const handleEditAlarm = (alarm: Alarm) => {
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
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const handleSaveAlarm = (alarmData: Omit<Alarm, 'id'>) => {
    if (editingAlarm) {
      updateMutation.mutate({ id: editingAlarm.id, data: alarmData });
    } else {
      createMutation.mutate(alarmData);
    }
    setModalVisible(false);
    setEditingAlarm(null);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingAlarm(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GROOVE ALARM</Text>
          <Text style={styles.subtitle}>Your alarms</Text>
        </View>
        <View style={styles.headerButtons}>
          {!isPremium && (
            <TouchableOpacity
              style={styles.proButton}
              onPress={() => navigation.navigate('Paywall', {})}
              testID="button-upgrade"
            >
              <Crown size={20} color="#FF00FF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            testID="button-settings"
          >
            <Settings size={20} color="#A0A0B0" />
          </TouchableOpacity>
        </View>
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
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first dance alarm
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#FF00FF"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
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
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  proButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF00FF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF00FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
