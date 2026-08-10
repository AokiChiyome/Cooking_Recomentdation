import React, { useState } from "react";
import { Sparkles, Search, Utensils, Dices, Plus } from "lucide-react";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddIngredient: (ing: string) => void;
  onTriggerSearch: () => void;
  onSuggestRandom: () => void;
}

const SUGGESTED_INGREDIENTS = [
  "thịt bò",
  "thịt heo",
  "thịt gà",
  "trứng",
  "cà chua",
  "hành tây",
  "tỏi",
  "khoai tây",
  "rau muống",
  "tôm",
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onAddIngredient,
  onTriggerSearch,
  onSuggestRandom,
}) => {
  const [ingInput, setIngInput] = useState("");

  const handleAdd = () => {
    if (ingInput.trim()) {
      onAddIngredient(ingInput.trim());
      setIngInput("");
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-top-bar" />

      {/* Floating food animations (4 food items cleanly placed) */}
      <span className="floating-food food-1">🍳</span>
      <span className="floating-food food-2">🥦</span>
      <span className="floating-food food-3">🥩</span>
      <span className="floating-food food-4">🍅</span>

      <div className="hero-badge">
        <Sparkles size={16} /> Kho 9.920+ Công thức Nấu Ăn Thông Minh
      </div>

      <h1 className="hero-title">
        Hôm nay <span>nấu gì?</span>
      </h1>
      <p className="hero-subtitle">
        Nhập tên món ăn bạn thèm hoặc danh sách nguyên liệu đang có trong tủ
        lạnh, chúng tôi sẽ gợi ý ngay món ăn phù hợp nhất!
      </p>

      {/* Dual Search Wrapper */}
      <div className="search-wrapper">
        <div className="dual-search-grid">
          {/* Box 1: Search by Recipe Name */}
          <div className="search-box-item">
            <label htmlFor="recipeNameInput" className="search-box-label">
              <Search size={16} style={{ color: "var(--primary)" }} />
              Tên món ăn muốn nấu
            </label>
            <div className="search-pill">
              <input
                type="text"
                id="recipeNameInput"
                className="search-input"
                placeholder="VD: Phở bò, Sườn xào chua ngọt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onTriggerSearch()}
              />
            </div>
          </div>

          {/* Box 2: Search by Fridge Ingredients */}
          <div className="search-box-item">
            <label htmlFor="ingredientInput" className="search-box-label">
              <Utensils size={16} style={{ color: "var(--accent)" }} />
              Nguyên liệu có sẵn trong tủ lạnh
            </label>
            <div className="search-pill">
              <input
                type="text"
                id="ingredientInput"
                className="search-input"
                placeholder="VD: thịt bò, cà chua, trứng, tỏi..."
                value={ingInput}
                onChange={(e) => setIngInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
              <button className="btn-add" onClick={handleAdd}>
                <Plus size={16} /> Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Hero Actions Button */}
        <div className="hero-actions">
          <button className="btn-search-main-home" onClick={onTriggerSearch}>
            <Search size={20} /> TÌM MÓN ĂN PHÙ HỢP
          </button>
        </div>

        {/* Quick Suggestions */}
        <div className="quick-suggestions">
          <span className="suggestion-label">Gợi ý nhanh:</span>
          <button className="chip-btn btn-random" onClick={onSuggestRandom}>
            <Dices size={15} /> Gợi ý ngẫu nhiên
          </button>

          {SUGGESTED_INGREDIENTS.slice(0, 6).map((ing) => (
            <button
              key={ing}
              className="chip-btn"
              onClick={() => onAddIngredient(ing)}
            >
              + {ing}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
