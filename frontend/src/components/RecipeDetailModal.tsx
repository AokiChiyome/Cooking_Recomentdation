import type { Recipe } from '../types';

import { X, Clock, Users, Flame } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

function formatStepDescription(desc: string, stepNumber?: number) {
  if (!desc) return '';

  let cleaned = desc.trim();
  if (stepNumber && cleaned.startsWith(stepNumber.toString())) {
    cleaned = cleaned.replace(new RegExp(`^${stepNumber}\\s*`), '');
  } else {
    cleaned = cleaned.replace(/^\d+\s+/, '');
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleaned.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//i)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginLeft: '0.35rem',
            marginRight: '0.35rem',
            color: '#ea580c',
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            padding: '0.15rem 0.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            wordBreak: 'break-all',
          }}
          title={part}
        >
          🔗 Bài viết tham khảo
        </a>
      );
    }
    return part;
  });
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  if (!recipe) return null;

  return (
    <div className="modal-backdrop open" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-recipe-header">
          {recipe.recipeImage && (
            <img src={recipe.recipeImage} alt={recipe.recipeName} className="modal-recipe-img" />
          )}
          <h2 className="modal-recipe-title">{recipe.recipeName}</h2>
          
          <div className="recipe-metrics" style={{ marginTop: '0.75rem' }}>
            <div className="metric-item">
              <Clock size={16} /> {recipe.cookTime || 15} phút
            </div>
            <div className="metric-item">
              <Users size={16} /> {recipe.khauPhan || '2 người'}
            </div>
            <div className="metric-item">
              <Flame size={16} /> Độ khó: {recipe.difficulty || 'Dễ'}
            </div>
          </div>
        </div>

        <div className="modal-recipe-body">
          {recipe.recipeDescription && (
            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.92rem', color: '#475569' }}>
              <strong>💡 Mô tả: </strong> {recipe.recipeDescription}
            </div>
          )}

          {/* Ingredients list */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
              🥦 Nguyên liệu chuẩn bị:
            </h3>
            <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#334155' }}>
              {(recipe.ingredients || []).length > 0 ? (
                recipe.ingredients!.map((ingObj, idx) => {
                  const ingName = ingObj.ingredientName || ingObj.ingredient?.ingredientName || 'Nguyên liệu';
                  const qty = ingObj.quantity
                    ? `: ${ingObj.quantity}${ingObj.unit?.unitName ? ' ' + ingObj.unit.unitName : ''}`
                    : ingObj.amount
                    ? `: ${ingObj.amount}`
                    : '';
                  return (
                    <li key={idx}>
                      <strong>{ingName}</strong>{qty}
                    </li>
                  );
                })
              ) : (
                <li>Đang cập nhật danh sách nguyên liệu...</li>
              )}
            </ul>
          </div>

          {/* Steps list */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
              🍳 Các bước thực hiện:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(recipe.steps || []).length > 0 ? (
                recipe.steps!.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: '0.75rem' }}>
                    <div style={{ background: '#f97316', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                      {step.stepNumber || idx + 1}
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                      {formatStepDescription(step.description, typeof step.stepNumber === 'number' ? step.stepNumber : Number(step.stepNumber))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b' }}>Sơ chế nguyên liệu và chế biến theo khẩu vị gia đình.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
