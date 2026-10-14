import { useCallback, useEffect, useState } from 'react';
import {
  getPermissionState,
  isNotificationSupported,
  requestPermission,
  sendTestNotification,
  type PermissionState,
  type ReminderSchedule,
} from '../services/notificationService';
import {
  DEFAULT_REMINDER_SETTINGS,
  disableReminders,
  enableReminders,
  reconcileReminders,
  updateReminderSchedule,
  type ReminderSettings,
} from '../services/reminderService';

export interface ReminderFeedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

const PERMISSION_DENIED_MESSAGE =
  'Permissão de notificações negada. Ative-a nas configurações do sistema para receber lembretes.';

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Não foi possível atualizar os lembretes.';

export const useReminderSettings = () => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<ReminderFeedback | null>(null);
  const isSupported = isNotificationSupported();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [reconciled, permissionState] = await Promise.all([
          reconcileReminders(),
          getPermissionState(),
        ]);
        if (!active) return;
        setSettings(reconciled);
        setPermission(permissionState);
      } catch (error) {
        if (active) setFeedback({ type: 'error', message: describeError(error) });
      } finally {
        if (active) setIsReady(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const runSaving = useCallback(async (action: () => Promise<void>) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await action();
    } catch (error) {
      setFeedback({ type: 'error', message: describeError(error) });
    } finally {
      setIsSaving(false);
    }
  }, []);

  const setEnabled = useCallback(
    (enabled: boolean) =>
      runSaving(async () => {
        if (!enabled) {
          setSettings(await disableReminders(settings));
          setFeedback({ type: 'info', message: 'Lembretes desativados.' });
          return;
        }
        const result = await enableReminders(settings);
        setSettings(result.settings);
        setPermission(result.permission);
        setFeedback(
          result.permission === 'granted'
            ? { type: 'success', message: 'Lembretes ativados.' }
            : { type: 'error', message: PERMISSION_DENIED_MESSAGE },
        );
      }),
    [runSaving, settings],
  );

  const updateSchedule = useCallback(
    (schedule: ReminderSchedule) =>
      runSaving(async () => {
        if (schedule.weekdays.length === 0) {
          setFeedback({ type: 'error', message: 'Selecione ao menos um dia da semana.' });
          return;
        }
        setSettings(await updateReminderSchedule(settings, schedule));
        if (settings.enabled) setFeedback({ type: 'success', message: 'Horário atualizado.' });
      }),
    [runSaving, settings],
  );

  const sendTest = useCallback(
    () =>
      runSaving(async () => {
        const granted = await requestPermission();
        setPermission(granted);
        if (granted !== 'granted') {
          setFeedback({ type: 'error', message: PERMISSION_DENIED_MESSAGE });
          return;
        }
        await sendTestNotification();
        setFeedback({
          type: 'success',
          message: 'Notificação de teste agendada para daqui a 5 segundos.',
        });
      }),
    [runSaving],
  );

  return {
    settings,
    permission,
    isSupported,
    isReady,
    isSaving,
    feedback,
    setEnabled,
    updateSchedule,
    sendTest,
  };
};
