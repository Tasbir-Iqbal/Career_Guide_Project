import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  Clock,
  Code,
  DollarSign,
  GraduationCap,
  Loader2,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Article = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  author_id: number | null;
  created_at: string;
};

const CATEGORIES = [
  { id: "all", label: "All Articles", icon: BookOpen },
  { id: "tech", label: "Technology", icon: Code },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "career", label: "Career Tips", icon: TrendingUp },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "finance", label: "Finance", icon: DollarSign },
];

const CATEGORY_COLORS: Record<string, string> = {
  tech: "bg-blue-50 text-blue-700",
  business: "bg-purple-50 text-purple-700",
  career: "bg-emerald-50 text-emerald-700",
  education: "bg-orange-50 text-orange-700",
  finance: "bg-teal-50 text-teal-700",
  other: "bg-gray-100 text-gray-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  tech: "Technology",
  business: "Business",
  career: "Career Tips",
  education: "Education",
  finance: "Finance",
  other: "Career Guidance",
};

function getCategoryKey(category: string | null) {
  const value = (category || "").trim().toLowerCase();

  if (
    value.includes("tech") ||
    value.includes("engineering") ||
    value.includes("programming") ||
    value.includes("data")
  ) {
    return "tech";
  }

  if (value.includes("business") || value.includes("management")) {
    return "business";
  }

  if (
    value.includes("career") ||
    value.includes("resume") ||
    value.includes("interview")
  ) {
    return "career";
  }

  if (
    value.includes("education") ||
    value.includes("academic") ||
    value.includes("university")
  ) {
    return "education";
  }

  if (
    value.includes("finance") ||
    value.includes("salary") ||
    value.includes("money")
  ) {
    return "finance";
  }

  return "other";
}

function getExcerpt(content: string) {
  if (content.length <= 170) {
    return content;
  }

  return `${content.slice(0, 170).trim()}...`;
}

function getReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadArticles() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/articles`);

        if (!response.ok) {
          throw new Error("Could not load articles.");
        }

        const data: Article[] = await response.json();
        setArticles(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load articles."
        );
      } finally {
        setLoading(false);
      }
    }

    loadArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const categoryKey = getCategoryKey(article.category);

      const matchesCategory =
        activeCategory === "all" || categoryKey === activeCategory;

      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        (article.category || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery]);

  const featuredArticle =
    activeCategory === "all" && !searchQuery ? filteredArticles[0] : null;

  const gridArticles = featuredArticle
    ? filteredArticles.filter((article) => article.id !== featuredArticle.id)
    : filteredArticles;

  function toggleSave(articleId: number) {
    setSaved((currentSaved) =>
      currentSaved.includes(articleId)
        ? currentSaved.filter((id) => id !== articleId)
        : [...currentSaved, articleId]
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium mb-5">
            <BookOpen className="w-4 h-4" />
            Career Guidance Library
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Articles & Insights
          </h1>

          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Expert-written career guidance to help you plan your academic and
            professional journey.
          </p>

          <div className="relative max-w-lg mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-12 h-12 bg-white border-0 shadow-lg text-gray-900 placeholder-gray-400 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeCategory === id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            Loading articles...
          </div>
        ) : error ? (
          <div className="bg-white max-w-xl mx-auto border border-red-200 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">
              Could not load articles
            </h2>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">
              No articles found
            </h2>
            <p className="text-gray-500">
              {articles.length === 0
                ? "No articles have been published yet."
                : "Try a different search term or category."}
            </p>
          </div>
        ) : (
          <>
            {featuredArticle && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                    Latest Article
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden grid lg:grid-cols-2">
                  <div className="min-h-64 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white flex flex-col justify-end">
                    <BookOpen className="w-12 h-12 text-white/80 mb-6" />
                    <p className="text-blue-100 text-sm">
                      CareerGuide Insight
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold leading-snug mt-2">
                      {featuredArticle.title}
                    </h2>
                  </div>

                  <div className="p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <CategoryBadge category={featuredArticle.category} />
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadTime(featuredArticle.content)}
                        </span>
                      </div>

                      <p className="text-gray-600 leading-relaxed">
                        {getExcerpt(featuredArticle.content)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          CareerGuide Team
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(featuredArticle.created_at)}
                        </p>
                      </div>

                      <Button
                        onClick={() => setSelectedArticle(featuredArticle)}
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {gridArticles.length > 0 && (
              <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArticles.map((article) => (
                  <article
                    key={article.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col"
                  >
                    <div className="h-36 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative p-5">
                      <BookOpen className="w-8 h-8 text-white/80" />

                      <button
                        onClick={() => toggleSave(article.id)}
                        className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          saved.includes(article.id)
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white/90 text-gray-500 hover:text-blue-600 shadow-sm"
                        }`}
                        aria-label="Save article"
                      >
                        <Bookmark
                          className="w-4 h-4"
                          fill={
                            saved.includes(article.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CategoryBadge category={article.category} />
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadTime(article.content)}
                        </span>
                      </div>

                      <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                        {article.title}
                      </h2>

                      <p className="text-sm text-gray-500 line-clamp-3 mb-5 flex-1">
                        {getExcerpt(article.content)}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            CareerGuide Team
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDate(article.created_at)}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Read More
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  const categoryKey = getCategoryKey(category);

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
        CATEGORY_COLORS[categoryKey]
      }`}
    >
      {category || CATEGORY_LABELS[categoryKey]}
    </span>
  );
}

function ArticleModal({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-6">
        <article className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 text-white p-7 md:p-10">
            <div className="flex justify-between items-start gap-5">
              <div>
                <CategoryBadge category={article.category} />
                <h1 className="text-2xl md:text-4xl font-bold mt-5 leading-tight">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-blue-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.created_at)}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {getReadTime(article.content)}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 shrink-0 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                aria-label="Close article"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-7 md:p-10">
            <p className="text-sm font-semibold text-gray-800 mb-6">
              Written by CareerGuide Team
            </p>

            <div className="whitespace-pre-wrap text-gray-700 leading-8">
              {article.content}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end">
              <Button onClick={onClose} variant="outline">
                Close Article
              </Button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}