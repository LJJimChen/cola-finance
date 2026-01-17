import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';

interface Category {
  id: string;
  name: string;
  targetAllocation: number;
  currentAllocation: number;
}

interface CategoryManagementProps {
  categories: Category[];
  onAddCategory: (name: string, targetAllocation: number) => void;
  onUpdateCategory: (id: string, name: string, targetAllocation: number) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTargetAllocation, setNewTargetAllocation] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetAllocation, setEditTargetAllocation] = useState(0);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName, newTargetAllocation);
      setNewCategoryName('');
      setNewTargetAllocation(0);
      setIsAdding(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditTargetAllocation(category.targetAllocation);
  };

  const handleEditSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    onUpdateCategory(id, editName, editTargetAllocation);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      onDeleteCategory(id);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('common.categories')}</h2>
        <button 
          onClick={handleAddClick}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          {t('portfolio.addCategory')}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-4 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('rebalance.targetAllocation')}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newTargetAllocation}
                onChange={(e) => setNewTargetAllocation(parseFloat(e.target.value) || 0)}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                {t('common.save')}
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="p-3 bg-card border rounded-md">
            {editingId === category.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, category.id)}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="col-span-2 border rounded p-1"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editTargetAllocation}
                    onChange={(e) => setEditTargetAllocation(parseFloat(e.target.value) || 0)}
                    className="border rounded p-1"
                  />
                  <div className="flex space-x-1">
                    <button type="submit" className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                      {t('common.save')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingId(null)}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(category.id)}
                      className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className="col-span-2">
                  <span className="font-medium">{category.name}</span>
                </div>
                <div>
                  {t('rebalance.targetAllocation')}: {category.targetAllocation}% | 
                  {t('rebalance.currentAllocation')}: {category.currentAllocation.toFixed(2)}%
                </div>
                <div className="flex justify-end space-x-1">
                  <button 
                    onClick={() => startEditing(category)}
                    className="text-primary hover:underline text-sm"
                  >
                    {t('common.edit')}
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id)}
                    className="text-destructive hover:underline text-sm"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;