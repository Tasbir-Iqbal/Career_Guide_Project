import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  FileText,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Tab =
  | "students"
  | "content"
  | "chat"
  | "webinars"
  | "feedback"
  | "account";
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

type CounselorSession = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  counselor_id: number;
  session_date: string;
  status: BookingStatus;
};

type Article = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  author_id: number | null;
  created_at: string;
};

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
};

type ChatConversation = {
  id: number;
  student_id: number;
  student_name: string;
  counselor_id: number;
  counselor_name: string;
  created_at: string;
  updated_at: string;
  last_message: ChatMessage | null;
};

type ChatConversationDetail = ChatConversation & {
  messages: ChatMessage[];
};

type CareerCategory = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

type Webinar = {
  id: number;
  counselor_id: number;
  counselor_name: string;
  category_id: number | null;
  category_name: string | null;
  title: string;
  description: string;
  scheduled_at: string;
  meeting_link?: string | null;
  max_attendees: number | null;
  attendee_count: number;
  is_registered: boolean;
  is_cancelled: boolean;
  created_at: string;
};

type WebinarAttendee = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  registered_at: string;
};

type FeedbackItem = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  feedback_type: "feedback" | "suggestion" | "complaint";
  subject: string;
  message: string;
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  reviewed_at: string | null;
};

