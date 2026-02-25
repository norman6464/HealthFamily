/**
 * 薬API クライアント（現在はモック）
 */

import { Medication } from '../../domain/entities/Medication';
import { CreateMedicationInput, UpdateMedicationInput } from '../../domain/repositories/MedicationRepository';

let mockMedications: Medication[] = [
  {
    id: 'med-1',
    memberId: 'member-1',
    userId: 'user-1',
    name: '血圧の薬',
    category: 'regular',
    dosage: '1錠',
    frequency: '1日1回 朝食後',
    stockQuantity: 28,
    lowStockThreshold: 7,
    instructions: '食後に水と一緒に服用',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med-2',
    memberId: 'member-1',
    userId: 'user-1',
    name: '胃薬',
    category: 'regular',
    dosage: '1包',
    frequency: '1日3回 毎食後',
    stockQuantity: 5,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med-3',
    memberId: 'member-3',
    userId: 'user-1',
    name: 'フィラリア薬',
    category: 'heartworm',
    dosage: '1錠',
    frequency: '月1回',
    stockQuantity: 2,
    lowStockThreshold: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const medicationApi = {
  async getMedicationsByMember(memberId: string): Promise<Medication[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedications.filter((m) => m.memberId === memberId);
  },

  async getMedicationById(medicationId: string): Promise<Medication | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMedications.find((m) => m.id === medicationId) || null;
  },

  async createMedication(input: CreateMedicationInput): Promise<Medication> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newMedication: Medication = {
      id: `med-${Date.now()}`,
      memberId: input.memberId,
      userId: input.userId,
      name: input.name,
      category: input.category,
      dosage: input.dosage,
      frequency: input.frequency,
      stockQuantity: input.stockQuantity,
      lowStockThreshold: input.lowStockThreshold,
      instructions: input.instructions,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMedications = [...mockMedications, newMedication];
    return newMedication;
  },

  async updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockMedications.findIndex((m) => m.id === medicationId);
    if (index === -1) throw new Error('薬が見つかりません');

    const updated: Medication = {
      ...mockMedications[index],
      ...input,
      updatedAt: new Date(),
    };
    mockMedications = mockMedications.map((m) => (m.id === medicationId ? updated : m));
    return updated;
  },

  async deleteMedication(medicationId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockMedications = mockMedications.filter((m) => m.id !== medicationId);
  },
};
