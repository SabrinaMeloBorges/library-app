import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { FormTextField } from '../../components/FormTextField';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import type { RootStackScreenProps } from '../../navigation/types';
import { toApiError } from '../../services/apiError';
import { spacing } from '../../theme/spacing';
import {
  hasErrors,
  validateRegisterForm,
  type FormErrors,
  type RegisterFormValues,
} from '../../utils/validation';
import { AuthHeader } from './AuthHeader';

type Field = keyof RegisterFormValues;

const INITIAL_VALUES: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const RegisterScreen = ({ navigation }: RootStackScreenProps<'Register'>) => {
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: Field) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateRegisterForm(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  const passwordToggle = (
    <TextInput.Icon
      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
      onPress={() => setShowPassword((visible) => !visible)}
      accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
    />
  );

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <AuthHeader subtitle="Crie sua conta para organizar leituras, metas e sessões." />
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}
      <FormTextField
        label="Nome"
        required
        value={values.name}
        onChangeText={updateField('name')}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        disabled={isSubmitting}
      />
      <FormTextField
        label="E-mail"
        required
        value={values.email}
        onChangeText={updateField('email')}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        disabled={isSubmitting}
      />
      <FormTextField
        label="Senha"
        required
        value={values.password}
        onChangeText={updateField('password')}
        error={errors.password}
        hint="Mínimo de 8 caracteres, com letras e números."
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        disabled={isSubmitting}
        right={passwordToggle}
      />
      <FormTextField
        label="Confirmar senha"
        required
        value={values.confirmPassword}
        onChangeText={updateField('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        disabled={isSubmitting}
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Criar conta
      </Button>
      <View style={styles.footer}>
        <Text variant="bodyMedium">Já tem conta?</Text>
        <Button mode="text" onPress={() => navigation.goBack()} disabled={isSubmitting}>
          Entrar
        </Button>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  submit: { marginTop: spacing.sm },
  submitContent: { paddingVertical: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
