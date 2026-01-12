import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Scheme {
  id: string;
  name: string;
  nameZh?: string;
  isPreset: boolean;
}

interface SchemeSelectorProps {
  schemes: Scheme[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const SchemeSelector: React.FC<SchemeSelectorProps> = ({
  schemes,
  value,
  onValueChange,
  disabled = false,
  className
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a classification scheme">
          {value ? (
            schemes.find(s => s.id === value)?.name
          ) : (
            <span>Select scheme</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {schemes.map((scheme) => (
          <SelectItem key={scheme.id} value={scheme.id}>
            <div className="flex items-center">
              <span className="font-medium">{scheme.name}</span>
              {scheme.isPreset && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Preset
                </span>
              )}
              {scheme.nameZh && (
                <span className="text-sm text-muted-foreground ml-2">({scheme.nameZh})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SchemeSelector;