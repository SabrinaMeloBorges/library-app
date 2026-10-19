import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { FormTextField } from '../components/FormTextField';
import { OptionChips } from '../components/OptionChips';
import { ScreenContainer } from '../components/ScreenContainer';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { useAsyncResource } from '../hooks/useAsyncResource';
import type { RootStackScreenProps } from '../navigation/types';
import { toApiError } from '../services/apiError';
import { clubService } from '../services/clubService';
import { goalService } from '../services/goalService';
import type { GoalPeriod, ReadingGoal, ReadingGoalInput } from '../types/api';
import { periodRange } from '../utils/dates';
import { GOAL_PERIOD_OPTIONS, GOAL_TYPE_OPTIONS, GOAL_UNITS } from '../utils/labels';
import {
  hasErrors,
  toGoalPayload,
  validateGoalForm,
  type FormErrors,
  type GoalFormValues,
} from '../utils/validation';
import { spacing } from '../theme/spacing';

type Field = keyof GoalFormValues;

const buildDefaults = (): GoalFormValues => {
  const range = periodRange('YEARLY');
  return {
    title: '',
    type: 'BOOKS_FINISHED',
    period: 'YEARLY',
    targetValue: '',
    startDate: range.start,
    endDate: range.end,
  };
};

type EditableGoal = Pick<
  ReadingGoal,
  'title' | 'type' | 'period' | 'targetValue' | 'startDate' | 'endDate'
>;

const loadEditableGoal = async (goalId: string, clubId?: string): Promise<EditableGoal> => {
  if (!clubId) return goalService.get(goalId);
  const club = await clubService.get(clubId);
  const goal = club.goals.find((item) => item.id === goalId);
  if (!goal) throw new Error('Meta do clube não encontrada.');
  return goal;
};

const valuesFromGoal = (goal: EditableGoal): GoalFormValues => ({
  title: goal.title,
  type: goal.type,
  period: goal.period,
  targetValue: String(goal.targetValue),
  startDate: goal.startDate,
  endDate: goal.endDate,
});

type ScreenProps = RootStackScreenProps<'GoalForm'>;

export const GoalFormScreen = ({ navigation, route }: ScreenProps) => {
  const goalId = route.params?.goalId;
  const clubId = route.params?.clubId;
  const isEditing = Boolean(goalId);
  const loadGoal = useCallback(() => loadEditableGoal(goalId as string, clubId), [goalId, clubId]);
  const existing = useAsyncResource(loadGoal, { enabled: isEditing, refetchOnFocus: false });

  useLayoutEffect(() => {
    const subject = clubId ? 'meta do clube' : 'meta';
    navigation.setOptions({ title: isEditing ? `Editar ${subject}` : `Nova ${subject}` });
  }, [navigation, isEditing, clubId]);

  if (isEditing && existing.isLoading) return <LoadingState message="Carregando meta..." />;
  if (isEditing && (existing.error || !existing.data)) {
    return (
      <ScreenContainer>
        <ErrorState message={existing.error ?? 'Meta não encontrada.'} onRetry={existing.reload} />
      </ScreenContainer>
    );
  }

  return (
    <GoalForm
      initialValues={existing.data ? valuesFromGoal(existing.data) : buildDefaults()}
      goalId={goalId}
      clubId={clubId}
      navigation={navigation}
    />
  );
};

interface GoalFormProps {
  initialValues: GoalFormValues;
  goalId?: string;
  clubId?: string;
  navigation: ScreenProps['navigation'];
}

const saveGoal = async (payload: ReadingGoalInput, goalId?: string, clubId?: string) => {
  if (clubId) {
    if (goalId) await clubService.updateGoal(clubId, goalId, payload);
    else await clubService.createGoal(clubId, payload);
    return;
  }
  if (goalId) await goalService.update(goalId, payload);
  else await goalService.create(payload);
};

const GoalForm = ({ initialValues, goalId, clubId, navigation }: GoalFormProps) => {
  const { notifySuccess } = useActionFeedback();
  const [values, setValues] = useState<GoalFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <Key extends Field>(field: Key, value: GoalFormValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectPeriod = (period: GoalPeriod) => {
    setValues((current) => {
      if (period === 'CUSTOM') return { ...current, period };
      const range = periodRange(period);
      return { ...current, period, startDate: range.start, endDate: range.end };
    });
    setErrors((current) => ({ ...current, startDate: undefined, endDate: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateGoalForm(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await saveGoal(toGoalPayload(values), goalId, clubId);
      notifySuccess(goalId ? 'Meta atualizada.' : 'Meta criada.');
      navigation.goBack();
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  const datesEditable = values.period === 'CUSTOM';

  return (
    <ScreenContainer>
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}
      <FormTextField
        label="Título da meta"
        required
        value={values.title}
        onChangeText={(text) => setField('title', text)}
        error={errors.title}
        placeholder="Ex.: Ler 12 livros este ano"
        maxLength={120}
        disabled={isSubmitting}
      />

      <Text variant="labelLarge">Tipo</Text>
      <OptionChips
        options={GOAL_TYPE_OPTIONS}
        selected={values.type}
        onSelect={(type) => setField('type', type)}
        accessibilityLabel="Tipo de meta"
      />

      <Text variant="labelLarge" style={styles.label}>
        Período
      </Text>
      <OptionChips
        options={GOAL_PERIOD_OPTIONS}
        selected={values.period}
        onSelect={selectPeriod}
        accessibilityLabel="Período da meta"
      />

      <View style={styles.spacer} />
      <FormTextField
        label={`Valor desejado (${GOAL_UNITS[values.type]})`}
        required
        value={values.targetValue}
        onChangeText={(text) => setField('targetValue', text.replace(/\D/g, ''))}
        error={errors.targetValue}
        keyboardType="number-pad"
        maxLength={7}
        disabled={isSubmitting}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField
            label="Início"
            required
            value={values.startDate}
            onChangeText={(text) => setField('startDate', text)}
            error={errors.startDate}
            hint={datesEditable ? 'AAAA-MM-DD' : 'Definido pelo período'}
            editable={datesEditable}
            maxLength={10}
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.flex}>
          <FormTextField
            label="Término"
            required
            value={values.endDate}
            onChangeText={(text) => setField('endDate', text)}
            error={errors.endDate}
            hint={datesEditable ? 'AAAA-MM-DD' : 'Definido pelo período'}
            editable={datesEditable}
            maxLength={10}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Salvar meta
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { marginTop: spacing.md },
  spacer: { height: spacing.lg },
  submit: { marginTop: spacing.lg },
  submitContent: { paddingVertical: spacing.xs },
});
