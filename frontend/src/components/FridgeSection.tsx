import React from 'react';
import { X, Trash2, Refrigerator } from 'lucide-react';

interface FridgeSectionProps {
  selectedIngredients: string[];
  onRemoveIngredient: (ing: string) => void;
  onClearAll: () => void;
}

export const FridgeSection: React.FC<FridgeSectionProps> = ({
  selectedIngredients,
  onRemoveIngredient,
  onClearAll,
}) => {
  if (selectedIngredients.length === 0) return null;

  return (
    <section className="fridge-box">
      <div className="fridge-header">
        <div className="fridge-title">
          <Refrigerator size={18} style={{ color: 'var(--primary)' }} />
          <span>Tủ lạnh của bạn ({selectedIngredients.length} nguyên liệu)</span>
        </div>
        <button className="btn-clear-all" onClick={onClearAll}>
          <Trash2 size={14} /> Xóa tất cả
        </button>
      </div>

      <div className="selected-tags">
        {selectedIngredients.map((ing) => (
          <span key={ing} className="tag-selected">
            {ing}
            <button
              className="btn-remove-tag"
              onClick={() => onRemoveIngredient(ing)}
              title="Xóa nguyên liệu"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
};
