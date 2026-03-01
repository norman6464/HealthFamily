/**
 * 通院予約管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { Appointment } from '../../domain/entities/Appointment';
import { GetAppointments, CreateAppointment, UpdateAppointment, DeleteAppointment } from '../../domain/usecases/ManageAppointments';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../../domain/repositories/AppointmentRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseAppointmentsResult {
  appointments: Appointment[];
  isLoading: boolean;
  error: Error | null;
  createAppointment: (input: CreateAppointmentInput) => Promise<void>;
  updateAppointment: (appointmentId: string, input: UpdateAppointmentInput) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAppointments = (): UseAppointmentsResult => {
  const useCases = useMemo(() => {
    const { appointmentRepository } = getDIContainer();
    return {
      getAppointments: new GetAppointments(appointmentRepository),
      createAppointment: new CreateAppointment(appointmentRepository),
      updateAppointment: new UpdateAppointment(appointmentRepository),
      deleteAppointment: new DeleteAppointment(appointmentRepository),
    };
  }, []);

  const { data: appointments, isLoading, error, refetch } = useFetcher(
    async () => {
      const viewModels = await useCases.getAppointments.execute();
      return viewModels.map((vm) => vm.appointment);
    },
    [useCases],
    [] as Appointment[],
  );

  const handleCreateAppointment = useCallback(async (input: CreateAppointmentInput) => {
    await useCases.createAppointment.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdateAppointment = useCallback(async (appointmentId: string, input: UpdateAppointmentInput) => {
    await useCases.updateAppointment.execute(appointmentId, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    await useCases.deleteAppointment.execute(appointmentId);
    await refetch();
  }, [useCases, refetch]);

  return {
    appointments,
    isLoading,
    error,
    createAppointment: handleCreateAppointment,
    updateAppointment: handleUpdateAppointment,
    deleteAppointment: handleDeleteAppointment,
    refetch,
  };
};
