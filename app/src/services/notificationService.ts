import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface ReminderSchedule {
  hour: number;
  minute: number;
  weekdays: number[];
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

const ANDROID_CHANNEL_ID = 'reading-reminders';
const REMINDER_SOURCE = 'library-reminder';
const TEST_SOURCE = 'library-test';
const ALL_WEEKDAYS = 7;
const TEST_DELAY_SECONDS = 5;

const REMINDER_MESSAGES = [
  'Que tal dedicar alguns minutos à sua próxima leitura?',
  'Seu livro está esperando por você. Algumas páginas já fazem diferença.',
  'Um capítulo hoje mantém o hábito vivo amanhã.',
];

export const isNotificationSupported = (): boolean => Platform.OS !== 'web';

export const configureNotificationHandler = (): void => {
  if (!isNotificationSupported()) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

const ensureAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Lembretes de leitura',
    description: 'Lembretes para manter o hábito de leitura',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const toPermissionState = (
  status: Notifications.NotificationPermissionsStatus,
): PermissionState => {
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
};

export const getPermissionState = async (): Promise<PermissionState> => {
  if (!isNotificationSupported()) return 'denied';
  return toPermissionState(await Notifications.getPermissionsAsync());
};

export const requestPermission = async (): Promise<PermissionState> => {
  if (!isNotificationSupported()) return 'denied';
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  return toPermissionState(await Notifications.requestPermissionsAsync());
};

const pickMessage = (index: number): string => REMINDER_MESSAGES[index % REMINDER_MESSAGES.length];

const buildTriggers = (schedule: ReminderSchedule): Notifications.NotificationTriggerInput[] => {
  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {};
  const uniqueWeekdays = [...new Set(schedule.weekdays)].sort((a, b) => a - b);
  if (uniqueWeekdays.length === ALL_WEEKDAYS) {
    return [
      {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: schedule.hour,
        minute: schedule.minute,
        ...channel,
      },
    ];
  }
  return uniqueWeekdays.map((weekday) => ({
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: schedule.hour,
    minute: schedule.minute,
    ...channel,
  }));
};

export const getScheduledReminderIds = async (): Promise<string[]> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((request) => request.content.data?.source === REMINDER_SOURCE)
    .map((request) => request.identifier);
};

export const cancelReadingReminders = async (knownIds: string[] = []): Promise<void> => {
  if (!isNotificationSupported()) return;
  const scheduledIds = await getScheduledReminderIds();
  const ids = new Set([...knownIds, ...scheduledIds]);
  await Promise.all([...ids].map((id) => Notifications.cancelScheduledNotificationAsync(id)));
};

export const scheduleReadingReminders = async (
  schedule: ReminderSchedule,
  previousIds: string[] = [],
): Promise<string[]> => {
  if (schedule.weekdays.length === 0) throw new Error('Selecione ao menos um dia da semana.');
  await ensureAndroidChannel();
  await cancelReadingReminders(previousIds);
  const triggers = buildTriggers(schedule);
  return Promise.all(
    triggers.map((trigger, index) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora da leitura',
          body: pickMessage(index),
          data: { source: REMINDER_SOURCE },
        },
        trigger,
      }),
    ),
  );
};

export const isScheduleInSync = async (expectedIds: string[]): Promise<boolean> => {
  const scheduled = await getScheduledReminderIds();
  if (scheduled.length !== expectedIds.length) return false;
  const expected = new Set(expectedIds);
  return scheduled.every((id) => expected.has(id));
};

export const sendTestNotification = async (): Promise<string> => {
  await ensureAndroidChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de teste',
      body: REMINDER_MESSAGES[0],
      data: { source: TEST_SOURCE },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
};
