import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { UserWithRelationship } from '../types/social';
import { spacing } from '../theme/spacing';
import { Avatar } from './Avatar';
import { PillButton } from './PillButton';

interface PersonRowProps {
  person: UserWithRelationship;
  onOpen: (userId: string) => void;
  onToggleFollow?: (person: UserWithRelationship) => void;
  isBusy?: boolean;
}

export const PersonRow = ({ person, onOpen, onToggleFollow, isBusy = false }: PersonRowProps) => {
  const theme = useAppTheme();
  const { relationship } = person;
  const subtitle = relationship.isFriend
    ? 'Amigos · vocês se seguem'
    : relationship.followsYou
      ? 'Segue você'
      : `@${person.username}`;

  return (
    <View style={[styles.row, { borderBottomColor: theme.appColors.border }]}>
      <Pressable
        onPress={() => onOpen(person.id)}
        accessibilityRole="button"
        accessibilityLabel={`Ver perfil de ${person.name}`}
        style={({ pressed }) => [styles.opener, pressed && styles.pressed]}
      >
        <Avatar name={person.name} seed={person.id} size={44} />
        <View style={styles.text}>
          <Text variant="titleMedium" numberOfLines={1}>
            {person.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
      {onToggleFollow && !relationship.isMe ? (
        <PillButton
          variant={relationship.isFollowing ? 'outlined' : 'contained'}
          onPress={() => onToggleFollow(person)}
          disabled={isBusy}
          accessibilityLabel={
            relationship.isFollowing ? `Deixar de seguir ${person.name}` : `Seguir ${person.name}`
          }
        >
          {relationship.isFollowing
            ? 'Seguindo'
            : relationship.followsYou
              ? 'Seguir de volta'
              : 'Seguir'}
        </PillButton>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  opener: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.7 },
  text: { flex: 1 },
});
