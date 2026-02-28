import React from 'react';
import { Dog, Cat, Rabbit, Bird } from 'lucide-react';
import { CharacterType } from '../../domain/entities/Character';

interface CharacterIconProps {
  type: CharacterType;
  size?: number;
  className?: string;
}

const iconMap = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
  bird: Bird,
} as const;

export const CharacterIcon: React.FC<CharacterIconProps> = ({ type, size = 32, className }) => {
  const Icon = iconMap[type];
  return <Icon size={size} className={className} aria-hidden="true" />;
};
