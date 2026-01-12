import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
  nameZh?: string;
}

interface TargetAllocationFormProps {
  categories: Category[];
  initialTargets?: Record<string, number>;
  onSubmit: (targets: Record<string, number>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TargetAllocationForm: React.FC<TargetAllocationFormProps> = ({
  categories,
  initialTargets = {},
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize targets when component mounts or categories change
  useEffect(() => {
    const initial: Record<string, number> = {};
    categories.forEach(category => {
      initial[category.id] = initialTargets[category.id] || 0;
    });
    setTargets(initial);
  }, [categories, initialTargets]);

  // Calculate total whenever targets change
  useEffect(() => {
    const sum = Object.values(targets).reduce((acc, value) => acc + value, 0);
    setTotal(sum);
  }, [targets]);

  const handleTargetChange = (categoryId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTargets(prev => ({
      ...prev,
      [categoryId]: numValue
    }));
    
    // Clear error when user makes changes
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that total is 100%
    if (Math.abs(total - 100) > 0.01) {
      setError(`Target allocation must sum to 100%. Current sum: ${total.toFixed(2)}%`);
      return;
    }
    
    // Validate that no value is negative
    for (const [categoryId, value] of Object.entries(targets)) {
      if (value < 0) {
        setError(`Target allocation for ${categories.find(c => c.id === categoryId)?.name} cannot be negative`);
        return;
      }
    }
    
    onSubmit(targets);
  };

  const handleReset = () => {
    const resetTargets: Record<string, number> = {};
    categories.forEach(category => {
      resetTargets[category.id] = 0;
    });
    setTargets(resetTargets);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Allocation</CardTitle>
        <CardDescription>
          Set your desired allocation percentages for each category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-4">
                <Label htmlFor={`target-${category.id}`} className="w-32 flex-shrink-0">
                  {category.name}
                  {category.nameZh && <span className="text-xs text-gray-500 ml-1">({category.nameZh})</span>}
                </Label>
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    id={`target-${category.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={targets[category.id] || 0}
                    onChange={(e) => handleTargetChange(category.id, e.target.value)}
                    className="w-32"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className={total === 100 ? "text-green-600" : "text-red-600"}>
                Total: {total.toFixed(2)}%
              </span>
              {Math.abs(total - 100) > 0.01 && (
                <span className="ml-2 text-red-500">
                  (Must equal 100%)
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting || Math.abs(total - 100) > 0.01}>
                {isSubmitting ? 'Saving...' : 'Save Targets'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TargetAllocationForm;