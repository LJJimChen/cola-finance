import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface ClassificationScheme {
  id: string;
  name: string;
  nameZh?: string;
  description?: string;
  isPreset: boolean;
  categories: Array<{
    id: string;
    name: string;
    nameZh?: string;
  }>;
  createdAt: string;
}

export const ClassificationSchemesPage: React.FC = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<ClassificationScheme[]>([
    {
      id: 'preset_asset_class',
      name: 'Asset Class',
      nameZh: '资产类别',
      description: 'Classify holdings by asset class (stocks, bonds, cash, etc.)',
      isPreset: true,
      categories: [
        { id: 'stocks', name: 'Stocks', nameZh: '股票' },
        { id: 'bonds', name: 'Bonds', nameZh: '债券' },
        { id: 'funds', name: 'Funds', nameZh: '基金' },
        { id: 'cash', name: 'Cash', nameZh: '现金' },
        { id: 'crypto', name: 'Crypto', nameZh: '加密货币' },
        { id: 'other', name: 'Other', nameZh: '其他' }
      ],
      createdAt: '2026-01-11T00:00:00Z',
    },
    {
      id: 'custom_sector',
      name: 'Sector Classification',
      description: 'Classify holdings by sector (Technology, Healthcare, Finance, etc.)',
      isPreset: false,
      categories: [
        { id: 'tech', name: 'Technology' },
        { id: 'healthcare', name: 'Healthcare' },
        { id: 'finance', name: 'Finance' },
        { id: 'consumer', name: 'Consumer' },
        { id: 'industrial', name: 'Industrial' },
      ],
      createdAt: '2026-01-12T10:30:00Z',
    }
  ]);

  const handleCreateScheme = () => {
    // Navigate to create scheme form
    navigate({ to: '/classification/create' });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Classification Schemes</h1>
            <p className="text-gray-600 mt-2">
              Organize your holdings into categories for better portfolio analysis
            </p>
          </div>
          <Button onClick={handleCreateScheme}>
            <Plus className="mr-2 h-4 w-4" />
            Create Scheme
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <Card key={scheme.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{scheme.name}</CardTitle>
                    {scheme.nameZh && (
                      <CardDescription className="text-sm">{scheme.nameZh}</CardDescription>
                    )}
                  </div>
                  <Badge variant={scheme.isPreset ? "secondary" : "default"}>
                    {scheme.isPreset ? "Preset" : "Custom"}
                  </Badge>
                </div>
                {scheme.description && (
                  <CardDescription className="mt-2">
                    {scheme.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {scheme.categories.slice(0, 5).map((category) => (
                      <Badge key={category.id} variant="outline">
                        {category.name}
                        {category.nameZh && <span className="text-xs ml-1">({category.nameZh})</span>}
                      </Badge>
                    ))}
                    {scheme.categories.length > 5 && (
                      <Badge variant="outline">+{scheme.categories.length - 5} more</Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate({ to: `/classification/${scheme.id}/targets` })}
                  >
                    {scheme.isPreset ? 'View Targets' : 'Edit Targets'}
                  </Button>
                  {!scheme.isPreset && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {schemes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No classification schemes yet.</p>
              <Button 
                className="mt-4" 
                onClick={handleCreateScheme}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first scheme
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClassificationSchemesPage;