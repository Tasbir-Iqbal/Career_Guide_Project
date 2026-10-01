import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  MessageSquareWarning,
  Plus,
  Search,
  Tags,
  Trash2,
  UserCheck,
  Video,
  UserRoundCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Tab =
  | "accounts"
  | "applications"
  | "categories"
  | "webinars"
  | "stats"
  | "reports"
  | "feedback";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "counselor" | "admin";
  created_at: string;
};

type AdminSession = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  counselor_id: number;
  counselor_name: string;
  counselor_email: string;
  session_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
};

type AdminStats = {
  total_users: number;
  total_students: number;
  total_counselors: number;
  total_admins: number;
  total_sessions: number;
  pending_sessions: number;
  confirmed_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
};

type CounselorApplication = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  specialization: string | null;
  bio: string | null;
  availability: string | null;
  approval_status: "pending" | "approved" | "rejected";
  applied_at: string;
  reviewed_at: string | null;
};

type CareerCategory = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

type AdminWebinar = {
  id: number;
  counselor_id: number;
  counselor_name: string;
  category_id: number | null;
  category_name: string | null;
  title: string;
  description: string;
  scheduled_at: string;
  max_attendees: number | null;
  attendee_count: number;
  is_registered: boolean;
  is_cancelled: boolean;
  created_at: string;
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

type CounselorForm = {
  name: string;
  email: string;
  password: string;
  specialization: string;
  bio: string;
  availability: string;
};

const EMPTY_COUNSELOR_FORM: CounselorForm = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  bio: "",
  availability: "Available",
};

export function AdminDashboard() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<CounselorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdminData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        usersResponse,
        sessionsResponse,
        statsResponse,
        applicationsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/sessions`, { headers }),
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/counselor-applications`, { headers }),
      ]);

      if (
        !usersResponse.ok ||
        !sessionsResponse.ok ||
        !statsResponse.ok ||
        !applicationsResponse.ok
      ) {
        throw new Error(
          "Could not load admin data. Please confirm you are logged in as an admin."
        );
      }

      const [usersData, sessionsData, statsData, applicationsData] =
        await Promise.all([
          usersResponse.json(),
          sessionsResponse.json(),
          statsResponse.json(),
          applicationsResponse.json(),
        ]);

      setUsers(usersData);
      setSessions(sessionsData);
      setStats(statsData);
      setApplications(applicationsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load admin data."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const pendingApplicationCount = applications.filter(
    (application) => application.approval_status === "pending"
  ).length;

  const navigation = [
    { id: "accounts" as Tab, name: "Users & Counselors", icon: UserCheck },
    {
      id: "applications" as Tab,
      name: "Counselor Applications",
      icon: UserRoundCheck,
    },
    { id: "stats" as Tab, name: "System Stats", icon: BarChart3 },
    { id: "categories" as Tab, name: "Career Categories", icon: Tags },
    { id: "webinars" as Tab, name: "Webinar Oversight", icon: Video },
    { id: "reports" as Tab, name: "Activity Reports", icon: FileDown },
    {
      id: "feedback" as Tab,
      name: "Feedback",
      icon: MessageSquareWarning,
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col lg:flex-row">
      <aside className="w-full flex-shrink-0 bg-slate-900 text-white lg:min-h-[calc(100vh-4rem)] lg:w-64">
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/50 text-red-400">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold leading-tight">Admin Console</h2>
              <p className="text-xs text-slate-400">
                {user?.name || "System Administrator"}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.name}</span>

              {item.id === "applications" && pendingApplicationCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                  {pendingApplicationCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            Loading admin data...
          </div>
        ) : error ? (
          <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Could not load Admin Console
            </h1>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={loadAdminData}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {activeTab === "accounts" && (
              <AccountsView
                users={users}
                token={token}
                onCounselorCreated={loadAdminData}
              />
            )}

            {activeTab === "applications" && (
              <CounselorApplicationsView
                applications={applications}
                token={token}
                onRefresh={loadAdminData}
              />
            )}

            {activeTab === "stats" && (
              <StatsView stats={stats} sessions={sessions} />
            )}

            {activeTab === "categories" && <CategoriesView />}
            {activeTab === "webinars" && <AdminWebinarsView token={token} />}
            {activeTab === "reports" && <ReportsView />}
            {activeTab === "feedback" && <FeedbackView />}
          </>
        )}
      </main>
    </div>
  );
}

