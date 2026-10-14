import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Avatar } from '../components/Avatar';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { FormTextField } from '../components/FormTextField';
import { ScreenContainer } from '../components/ScreenContainer';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { useAuth } from '../hooks/useAuth';
import type { RootStackScreenProps } from '../navigation/types';
import { toApiError } from '../services/apiError';
import { socialService } from '../services/socialService';
import { spacing } from '../theme/spacing';
import { hasErrors, validateUsername, type FormErrors } from '../utils/validation';

interface ProfileFormValues {
  name: string;
  username: string;
  bio: string;
}

type Field = keyof ProfileFormValues;

const validate = (values: ProfileFormValues): FormErrors<Field> => ({
  name: !values.name.trim()
    ? 'Informe seu nome'
    : values.name.trim().length > 80
      ? 'Use no máximo 80 caracteres'
      : undefined,
  username: validateUsername(values.username, true),
  bio: values.bio.trim().length > 160 ? 'Use no máximo 160 caracteres' : undefined,
});

export const EditProfileScreen = ({ navigation }: RootStackScreenProps<'EditProfile'>) => {
  const { user, updateUser } = useAuth();
  const { notifySuccess } = useActionFeedback();
  const [values, setValues] = useState<ProfileFormValues>({
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
  });
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: Field) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validate(values);
    setErrors(validation);
    if (hasErrors(validation)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await socialService.updateMe({
        name: values.name.trim(),
        username: values.username.trim().toLowerCase(),
        bio: values.bio.trim() || null,
      });
      updateUser(updated);
      notifySuccess('Perfil atualizado.');
      navigation.goBack();
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.avatar}>
        <Avatar name={values.name || 'Leitor'} seed={user?.id ?? 'me'} size={88} />
      </View>
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}
      <FormTextField
        label="Nome"
        required
        value={values.name}
        onChangeText={setField('name')}
        error={errors.name}
        maxLength={80}
        disabled={isSubmitting}
      />
      <FormTextField
        label="Nome de usuário"
        required
        value={values.username}
        onChangeText={setField('username')}
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        left={<TextInput.Affix text="@" />}
        disabled={isSubmitting}
      />
      <FormTextField
        label="Bio"
        value={values.bio}
        onChangeText={setField('bio')}
        error={errors.bio}
        hint="Conte um pouco sobre seus gostos de leitura."
        multiline
        numberOfLines={3}
        maxLength={160}
        disabled={isSubmitting}
      />
      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Salvar perfil
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', marginBottom: spacing.lg },
  submit: { marginTop: spacing.md },
  submitContent: { paddingVertical: spacing.xs },
});
