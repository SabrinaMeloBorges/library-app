import { useCallback, useContext } from 'react';
import { CelebrationContext } from '../context/CelebrationContext';
import { useSnackbar } from './useSnackbar';

export const useActionFeedback = () => {
  const { showMessage } = useSnackbar();
  const celebration = useContext(CelebrationContext);
  const checkAchievements = celebration?.checkAchievements;

  const notifySuccess = useCallback(
    (message: string) => {
      showMessage(message);
      if (checkAchievements) void checkAchievements();
    },
    [showMessage, checkAchievements],
  );

  return { notifySuccess };
};
