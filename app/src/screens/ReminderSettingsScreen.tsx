import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/StateViews';
import { TimeSelector } from '../components/TimeSelector';
import { WeekdaySelector } from '../components/WeekdaySelector';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReminderSettings } from '../hooks/useReminderSettings';
import type { ReminderSchedule } from '../services/notificationService';
import { formatTime } from '../utils/dates';
import { WEEKDAY_OPTIONS } from '../utils/labels';
import { spacing } from '../theme/spacing';

const describeWeekdays = (weekdays: number[]): string => {
  if (weekdays.length === 7) return 'todos os dias';
  return WEEKDAY_OPTIONS.filter((option) => weekdays.includes(option.value))
    .map((option) => option.label.toLowerCase())
    .join(', ');
};

const scheduleKey = (schedule: ReminderSchedule): string =>
  `${schedule.hour}:${schedule.minute}:${schedule.weekdays.join(',')}`;

const PERMISSION_LABELS = {
  granted: 'Permitidas',
  denied: 'Bloqueadas',
  undetermined: 'Ainda não solicitadas',
} as const;

interface ScheduleEditorProps {
  saved: ReminderSchedule;
  isSaving: boolean;
  onSave: (schedule: ReminderSchedule) => void;
}

const ScheduleEditor = ({ saved, isSaving, onSave }: ScheduleEditorProps) => {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<ReminderSchedule>(saved);
  const hasPendingChanges = scheduleKey(draft) !== scheduleKey(saved);
  const hasWeekdays = draft.weekdays.length > 0;

  return (
    <>
      <SectionHeader title="Horário" />
      <TimeSelector
        hour={draft.hour}
        minute={draft.minute}
        disabled={isSaving}
        onChange={(hour, minute) => setDraft((current) => ({ ...current, hour, minute }))}
      />

      <SectionHeader title="Dias da semana" />
      <WeekdaySelector
        selected={draft.weekdays}
        disabled={isSaving}
        onChange={(weekdays) => setDraft((current) => ({ ...current, weekdays }))}
      />
      {!hasWeekdays ? (
        <Text variant="bodySmall" style={[styles.helper, { color: theme.appColors.danger }]}>
          Selecione ao menos um dia.
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon="content-save-outline"
        style={styles.action}
        onPress={() => onSave(draft)}
        disabled={!hasPendingChanges || !hasWeekdays || isSaving}
        loading={isSaving && hasPendingChanges}
      >
        Salvar horário
      </Button>
    </>
  );
};

export const ReminderSettingsScreen = () => {
  const theme = useAppTheme();
  const reminders = useReminderSettings();
  const { settings } = reminders;

  if (!reminders.isReady) return <LoadingState message="Verificando lembretes..." />;

  const muted = { color: theme.appColors.textMuted };
  const saved: ReminderSchedule = {
    hour: settings.hour,
    minute: settings.minute,
    weekdays: settings.weekdays,
  };

  return (
    <ScreenContainer>
      <Text variant="bodyMedium" style={muted}>
        O Library pode enviar lembretes locais neste dispositivo para ajudar você a manter o hábito
        de leitura. Para isso, o sistema pedirá permissão para exibir notificações. Nenhum dado é
        enviado para servidores externos.
      </Text>

      {!reminders.isSupported ? (
        <View style={styles.banner}>
          <FeedbackBanner
            type="info"
            message="Notificações locais não são suportadas nesta plataforma. Use o app em um dispositivo Android ou iOS."
          />
        </View>
      ) : null}
      {reminders.feedback ? (
        <View style={styles.banner}>
          <FeedbackBanner type={reminders.feedback.type} message={reminders.feedback.message} />
        </View>
      ) : null}

      <View style={[styles.switchRow, { borderColor: theme.appColors.border }]}>
        <View style={styles.flex}>
          <Text variant="bodyLarge">Lembretes de leitura</Text>
          <Text variant="bodySmall" style={muted}>
            {settings.enabled
              ? `Ativos: ${formatTime(settings.hour, settings.minute)}, ${describeWeekdays(settings.weekdays)}`
              : 'Desativados'}
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          disabled={!reminders.isSupported || reminders.isSaving}
          onValueChange={(enabled) => void reminders.setEnabled(enabled)}
          accessibilityLabel="Ativar lembretes de leitura"
        />
      </View>

      <ScheduleEditor
        key={scheduleKey(saved)}
        saved={saved}
        isSaving={reminders.isSaving}
        onSave={(schedule) => void reminders.updateSchedule(schedule)}
      />
      <Button
        mode="outlined"
        icon="bell-ring-outline"
        style={styles.action}
        onPress={() => void reminders.sendTest()}
        disabled={!reminders.isSupported || reminders.isSaving}
      >
        Enviar notificação de teste
      </Button>

      <SectionHeader title="Estado atual" />
      <Text variant="bodyMedium">
        Permissão do sistema: {PERMISSION_LABELS[reminders.permission]}
      </Text>
      <Text variant="bodyMedium">Lembretes agendados: {settings.scheduledIds.length}</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { marginTop: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  helper: { marginTop: spacing.xs },
  action: { marginTop: spacing.md },
});
