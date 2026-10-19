import { StyleSheet } from 'react-native';
import { Button, type ButtonProps } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';

type PillButtonProps = Omit<ButtonProps, 'mode'> & { variant?: 'outlined' | 'contained' | 'soft' };

export const PillButton = ({
  variant = 'outlined',
  style,
  compact = true,
  ...props
}: PillButtonProps) => {
  const theme = useAppTheme();
  const soft = variant === 'soft';
  return (
    <Button
      {...props}
      compact={compact}
      mode={soft ? 'contained-tonal' : variant}
      buttonColor={soft ? theme.appColors.accentSoft : undefined}
      textColor={soft ? theme.appColors.primary : undefined}
      style={[
        styles.pill,
        variant === 'outlined' && { borderColor: theme.appColors.primary, borderWidth: 1 },
        style,
      ]}
      labelStyle={styles.label}
    />
  );
};

const styles = StyleSheet.create({
  pill: { borderRadius: 999 },
  label: { marginHorizontal: 14, marginVertical: 7 },
});
