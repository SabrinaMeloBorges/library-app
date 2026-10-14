import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { MainTabScreenProps } from '../../navigation/types';
import { spacing } from '../../theme/spacing';
import { ClubsTab } from './ClubsTab';
import { ConversationsTab } from './ConversationsTab';
import { FeedTab } from './FeedTab';

type Section = 'feed' | 'clubs' | 'chats';

const SECTIONS = [
  { value: 'feed', label: 'Feed', icon: 'newspaper-variant-outline' },
  { value: 'clubs', label: 'Clubes', icon: 'account-group-outline' },
  { value: 'chats', label: 'Conversas', icon: 'chat-outline' },
];

export const CommunityScreen = ({ navigation }: MainTabScreenProps<'Community'>) => {
  const theme = useAppTheme();
  const [section, setSection] = useState<Section>('feed');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="account-search-outline"
          onPress={() => navigation.navigate('FindPeople')}
          accessibilityLabel="Encontrar pessoas"
        />
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right']}
    >
      <View style={styles.segments}>
        <SegmentedButtons
          value={section}
          onValueChange={(value) => setSection(value as Section)}
          buttons={SECTIONS}
          density="small"
        />
      </View>
      {section === 'feed' ? (
        <FeedTab
          onOpenUser={(userId) => navigation.navigate('UserProfile', { userId })}
          onOpenComments={(activityId) => navigation.navigate('ActivityComments', { activityId })}
          onFindPeople={() => navigation.navigate('FindPeople')}
        />
      ) : null}
      {section === 'clubs' ? (
        <ClubsTab
          onOpenClub={(clubId) => navigation.navigate('ClubDetails', { clubId })}
          onCreateClub={() => navigation.navigate('ClubForm')}
        />
      ) : null}
      {section === 'chats' ? (
        <ConversationsTab
          onOpenConversation={(conversationId, title) =>
            navigation.navigate('Chat', { conversationId, title })
          }
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segments: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
});
