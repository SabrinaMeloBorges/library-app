import { useLayoutEffect, useState } from 'react';
import { ErrorState, LoadingState } from '../components/StateViews';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { PillButton } from '../components/PillButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { useProfile } from '../hooks/useProfile';
import type { RootStackScreenProps } from '../navigation/types';
import { getErrorMessage } from '../services/apiError';
import { chatService } from '../services/chatService';
import { socialService } from '../services/socialService';
import { ProfileContent } from './profile/ProfileContent';

export const UserProfileScreen = ({ navigation, route }: RootStackScreenProps<'UserProfile'>) => {
  const { userId } = route.params;
  const { profile, activities, refresh } = useProfile(userId);
  const { notifySuccess } = useActionFeedback();
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const data = profile.data;

  useLayoutEffect(() => {
    navigation.setOptions({ title: data ? `@${data.user.username}` : 'Perfil' });
  }, [navigation, data]);

  if (profile.isLoading) return <LoadingState message="Abrindo perfil..." />;
  if (profile.error || !data) {
    return (
      <ScreenContainer>
        <ErrorState message={profile.error ?? 'Perfil indisponível.'} onRetry={profile.reload} />
      </ScreenContainer>
    );
  }

  const { relationship } = data;

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setIsBusy(true);
    setActionError(null);
    try {
      await action();
      if (success) notifySuccess(success);
      await profile.refetch();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const toggleFollow = () =>
    run(
      () =>
        relationship.isFollowing ? socialService.unfollow(userId) : socialService.follow(userId),
      relationship.isFollowing ? undefined : `Você agora segue ${data.user.name}.`,
    );

  const openChat = async () => {
    setIsBusy(true);
    setActionError(null);
    try {
      const conversation = await chatService.openDirect(userId);
      navigation.navigate('Chat', { conversationId: conversation.id, title: data.user.name });
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const followLabel = relationship.isFollowing
    ? 'Seguindo'
    : relationship.followsYou
      ? 'Seguir de volta'
      : 'Seguir';

  return (
    <ProfileContent
      profile={data}
      activities={activities.items}
      isRefreshing={profile.isRefreshing}
      onRefresh={() => void refresh()}
      onOpenFollowers={() => navigation.push('FollowList', { userId, mode: 'followers' })}
      onOpenFollowing={() => navigation.push('FollowList', { userId, mode: 'following' })}
      onOpenUser={(id) =>
        id === userId ? undefined : navigation.push('UserProfile', { userId: id })
      }
      onOpenComments={(activityId) => navigation.navigate('ActivityComments', { activityId })}
      onToggleLike={activities.toggleLike}
      extraSection={actionError ? <FeedbackBanner type="error" message={actionError} /> : null}
      headerActions={
        relationship.isMe ? null : (
          <>
            <PillButton
              variant={relationship.isFollowing ? 'outlined' : 'contained'}
              icon={relationship.isFollowing ? 'account-check-outline' : 'account-plus-outline'}
              onPress={toggleFollow}
              loading={isBusy}
              disabled={isBusy}
              accessibilityLabel={relationship.isFollowing ? 'Deixar de seguir' : followLabel}
            >
              {followLabel}
            </PillButton>
            {relationship.isFriend ? (
              <PillButton variant="soft" icon="chat-outline" onPress={openChat} disabled={isBusy}>
                Mensagem
              </PillButton>
            ) : null}
          </>
        )
      }
    />
  );
};
