import React from 'react';
import { User, Dog, Cat, Rabbit, Bird, PawPrint, type LucideIcon } from 'lucide-react';
import { MemberType, PetType } from '../../domain/entities/Member';

interface MemberIconProps {
  memberType: MemberType;
  petType?: PetType;
  size?: number;
  className?: string;
}

const petIconMap: Record<PetType, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
  bird: Bird,
  other: PawPrint,
};

export const MemberIcon: React.FC<MemberIconProps> = ({ memberType, petType, size = 24, className }) => {
  if (memberType === 'pet') {
    const Icon = petIconMap[petType || 'other'];
    return <Icon size={size} className={className} aria-hidden="true" />;
  }
  return <User size={size} className={className} aria-hidden="true" />;
};