export function CounselorDashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [sessions, setSessions] = useState<CounselorSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!token) {
      setSessionsLoading(false);
      return;
    }

    try {
      setSessionsLoading(true);
      setSessionsError("");

      const response = await fetch(`${API_URL}/counselors/me/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not load session requests.");
      }

      setSessions(await response.json());
    } catch (error) {
      setSessionsError(
        error instanceof Error ? error.message : "Could not load sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function deleteMyAccount() {
  if (!token) {
    window.alert("Your login session has expired. Please log in again.");
    return;
  }

  const confirmed = window.confirm(
    "Delete your CareerGuide counselor account permanently?\n\n" +
      "Your profile and related personal data will be removed. " +
      "Published articles may remain available without your name. " +
      "This action cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Could not delete your account.");
    }

    window.alert("Your counselor account has been deleted.");
    logout();
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Could not delete your account."
    );
  }
}
  const navigation = [
    { id: "students" as Tab, name: "Session Requests", icon: Calendar },
    { id: "content" as Tab, name: "Manage Content", icon: FileText },
    { id: "chat" as Tab, name: "Messages", icon: MessageSquare },
    { id: "webinars" as Tab, name: "Webinars", icon: Video },
    { id: "feedback" as Tab, name: "Send Feedback", icon: MessageSquarePlus },
    { id: "account" as Tab, name: "Account Settings", icon: Users },
  ];

  return (
    <div className="flex h-full flex-1 flex-col lg:flex-row">
      <aside className="w-full shrink-0 bg-slate-900 text-white lg:min-h-[calc(100vh-4rem)] lg:w-64">
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-blue-400">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">Counselor Portal</h2>
              <p className="text-xs text-slate-400">
                {user?.name || "Counselor"}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        {activeTab === "students" && (
          <SessionRequestsView
            sessions={sessions}
            loading={sessionsLoading}
            error={sessionsError}
            token={token}
            onRefresh={loadSessions}
          />
        )}

        {activeTab === "content" && (
          <ContentView token={token} currentUserId={user?.id || null} />
        )}

        {activeTab === "chat" && (
          <CounselorChatView
            token={token}
            currentUserId={user?.id || null}
          />
        )}

        {activeTab === "webinars" && <CounselorWebinarsView token={token} />}
        {activeTab === "feedback" && <CounselorFeedbackView token={token} />}
        {activeTab === "account" && (
  <CounselorAccountView onDeleteAccount={deleteMyAccount} />
)}
      </main>
    </div>
  );
}

function SessionRequestsView({
  sessions,
  loading,
  error,
  token,
  onRefresh,
}: {
  sessions: CounselorSession[];
  loading: boolean;
  error: string;
  token: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        `${session.student_name} ${session.student_email} ${session.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [sessions, query]
  );

  async function updateStatus(
    bookingId: number,
    status: "confirmed" | "completed" | "cancelled"
  ) {
    if (!token) return;

    try {
      setUpdatingId(bookingId);
      setMessage("");

      const response = await fetch(
        `${API_URL}/counselors/me/sessions/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update booking.");
      }

      setMessage(`Booking #${bookingId} is now ${status}.`);
      await onRefresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update booking."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Session Requests
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage student counseling bookings.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"
          />
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" />
          Loading sessions...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          No session requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const date = new Date(session.session_date);
            const updating = updatingId === session.id;

            return (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  {session.student_name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">
                      {session.student_name}
                    </h2>
                    <StatusBadge status={session.status} />
                  </div>

                  <p className="text-sm text-gray-500">
                    {session.student_email}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {date.toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {date.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>

                    <span>Booking #{session.id}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {session.status === "pending" && (
                    <>
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "confirmed")}
                        label="Confirm"
                        color="blue"
                      />
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "cancelled")}
                        label="Cancel"
                        color="red"
                      />
                    </>
                  )}

                  {session.status === "confirmed" && (
                    <>
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "completed")}
                        label="Complete"
                        color="green"
                      />
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "cancelled")}
                        label="Cancel"
                        color="red"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentView({
  token,
  currentUserId,
}: {
  token: string | null;
  currentUserId: number | null;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
  });

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/articles`);

      if (!response.ok) {
        throw new Error("Could not load articles.");
      }

      setArticles(await response.json());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load articles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const myArticles = articles.filter(
    (article) => article.author_id === currentUserId
  );

  async function publishArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API_URL}/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not publish article.");
      }

      setForm({ title: "", category: "", content: "" });
      setShowForm(false);
      setMessage("Article published successfully.");
      await loadArticles();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not publish article."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(articleId: number) {
    if (!token || !window.confirm("Delete this article permanently?")) {
      return;
    }

    const response = await fetch(`${API_URL}/articles/${articleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setMessage("Article deleted.");
      await loadArticles();
    } else {
      const data = await response.json().catch(() => ({}));
      setMessage(data.detail || "Could not delete article.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Content
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Publish career-guidance articles for students.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "Create Article"}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={publishArticle}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Article title"
            className="w-full rounded-lg border px-3 py-2"
          />

          <input
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            placeholder="Category, e.g. Technology or Career Tips"
            className="w-full rounded-lg border px-3 py-2"
          />

          <textarea
            required
            rows={8}
            value={form.content}
            onChange={(event) =>
              setForm({ ...form, content: event.target.value })
            }
            placeholder="Write your article content..."
            className="w-full rounded-lg border px-3 py-2"
          />

          <button
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish Article"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">
          Loading your articles...
        </div>
      ) : myArticles.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          You have not published any articles yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {myArticles.map((article) => (
            <div
              key={article.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                {article.category || "Career Guidance"}
              </span>

              <h2 className="mt-3 font-bold text-gray-900">
                {article.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                {article.content}
              </p>

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-gray-400">
                  {new Date(article.created_at).toLocaleDateString()}
                </span>

                <button
                  onClick={() => deleteArticle(article.id)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CounselorChatView({
  token,
  currentUserId,
}: {
  token: string | null;
  currentUserId: number | null;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversationDetail | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversationDetail = useCallback(
    async (conversationId: number, showLoading = false) => {
      if (!token) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(
          `${API_URL}/chat/conversations/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load this conversation.");
        }

        setActiveConversation(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not load this conversation."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  const loadConversations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ChatConversation[] = await response.json();

      if (!response.ok) {
        throw new Error("Could not load your conversations.");
      }

      setConversations(data);

      if (data.length > 0) {
        await loadConversationDetail(data[0].id);
      } else {
        setActiveConversation(null);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [token, loadConversationDetail]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversation || !token) return;

    const timer = window.setInterval(() => {
      loadConversationDetail(activeConversation.id);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [activeConversation?.id, token, loadConversationDetail]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !activeConversation || !token) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/chat/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data: ChatMessage = await response.json();

      if (!response.ok) {
        throw new Error(data.content || "Could not send your message.");
      }

      setMessageText("");

      setActiveConversation((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, data],
            }
          : current
      );

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                last_message: data,
                updated_at: data.created_at,
              }
            : conversation
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not send your message."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Messages</h1>
        <p className="mt-1 text-gray-600">
          Reply to students who have contacted you for career guidance.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No student messages yet
          </h2>
          <p className="mt-2 text-gray-500">
            When a student messages you, their conversation will appear here.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid-cols-[260px_1fr]">
          <aside className="border-b border-gray-200 bg-gray-50 md:border-b-0 md:border-r">
            <div className="border-b border-gray-200 px-4 py-4">
              <h2 className="font-bold text-gray-900">Students</h2>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {conversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() =>
                      loadConversationDetail(conversation.id, true)
                    }
                    className={`w-full border-b border-gray-100 px-4 py-4 text-left transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-white"
                    }`}
                  >
                    <p className="truncate font-semibold text-gray-900">
                      {conversation.student_name}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {conversation.last_message
                        ? conversation.last_message.content
                        : "No messages yet"}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col">
            {activeConversation ? (
              <>
                <div className="border-b border-gray-200 px-5 py-4">
                  <h2 className="font-bold text-gray-900">
                    {activeConversation.student_name}
                  </h2>
                  <p className="text-sm text-gray-500">Student</p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
                  {activeConversation.messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No messages in this conversation yet.
                    </div>
                  ) : (
                    activeConversation.messages.map((message) => {
                      const isMine = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isMine
                                ? "bg-blue-600 text-white"
                                : "border border-gray-200 bg-white text-gray-800"
                            }`}
                          >
                            {!isMine && (
                              <p className="mb-1 text-xs font-semibold text-blue-600">
                                {message.sender_name}
                              </p>
                            )}

                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                isMine ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {new Date(
                                message.created_at
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="flex gap-3 border-t border-gray-200 p-4"
                >
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a reply..."
                    maxLength={5000}
                    disabled={sending}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-10 text-center text-gray-500">
                Select a student conversation to begin.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CounselorWebinarsView({ token }: { token: string | null }) {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [categories, setCategories] = useState<CareerCategory[]>([]);
  const [attendees, setAttendees] = useState<WebinarAttendee[]>([]);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    scheduled_at: "",
    meeting_link: "",
    max_attendees: "",
  });

  const loadWebinars = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/webinars/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load your webinars.");
      }

      setWebinars(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load your webinars."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load career categories.");
      }

      setCategories(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load career categories."
      );
    }
  }, []);

  useEffect(() => {
    loadWebinars();
    loadCategories();
  }, [loadWebinars, loadCategories]);

  async function createWebinar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    if (!form.scheduled_at) {
      setError("Please select a webinar date and time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/webinars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: form.category_id ? Number(form.category_id) : null,
          title: form.title.trim(),
          description: form.description.trim(),
          scheduled_at: form.scheduled_at,
          meeting_link: form.meeting_link.trim(),
          max_attendees: form.max_attendees
            ? Number(form.max_attendees)
            : null,
        }),
      });

      const data: Webinar | { detail?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? data.detail || "Could not create webinar."
            : "Could not create webinar."
        );
      }

      const newWebinar = data as Webinar;

      setWebinars((current) =>
        [newWebinar, ...current].sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
        )
      );

      setForm({
        category_id: "",
        title: "",
        description: "",
        scheduled_at: "",
        meeting_link: "",
        max_attendees: "",
      });
      setShowForm(false);
      setMessage(`"${newWebinar.title}" was created successfully.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create webinar."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openAttendees(webinar: Webinar) {
    if (!token) return;

    try {
      setSelectedWebinar(webinar);
      setAttendees([]);
      setAttendeesLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/webinars/${webinar.id}/attendees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load webinar attendees.");
      }

      setAttendees(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load webinar attendees."
      );
      setSelectedWebinar(null);
    } finally {
      setAttendeesLoading(false);
    }
  }

  async function cancelWebinar(webinar: Webinar) {
    if (!token) return;

    const confirmed = window.confirm(
      `Cancel "${webinar.title}"? Registered students will no longer be able to join it.`
    );

    if (!confirmed) return;

    try {
      setCancellingId(webinar.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/webinars/${webinar.id}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not cancel webinar.");
      }

      setWebinars((current) =>
        current.map((item) =>
          item.id === webinar.id ? { ...item, is_cancelled: true } : item
        )
      );

      if (selectedWebinar?.id === webinar.id) {
        setSelectedWebinar({ ...selectedWebinar, is_cancelled: true });
      }

      setMessage(`"${webinar.title}" was cancelled.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not cancel webinar."
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Host Webinars</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create online career sessions and manage student registrations.
          </p>
        </div>

        <button
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "Create Webinar"}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createWebinar}
          className="mb-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="font-bold text-gray-900">Create a webinar</h2>
            <p className="mt-1 text-sm text-gray-500">
              Students can browse the webinar, but the meeting link remains
              private until they register.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                required
                minLength={3}
                maxLength={255}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Example: Careers in Technology"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Career category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={form.category_id}
                onChange={(event) =>
                  setForm({ ...form, category_id: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date and time
              </label>
              <input
                required
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(event) =>
                  setForm({ ...form, scheduled_at: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Maximum attendees{" "}
                <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={form.max_attendees}
                onChange={(event) =>
                  setForm({ ...form, max_attendees: event.target.value })
                }
                placeholder="Example: 50"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Meeting link
            </label>
            <input
              required
              minLength={8}
              maxLength={1000}
              type="url"
              value={form.meeting_link}
              onChange={(event) =>
                setForm({ ...form, meeting_link: event.target.value })
              }
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Explain what students will learn in this webinar..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating..." : "Create Webinar"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" />
          Loading your webinars...
        </div>
      ) : webinars.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Video className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No webinars created yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your first webinar to help students explore career paths.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {webinars.map((webinar) => {
            const scheduledDate = new Date(webinar.scheduled_at);
            const isPast = scheduledDate.getTime() < Date.now();
            const isFull =
              webinar.max_attendees !== null &&
              webinar.attendee_count >= webinar.max_attendees;

            return (
              <div
                key={webinar.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Video className="h-5 w-5" />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {webinar.is_cancelled ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Cancelled
                      </span>
                    ) : isPast ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        Past
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {webinar.category_name && (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {webinar.category_name}
                    </span>
                  )}

                  <h2 className="mt-3 text-lg font-bold text-gray-900">
                    {webinar.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    {webinar.description}
                  </p>
                </div>

                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    {scheduledDate.toLocaleDateString([], {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {scheduledDate.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    {webinar.attendee_count}
                    {webinar.max_attendees !== null
                      ? ` / ${webinar.max_attendees} registered`
                      : " registered"}
                    {isFull ? " (full)" : ""}
                  </p>

                  {webinar.meeting_link && (
                    <a
                      href={webinar.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 break-all text-blue-600 hover:text-blue-800"
                    >
                      <LinkIcon className="h-4 w-4 shrink-0" />
                      Open meeting link
                    </a>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => openAttendees(webinar)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Users className="h-4 w-4" />
                    View attendees
                  </button>

                  {!webinar.is_cancelled && !isPast && (
                    <button
                      onClick={() => cancelWebinar(webinar)}
                      disabled={cancellingId === webinar.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      {cancellingId === webinar.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {cancellingId === webinar.id
                        ? "Cancelling..."
                        : "Cancel webinar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedWebinar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Webinar attendees
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedWebinar.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedWebinar(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                title="Close attendees"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {attendeesLoading ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                Loading attendees...
              </div>
            ) : attendees.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No students have registered yet.
              </div>
            ) : (
              <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                      {attendee.student_name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {attendee.student_name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {attendee.student_email}
                      </p>
                    </div>

                    <p className="hidden text-xs text-gray-400 sm:block">
                      Registered{" "}
                      {new Date(
                        attendee.registered_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  onClick,
  disabled,
  label,
  color,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  color: "blue" | "green" | "red";
}) {
  const styles = {
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    green: "bg-green-600 text-white hover:bg-green-700",
    red: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 ${styles[color]}`}
    >
      {disabled ? "Updating..." : label}
    </button>
  );
}
function CounselorFeedbackView({ token }: { token: string | null }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [feedbackType, setFeedbackType] = useState<
    "feedback" | "suggestion" | "complaint"
  >("feedback");
  const [subject, setSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMyFeedback = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/feedback/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load your feedback.");
      }

      setItems(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMyFeedback();
  }, [loadMyFeedback]);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedback_type: feedbackType,
          subject: subject.trim(),
          message: feedbackMessage.trim(),
        }),
      });

      const data: FeedbackItem | { detail?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? data.detail || "Could not submit feedback."
            : "Could not submit feedback."
        );
      }

      const newItem = data as FeedbackItem;

      setItems((currentItems) => [newItem, ...currentItems]);
      setFeedbackType("feedback");
      setSubject("");
      setFeedbackMessage("");
      setMessage("Your submission was sent to the CareerGuide admin team.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not submit feedback."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function statusClasses(status: FeedbackItem["status"]) {
    if (status === "resolved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "reviewed") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-amber-100 text-amber-700";
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Send Feedback
        </h1>
        <p className="mt-1 text-gray-600">
          Share feedback, suggestions, or issues with the CareerGuide
          administrator.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={submitFeedback}
        className="mb-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-bold text-gray-900">New submission</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Type
          </label>

          <select
            value={feedbackType}
            onChange={(event) =>
              setFeedbackType(
                event.target.value as
                  | "feedback"
                  | "suggestion"
                  | "complaint"
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="feedback">Feedback</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Subject
          </label>

          <input
            required
            minLength={3}
            maxLength={255}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Briefly describe your feedback"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Message
          </label>

          <textarea
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            placeholder="Describe your feedback, suggestion, or issue..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          My submissions
        </h2>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading your submissions...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            You have not submitted any feedback yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                      {item.feedback_type}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  {item.subject}
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function CounselorAccountView({
  onDeleteAccount,
}: {
  onDeleteAccount: () => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Account Settings
        </h1>

        <p className="mt-1 text-gray-600">
          Manage your CareerGuide counselor account.
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-700">
          Danger Zone
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Deleting your counselor account permanently removes your profile,
          webinar activity, session records, feedback, and messages.
          Articles you published may remain available without your name.
        </p>

        <p className="mt-3 text-sm font-medium text-red-700">
          This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={onDeleteAccount}
          className="mt-6 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}