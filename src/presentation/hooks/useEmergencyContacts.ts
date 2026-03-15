import { useCallback, useMemo } from 'react';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { GetEmergencyContacts, CreateEmergencyContact, UpdateEmergencyContact, DeleteEmergencyContact } from '../../domain/usecases/ManageEmergencyContacts';
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from '../../domain/repositories/EmergencyContactRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseEmergencyContactsResult {
  contacts: EmergencyContact[];
  isLoading: boolean;
  error: Error | null;
  createContact: (input: CreateEmergencyContactInput) => Promise<void>;
  updateContact: (id: string, input: UpdateEmergencyContactInput) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useEmergencyContacts = (): UseEmergencyContactsResult => {
  const useCases = useMemo(() => {
    const { emergencyContactRepository } = getDIContainer();
    return {
      getContacts: new GetEmergencyContacts(emergencyContactRepository),
      createContact: new CreateEmergencyContact(emergencyContactRepository),
      updateContact: new UpdateEmergencyContact(emergencyContactRepository),
      deleteContact: new DeleteEmergencyContact(emergencyContactRepository),
    };
  }, []);

  const { data: contacts, isLoading, error, refetch } = useFetcher(
    async () => useCases.getContacts.execute(),
    [useCases],
    [] as EmergencyContact[],
    'emergencyContacts',
  );

  const handleCreate = useCallback(async (input: CreateEmergencyContactInput) => {
    await useCases.createContact.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateEmergencyContactInput) => {
    await useCases.updateContact.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteContact.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    contacts,
    isLoading,
    error,
    createContact: handleCreate,
    updateContact: handleUpdate,
    deleteContact: handleDelete,
    refetch,
  };
};
