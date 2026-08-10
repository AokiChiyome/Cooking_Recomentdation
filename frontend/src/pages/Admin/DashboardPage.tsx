import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/api";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChefHat, Globe, LogOut, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./admin.css";
import type { DashboardSummary } from "./dashboardStats";

const DIFFICULTY_LABELS: Record<string, string> = {
  "1": "Dễ",
  "2": "Trung bình",
  "3": "Khó",
  "4": "Rất khó",
};

const PIE_COLORS = ["#c1432e", "#b8862e", "#5b7553", "#8a6f4e", "#a45a3f"];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const numberFormatter = new Intl.NumberFormat("vi-VN");

export const DashboardPage: React.FC = () => {
  const { currentUser, authLoading, handleLogout, showToast } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (
      !currentUser ||
      !currentUser.role?.some((role) => role.roleName === "admin")
    ) {
      showToast("🔒 Bạn không có quyền Admin để truy cập trang này!", "error");
      navigate("/");
      return;
    }

    loadSummary();
  }, [currentUser, authLoading]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/dashboard/summary");
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || "Không tải được dữ liệu dashboard");
      }
    } catch (err) {
      console.error("Load dashboard summary error:", err);
      setError("Lỗi máy chủ khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-react">
      {/* Navbar */}
      <header className="admin-navbar">
        <Link to="/admin" className="admin-brand">
          <ChefHat size={26} />
          <span>SmartCook</span>
          <span className="admin-badge">Admin Panel</span>
        </Link>
        <nav className="admin-nav-tabs">
          <Link to="/admin" className="admin-nav-tab">
            Quản lý
          </Link>
          <Link to="/admin/dashboard" className="admin-nav-tab active">
            Thống kê
          </Link>
        </nav>
        <div className="admin-nav-actions">
          <Link to="/" className="btn-back-home">
            <Globe size={16} />
            <span>Về Trang Chủ</span>
          </Link>
          <button className="btn" onClick={handleLogout}>
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </header>

      <main className="admin-container">
        <div className="panel-header" style={{ marginBottom: 20 }}>
          <h2 className="panel-title">Thống kê tổng quan</h2>
          <button
            className="dash-refresh"
            onClick={loadSummary}
            disabled={loading}
          >
            <RefreshCw
              size={13}
              style={{ marginRight: 6, verticalAlign: -2 }}
            />
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
        </div>

        {loading && !data && (
          <p className="dash-loading">Đang tải dữ liệu dashboard…</p>
        )}

        {error && (
          <p className="dash-error">
            {error}{" "}
            <button
              className="dash-refresh"
              style={{ marginLeft: 8 }}
              onClick={loadSummary}
            >
              Thử lại
            </button>
          </p>
        )}

        {data && (
          <>
            {/* Overview */}
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h4>Tổng công thức</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.totalRecipes)}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h4>Nguyên liệu</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.totalIngredients)}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h4>Người dùng</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.totalUsers)}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h4>Danh mục</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.totalCategories)}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h4>Đơn vị đo</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.totalUnits)}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h4>TG nấu TB (phút)</h4>
                  <div className="stat-number">
                    {numberFormatter.format(data.overview.avgCookTimeMinutes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="dash-grid">
              <div className="card accent-paprika span-4">
                <span className="card-tab">Phân bố</span>
                <h3 className="card-title">Công thức theo độ khó</h3>
                {data.recipesByDifficulty.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.recipesByDifficulty.map((d) => ({
                          name:
                            DIFFICULTY_LABELS[d.difficulty] ??
                            `Mức ${d.difficulty}`,
                          value: d.count,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="#faf6ee"
                        strokeWidth={2}
                      >
                        {data.recipesByDifficulty.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12.5,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-herb span-4">
                <span className="card-tab">Top danh mục</span>
                <h3 className="card-title">Công thức theo danh mục</h3>
                {data.recipesByCategory.length ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(220, data.recipesByCategory.length * 34)}
                  >
                    <BarChart
                      data={data.recipesByCategory.map((c) => ({
                        name: c.recipeCategoryName,
                        count: c.recipeCount,
                      }))}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#ddceac"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontFamily: "Inter", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#c1432e"
                        radius={[0, 3, 3, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-turmeric span-4">
                <span className="card-tab">Top nguyên liệu</span>
                <h3 className="card-title">Nguyên liệu dùng nhiều nhất</h3>
                {data.topIngredients.length ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(220, data.topIngredients.length * 34)}
                  >
                    <BarChart
                      data={data.topIngredients.map((i) => ({
                        name: i.ingredientName,
                        count: i.usedInRecipeCount,
                      }))}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#ddceac"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontFamily: "Inter", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#5b7553"
                        radius={[0, 3, 3, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-paprika span-6">
                <span className="card-tab">Thời gian nấu</span>
                <h3 className="card-title">Phân bố theo thời gian nấu</h3>
                {data.cookTimeDistribution.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={data.cookTimeDistribution}
                      margin={{ left: 0, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#ddceac"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontFamily: "Inter", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#b8862e"
                        radius={[3, 3, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-herb span-6">
                <span className="card-tab">Tăng trưởng</span>
                <h3 className="card-title">Công thức mới theo ngày</h3>
                {data.recipesTrend.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={data.recipesTrend.map((d) => ({
                        ...d,
                        shortDate: formatShortDate(d.date),
                      }))}
                      margin={{ left: 0, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#ddceac"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 10.5 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                        allowDecimals={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#c1432e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-turmeric span-6">
                <span className="card-tab">Tăng trưởng</span>
                <h3 className="card-title">Người dùng đăng ký mới theo ngày</h3>
                {data?.usersTrend?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={data.usersTrend.map((d) => ({
                        ...d,
                        shortDate: formatShortDate(d.date),
                      }))}
                      margin={{ left: 0, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#ddceac"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 10.5 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                        allowDecimals={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          border: "1px solid #ddceac",
                          borderRadius: 3,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#5b7553"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="table-empty">Chưa có dữ liệu.</p>
                )}
              </div>

              <div className="card accent-paprika span-6">
                <span className="card-tab">Hoạt động</span>
                <h3 className="card-title">Công thức gần đây</h3>
                {data.recentRecipes.length ? (
                  <table className="recipe-table">
                    <thead>
                      <tr>
                        <th>Tên công thức</th>
                        <th>Người tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentRecipes.map((r) => (
                        <tr key={r.recipeId}>
                          <td>{r.recipeName}</td>
                          <td>
                            {r.createdByUser.firstName}{" "}
                            {r.createdByUser.lastName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="table-empty">Chưa có công thức nào gần đây.</p>
                )}
              </div>

              <div className="card accent-herb span-6">
                <span className="card-tab">Hoạt động</span>
                <h3 className="card-title">Người dùng mới</h3>
                {data?.recentUsers?.length ? (
                  <table className="recipe-table">
                    <thead>
                      <tr>
                        <th>Họ tên</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.map((u) => (
                        <tr key={u.userId}>
                          <td>
                            {u.firstName} {u.lastName}
                          </td>
                          <td>{u.email ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="table-empty">Chưa có người dùng nào gần đây.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
