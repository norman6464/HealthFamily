/**
 * 病院エンティティ
 */

export interface Hospital {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly hospitalType?: string;
  readonly address?: string;
  readonly phoneNumber?: string;
  readonly notes?: string;
  readonly createdAt: Date;
}
