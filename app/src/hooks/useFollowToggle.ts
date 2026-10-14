import { useCallback, useState } from 'react';
import { getErrorMessage } from '../services/apiError';
import { socialService } from '../services/socialService';
import type { Relationship, UserWithRelationship } from '../types/social';
import { useActionFeedback } from './useActionFeedback';

export const useFollowToggle = () => {
  const { notifySuccess } = useActionFeedback();
  const [overrides, setOverrides] = useState<Record<string, Relationship>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    (people: UserWithRelationship[]): UserWithRelationship[] =>
      people.map((person) =>
        overrides[person.id] ? { ...person, relationship: overrides[person.id] } : person,
      ),
    [overrides],
  );

  const toggle = useCallback(
    async (person: UserWithRelationship) => {
      setBusyId(person.id);
      setError(null);
      try {
        const relationship = person.relationship.isFollowing
          ? await socialService.unfollow(person.id)
          : await socialService.follow(person.id);
        setOverrides((current) => ({ ...current, [person.id]: relationship }));
        if (relationship.isFollowing) notifySuccess(`Você agora segue ${person.name}.`);
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setBusyId(null);
      }
    },
    [notifySuccess],
  );

  return { apply, toggle, busyId, error };
};