function AccountsView({
  users,
  token,
  onCounselorCreated,
}: {
  users: AdminUser[];
  token: string | null;
  onCounselorCreated: () => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CounselorForm>(EMPTY_COUNSELOR_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        account.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  async function createCounselor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setMessage("Your login session has expired.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API_URL}/admin/counselors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          specialization: form.specialization.trim() || null,
          bio: form.bio.trim() || null,
          availability: form.availability.trim() || "Available",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create counselor.");
      }

      setMessage(`Counselor account for ${data.name} was created and approved.`);
      setForm(EMPTY_COUNSELOR_FORM);
      setShowForm(false);
      await onCounselorCreated();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not create counselor."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Users & Counselor Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Review registered users or create an approved counselor account.
          </p>
        </div>

        <button
          onClick={() => {
            setMessage("");
            setShowForm(!showForm);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close Form" : "Create Counselor"}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createCounselor}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 font-bold text-gray-900">
            Create Approved Counselor Account
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Full name", "text"],
              ["email", "Email address", "email"],
              ["password", "Temporary password", "password"],
              ["specialization", "Specialization", "text"],
              ["availability", "Availability", "text"],
            ].map(([field, label, type]) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type={type}
                  required={
                    field === "name" ||
                    field === "email" ||
                    field === "password"
                  }
                  value={form[field as keyof CounselorForm]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [field]: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Counselor bio
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) =>
                  setForm({ ...form, bio: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating..." : "Create and Approve Counselor"}
          </button>
        </form>
      )}

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredUsers.map((account) => (
              <tr key={account.id}>
                <td className="p-4 font-medium text-gray-900">
                  {account.name}
                </td>
                <td className="p-4 text-gray-600">{account.email}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      account.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : account.role === "counselor"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {account.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(account.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-sm text-gray-500"
                >
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CounselorApplicationsView({
  applications,
  token,
  onRefresh,
}: {
  applications: CounselorApplication[];
  token: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredApplications = applications.filter((application) =>
    filter === "all"
      ? true
      : application.approval_status === filter
  );

  async function reviewApplication(
    application: CounselorApplication,
    approvalStatus: "approved" | "rejected"
  ) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    const action = approvalStatus === "approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${application.name}'s counselor application?`
      )
    ) {
      return;
    }

    try {
      setReviewingId(application.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/admin/counselor-applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approval_status: approvalStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not review this application.");
      }

      setMessage(
        `${data.name}'s counselor application was ${approvalStatus}.`
      );

      await onRefresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not review this application."
      );
    } finally {
      setReviewingId(null);
    }
  }

  function statusStyle(status: CounselorApplication["approval_status"]) {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-amber-100 text-amber-700";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Counselor Applications
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review counselor registrations before allowing access to the
          Counselor Portal.
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

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["all", "All applications"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === value
                ? "bg-blue-600 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <UserRoundCheck className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No {filter === "all" ? "" : filter} applications
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Counselor applications will appear here when someone registers as
            a counselor.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const reviewing = reviewingId === application.id;

            return (
              <div
                key={application.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
                      {application.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">
                          {application.name}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            application.approval_status
                          )}`}
                        >
                          {application.approval_status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {application.email}
                      </p>

                      <p className="mt-3 text-sm">
                        <span className="font-semibold text-gray-700">
                          Specialization:
                        </span>{" "}
                        <span className="text-gray-600">
                          {application.specialization || "Not provided"}
                        </span>
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {application.bio || "No professional bio provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                        <span>
                          Availability:{" "}
                          {application.availability || "Not provided"}
                        </span>
                        <span>
                          Applied:{" "}
                          {new Date(
                            application.applied_at
                          ).toLocaleDateString()}
                        </span>
                        {application.reviewed_at && (
                          <span>
                            Reviewed:{" "}
                            {new Date(
                              application.reviewed_at
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {application.approval_status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() =>
                          reviewApplication(application, "approved")
                        }
                        disabled={reviewing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {reviewing ? "Saving..." : "Approve"}
                      </button>

                      <button
                        onClick={() =>
                          reviewApplication(application, "rejected")
                        }
                        disabled={reviewing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
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

function StatsView({
  stats,
  sessions,
}: {
  stats: AdminStats | null;
  sessions: AdminSession[];
}) {
  if (!stats) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        System Statistics
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Live totals from the CareerGuide database.
      </p>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Users", stats.total_users, Users],
          ["Students", stats.total_students, UserCheck],
          ["Counselors", stats.total_counselors, UserRoundCheck],
          ["Total Sessions", stats.total_sessions, Calendar],
        ].map(([label, value, Icon]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <Icon className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">Session Status</h2>

          {[
            ["Pending", stats.pending_sessions, "bg-amber-500"],
            ["Confirmed", stats.confirmed_sessions, "bg-blue-500"],
            ["Completed", stats.completed_sessions, "bg-green-500"],
            ["Cancelled", stats.cancelled_sessions, "bg-red-500"],
          ].map(([label, count, color]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between border-b py-3 last:border-0"
            >
              <span className="flex items-center gap-2 text-gray-700">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                {label}
              </span>
              <span className="font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">Recent Bookings</h2>

          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="border-b py-3 last:border-0">
              <p className="text-sm font-medium text-gray-900">
                {session.student_name} → {session.counselor_name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(session.session_date).toLocaleString()} ·{" "}
                {session.status}
              </p>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-sm text-gray-500">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesView() {
  const { token } = useAuth();

  const [categories, setCategories] = useState<CareerCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data: CareerCategory | { detail?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? data.detail || "Could not create this category."
            : "Could not create this category."
        );
      }

      const newCategory = data as CareerCategory;

      setCategories((currentCategories) =>
        [...currentCategories, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setName("");
      setDescription("");
      setMessage(`"${newCategory.name}" was added successfully.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not create this category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: CareerCategory) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${category.name}" category? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/categories/${category.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not delete this category.");
      }

      setCategories((currentCategories) =>
        currentCategories.filter((item) => item.id !== category.id)
      );

      setMessage(`"${category.name}" was deleted.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete this category."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Career Categories
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create and manage the categories used throughout CareerGuide.
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
        onSubmit={createCategory}
        className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 font-bold text-gray-900">Add Career Category</h2>

        <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Category name
            </label>

            <input
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Technology"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>

            <input
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Example: Careers in software, data, and IT"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Adding..." : "Add Category"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading career categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Tags className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No career categories yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first category above. For example: Technology, Healthcare,
            Business, or Creative Arts.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex min-h-36 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Tags className="h-5 w-5" />
                </div>

                <button
                  onClick={() => deleteCategory(category)}
                  disabled={deletingId === category.id}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  title={`Delete ${category.name}`}
                >
                  {deletingId === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <h2 className="mt-4 font-bold text-gray-900">
                {category.name}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                {category.description || "No description provided."}
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Added {new Date(category.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsView() {
  const { token } = useAuth();

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function downloadReport() {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/reports/activity.csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not generate the activity report.");
      }

      const csvBlob = await response.blob();

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(
        /filename="([^"]+)"/
      );
      const filename =
        filenameMatch?.[1] || "careerguide_activity_report.csv";

      const downloadUrl = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not download the activity report."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileDown className="mx-auto mb-4 h-12 w-12 text-blue-500" />

        <h1 className="text-xl font-bold text-gray-900">
          Activity Reports
        </h1>

        <p className="mx-auto mt-2 max-w-2xl text-gray-600">
          Download a CSV report with current user totals, counseling session
          statuses, webinar activity and registrations, and feedback
          statistics.
        </p>

        <button
          onClick={downloadReport}
          disabled={downloading}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {downloading ? "Preparing report..." : "Download CSV Report"}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
        <h2 className="font-bold">Included in the report</h2>

        <ul className="mt-2 space-y-1 text-blue-700">
          <li>Users grouped by role: students, counselors, and admins.</li>
          <li>Counseling sessions grouped by pending, confirmed, completed, and cancelled status.</li>
          <li>Webinar totals, upcoming sessions, cancellations, and student registrations.</li>
          <li>Feedback totals grouped by new, reviewed, resolved, feedback, suggestions, and complaints.</li>
        </ul>
      </div>
    </div>
  );
}

function FeedbackView() {
  const { token } = useAuth();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "new" | "reviewed" | "resolved"
  >("new");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "feedback" | "suggestion" | "complaint"
  >("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFeedback = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/feedback/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load feedback.");
      }

      setItems(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesType =
      typeFilter === "all" || item.feedback_type === typeFilter;

    return matchesStatus && matchesType;
  });

  async function updateStatus(
    item: FeedbackItem,
    nextStatus: "reviewed" | "resolved"
  ) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setUpdatingId(item.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/feedback/${item.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data: FeedbackItem | { detail?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? data.detail || "Could not update feedback status."
            : "Could not update feedback status."
        );
      }

      const updatedItem = data as FeedbackItem;

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );

      setMessage(
        `"${updatedItem.subject}" was marked as ${updatedItem.status}.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update feedback status."
      );
    } finally {
      setUpdatingId(null);
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

  function typeClasses(type: FeedbackItem["feedback_type"]) {
    if (type === "complaint") {
      return "bg-red-100 text-red-700";
    }

    if (type === "suggestion") {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Feedback & Complaints
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review submissions from students and counselors, then track their
          resolution status.
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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["new", "New"],
              ["reviewed", "Reviewed"],
              ["resolved", "Resolved"],
              ["all", "All statuses"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                statusFilter === value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value as
                | "all"
                | "feedback"
                | "suggestion"
                | "complaint"
            )
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All types</option>
          <option value="feedback">Feedback</option>
          <option value="suggestion">Suggestions</option>
          <option value="complaint">Complaints</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" />
          Loading feedback...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <MessageSquareWarning className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No matching feedback
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Feedback from students and counselors will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const updating = updatingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeClasses(
                          item.feedback_type
                        )}`}
                      >
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

                    <h2 className="mt-3 text-lg font-bold text-gray-900">
                      {item.subject}
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {item.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span>
                        From: {item.user_name} ({item.user_role})
                      </span>
                      <span>{item.user_email}</span>
                      <span>
                        Submitted:{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      {item.reviewed_at && (
                        <span>
                          Last reviewed:{" "}
                          {new Date(item.reviewed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status !== "resolved" && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.status === "new" && (
                        <button
                          onClick={() => updateStatus(item, "reviewed")}
                          disabled={updating}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          {updating && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Mark Reviewed
                        </button>
                      )}

                      <button
                        onClick={() => updateStatus(item, "resolved")}
                        disabled={updating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {updating && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Mark Resolved
                      </button>
                    </div>
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

function AdminWebinarsView({ token }: { token: string | null }) {
  const [webinars, setWebinars] = useState<AdminWebinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadWebinars = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/webinars/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load webinars.");
      }

      setWebinars(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load webinars."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWebinars();
  }, [loadWebinars]);

  async function cancelWebinar(webinar: AdminWebinar) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel "${webinar.title}" by ${webinar.counselor_name}? Registered students will no longer be able to join it.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(webinar.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/webinars/${webinar.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not cancel this webinar.");
      }

      setWebinars((currentWebinars) =>
        currentWebinars.map((item) =>
          item.id === webinar.id ? { ...item, is_cancelled: true } : item
        )
      );

      setMessage(`"${webinar.title}" was cancelled.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not cancel this webinar."
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Webinar Oversight
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review webinars created by counselors and cancel invalid or
          inappropriate sessions when necessary.
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

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" />
          Loading webinars...
        </div>
      ) : webinars.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Video className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No webinars created yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Counselor-created webinars will appear here for review.
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

                <div className="mt-4">
                  {webinar.category_name && (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {webinar.category_name}
                    </span>
                  )}

                  <h2 className="mt-3 text-lg font-bold text-gray-900">
                    {webinar.title}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Hosted by {webinar.counselor_name}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
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
                </div>

                {!webinar.is_cancelled && !isPast && (
                  <button
                    onClick={() => cancelWebinar(webinar)}
                    disabled={cancellingId === webinar.id}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
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
            );
          })}
        </div>
      )}
    </div>
  );
}