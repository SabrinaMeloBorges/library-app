import { forwardRef } from 'react';
import { StyleSheet, View, type TextInput as NativeTextInput } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { spacing } from '../theme/spacing';

interface FormTextFieldProps extends Omit<TextInputProps, 'error' | 'label'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormTextField = forwardRef<NativeTextInput, FormTextFieldProps>(
  ({ label, error, hint, required = false, style, ...inputProps }, ref) => {
    const helper = error ?? hint;
    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          mode="outlined"
          label={required ? `${label} *` : label}
          error={Boolean(error)}
          accessibilityLabel={label}
          accessibilityHint={error}
          style={[styles.input, style]}
          {...inputProps}
        />
        {helper ? (
          <HelperText type={error ? 'error' : 'info'} visible padding="none">
            {helper}
          </HelperText>
        ) : null}
      </View>
    );
  },
);

FormTextField.displayName = 'FormTextField';

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  input: { backgroundColor: 'transparent' },
});
