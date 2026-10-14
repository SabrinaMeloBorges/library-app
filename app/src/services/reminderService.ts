import {
  cancelReadingReminders,
  getPermissionState,
  isNotificationSupported,
  isScheduleInSync,
  requestPermission,
  scheduleReadingReminders,
  type PermissionState,
  type ReminderSchedule,
} from './notificationService';
import { STORAGE_KEYS, readPreference, writePreference } from './preferencesStorage';

export interface ReminderSettings extends ReminderSchedule {
  enabled: boolean;
  scheduledIds: string[];
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  scheduledIds: [],
};

const isIntegerInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const isReminderSettings = (value: unknown): value is ReminderSettings => {
  const settings = value as ReminderSettings;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof settings.enabled === 'boolean' &&
    isIntegerInRange(settings.hour, 0, 23) &&
    isIntegerInRange(settings.minute, 0, 59) &&
    Array.isArray(settings.weekdays) &&
    settings.weekdays.every((day) => isIntegerInRange(day, 1, 7)) &&
    Array.isArray(settings.scheduledIds) &&
    settings.scheduledIds.every((id) => typeof id === 'string')
  );
};

export const loadReminderSettings = async (): Promise<ReminderSettings> =>
  (await readPreference(STORAGE_KEYS.reminders, isReminderSettings)) ?? DEFAULT_REMINDER_SETTINGS;

const persist = async (settings: ReminderSettings): Promise<ReminderSettings> => {
  await writePreference(STORAGE_KEYS.reminders, settings);
  return settings;
};

export interface EnableResult {
  settings: ReminderSettings;
  permission: PermissionState;
}

export const enableReminders = async (current: ReminderSettings): Promise<EnableResult> => {
  const permission = await requestPermission();
  if (permission !== 'granted') {
    return {
      settings: await persist({ ...current, enabled: false, scheduledIds: [] }),
      permission,
    };
  }
  const scheduledIds = await scheduleReadingReminders(current, current.scheduledIds);
  return { settings: await persist({ ...current, enabled: true, scheduledIds }), permission };
};

export const disableReminders = async (current: ReminderSettings): Promise<ReminderSettings> => {
  await cancelReadingReminders(current.scheduledIds);
  return persist({ ...current, enabled: false, scheduledIds: [] });
};

export const updateReminderSchedule = async (
  current: ReminderSettings,
  schedule: ReminderSchedule,
): Promise<ReminderSettings> => {
  const next = { ...current, ...schedule };
  if (!next.enabled) return persist(next);
  const scheduledIds = await scheduleReadingReminders(next, current.scheduledIds);
  return persist({ ...next, scheduledIds });
};

export const reconcileReminders = async (): Promise<ReminderSettings> => {
  const settings = await loadReminderSettings();
  if (!isNotificationSupported()) return settings;

  if (!settings.enabled) {
    await cancelReadingReminders(settings.scheduledIds);
    return settings.scheduledIds.length > 0 ? persist({ ...settings, scheduledIds: [] }) : settings;
  }

  if ((await getPermissionState()) !== 'granted') {
    await cancelReadingReminders(settings.scheduledIds);
    return persist({ ...settings, enabled: false, scheduledIds: [] });
  }

  if (await isScheduleInSync(settings.scheduledIds)) return settings;
  const scheduledIds = await scheduleReadingReminders(settings, settings.scheduledIds);
  return persist({ ...settings, scheduledIds });
};
