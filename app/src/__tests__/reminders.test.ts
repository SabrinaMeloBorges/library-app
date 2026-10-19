import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { scheduleReadingReminders } from '../services/notificationService';
import { STORAGE_KEYS } from '../services/preferencesStorage';
import {
  DEFAULT_REMINDER_SETTINGS,
  disableReminders,
  enableReminders,
  loadReminderSettings,
  reconcileReminders,
  updateReminderSchedule,
} from '../services/reminderService';

const notifications = Notifications as jest.Mocked<typeof Notifications>;

type ScheduledRequest = Awaited<
  ReturnType<typeof Notifications.getAllScheduledNotificationsAsync>
>[number];

const scheduled = (identifier: string, source: string): ScheduledRequest =>
  ({ identifier, content: { data: { source } }, trigger: null }) as unknown as ScheduledRequest;

let idCounter = 0;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  idCounter = 0;
  notifications.scheduleNotificationAsync.mockImplementation(async () => `id-${++idCounter}`);
  notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  notifications.getPermissionsAsync.mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as never);
});

describe('agendamento de lembretes', () => {
  it('usa um gatilho diário quando todos os dias estão selecionados', async () => {
    const ids = await scheduleReadingReminders({
      hour: 20,
      minute: 30,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    });
    expect(ids).toEqual(['id-1']);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ type: 'daily', hour: 20, minute: 30 }),
      }),
    );
  });

  it('cria um gatilho semanal por dia selecionado', async () => {
    const ids = await scheduleReadingReminders({ hour: 7, minute: 0, weekdays: [2, 4, 6] });
    expect(ids).toHaveLength(3);
    const weekdays = notifications.scheduleNotificationAsync.mock.calls.map(
      ([request]) => (request.trigger as { weekday: number }).weekday,
    );
    expect(weekdays).toEqual([2, 4, 6]);
  });

  it('cancela apenas lembretes do Library antes de reagendar', async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('old-library', 'library-reminder'),
      scheduled('other-app', 'other'),
    ]);
    await scheduleReadingReminders({ hour: 8, minute: 0, weekdays: [1] }, ['stored-id']);
    const cancelled = notifications.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id);
    expect(cancelled.sort()).toEqual(['old-library', 'stored-id']);
  });
});

describe('preferências de lembretes', () => {
  it('ativa, persiste e desativa os lembretes', async () => {
    const { settings, permission } = await enableReminders(DEFAULT_REMINDER_SETTINGS);
    expect(permission).toBe('granted');
    expect(settings).toMatchObject({ enabled: true, scheduledIds: ['id-1'] });
    expect(await loadReminderSettings()).toEqual(settings);

    const disabled = await disableReminders(settings);
    expect(disabled).toMatchObject({ enabled: false, scheduledIds: [] });
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-1');
    expect((await loadReminderSettings()).enabled).toBe(false);
  });

  it('não ativa sem permissão', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);
    const { settings, permission } = await enableReminders(DEFAULT_REMINDER_SETTINGS);
    expect(permission).toBe('denied');
    expect(settings.enabled).toBe(false);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('reagenda ao mudar o horário', async () => {
    const { settings } = await enableReminders(DEFAULT_REMINDER_SETTINGS);
    const updated = await updateReminderSchedule(settings, { hour: 6, minute: 45, weekdays: [2] });
    expect(updated).toMatchObject({ hour: 6, minute: 45, weekdays: [2], scheduledIds: ['id-2'] });
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-1');
  });

  it('reconcilia agendamentos ausentes ao iniciar e evita duplicar quando sincronizado', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.reminders,
      JSON.stringify({ ...DEFAULT_REMINDER_SETTINGS, enabled: true, scheduledIds: ['lost-id'] }),
    );
    const reconciled = await reconcileReminders();
    expect(reconciled.scheduledIds).toEqual(['id-1']);

    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('id-1', 'library-reminder'),
    ]);
    notifications.scheduleNotificationAsync.mockClear();
    await reconcileReminders();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('ignora preferências corrompidas', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.reminders, '{"enabled":"talvez"}');
    expect(await loadReminderSettings()).toEqual(DEFAULT_REMINDER_SETTINGS);
  });
});
