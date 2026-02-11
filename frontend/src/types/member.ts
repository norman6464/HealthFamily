export type MemberType = 'human' | 'pet';
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';

export interface Member {
  memberId: string;
  userId: string;
  memberType: MemberType;
  name: string;
  petType?: PetType;
  photoUrl?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
