import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Map,
  MessageSquare,
  MessageSquarePlus,
  Sparkles,
  Star,
  Video,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Tab =
  | "ai-guide"
  | "roadmaps"
  | "sessions"
  | "saved"
  | "chat"
  | "webinars"
  | "feedback"
  | "account";

type SessionBooking = {
  id: number;
  student_id: number;
  counselor_id: number;
  session_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
};

type ApiCounselor = {
  id: number;
  user_id: number;
  name: string;
  specialization: string | null;
};

type CareerRecommendation = {
  id: number;
  career_title: string;
  match_percentage: number;
  reason: string;
  is_selected: boolean;
  generated_at: string;
};

type RoadmapStep = {
  title: string;
  description: string;
};
type DetailedRoadmapStage = {
  stage_number: number;
  title: string;
  timeframe: string;
  goal: string;
  actions: string[];
  deliverable: string;
  readiness_check: string;
};

type DetailedRoadmap = {
  career_title: string;
  career_goal: string;
  starting_point: string;
  estimated_total_duration: string;
  first_7_days: string[];
  stages: DetailedRoadmapStage[];
  portfolio_projects: string[];
  free_or_low_cost_resources: string[];
  common_mistakes: string[];
  next_best_action: string;
  local_requirements_note: string;
};

type DetailedRoadmapResponse = {
  id: number;
  student_id: number;
  recommendation_id: number;
  career_title: string;
  roadmap: DetailedRoadmap;
  created_at: string;
  updated_at: string;
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

export function StudentDashboard() {
  const { user, token, logout } = useAuth();;

  const [activeTab, setActiveTab] = useState<Tab>("ai-guide");
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [counselorNames, setCounselorNames] = useState<Record<number, string>>(
    {}
  );
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadBookings = useCallback(async () => {
    if (!token) {
      setSessionsLoading(false);
      return;
    }

    try {
      setSessionsLoading(true);
      setSessionsError("");

      const [sessionsResponse, counselorsResponse] = await Promise.all([
        fetch(`${API_URL}/students/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/counselors`),
      ]);

      if (!sessionsResponse.ok) {
        throw new Error("Could not load your booked sessions.");
      }

      if (!counselorsResponse.ok) {
        throw new Error("Could not load counselor information.");
      }

      const sessionsData: SessionBooking[] = await sessionsResponse.json();
      const counselorsData: ApiCounselor[] = await counselorsResponse.json();

      const names = counselorsData.reduce<Record<number, string>>(
        (result, counselor) => {
          result[counselor.user_id] = counselor.name;
          return result;
        },
        {}
      );

      setBookings(sessionsData);
      setCounselorNames(names);
    } catch (error) {
      setSessionsError(
        error instanceof Error
          ? error.message
          : "Could not load your booked sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function cancelBooking(bookingId: number) {
    if (!token) {
      setActionError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setCancellingId(bookingId);
      setActionError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/students/sessions/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not cancel this session.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "cancelled" }
            : booking
        )
      );

      setActionMessage(`Booking #${bookingId} was cancelled successfully.`);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not cancel this session."
      );
    } finally {
      setCancellingId(null);
    }
  }
  async function deleteMyAccount() {
  if (!token) {
    window.alert("Your login session has expired. Please log in again.");
    return;
  }

  const confirmed = window.confirm(
    "Delete your CareerGuide account permanently?\n\n" +
      "Your profile and related personal data will be removed. " +
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

    window.alert("Your account has been deleted.");
    logout();
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Could not delete your account."
    );
  }
}
  const navigationItems: {
    id: Tab;
    name: string;
    icon: typeof BrainCircuit;
  }[] = [
    { id: "ai-guide", name: "AI Career Match", icon: BrainCircuit },
    { id: "roadmaps", name: "My Roadmaps", icon: Map },
    { id: "sessions", name: "My Sessions", icon: Calendar },
    { id: "saved", name: "Saved Paths", icon: Star },
    { id: "chat", name: "Counselor Chat", icon: MessageSquare },
    { id: "webinars", name: "Webinars", icon: Video },
    { id: "feedback", name: "Send Feedback", icon: MessageSquarePlus },
    { id: "account", name: "Account Settings", icon: GraduationCap },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full">
      <aside className="w-full lg:w-64 bg-white border-r border-gray-200 lg:min-h-[calc(100vh-4rem)] flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900 leading-tight">
                Student Portal
              </h2>
              <p className="text-sm text-gray-500">
                Welcome, {user?.name || "Student"}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 bg-gray-50 overflow-y-auto">
        {activeTab === "ai-guide" && <AIGuideView token={token} />}

        {activeTab === "roadmaps" && <RoadmapsView token={token} />}

        {activeTab === "sessions" && (
          <SessionsView
            bookings={bookings}
            counselorNames={counselorNames}
            loading={sessionsLoading}
            error={sessionsError}
            actionMessage={actionMessage}
            actionError={actionError}
            cancellingId={cancellingId}
            onCancel={cancelBooking}
          />
        )}

        {activeTab === "saved" && <SavedPathsView token={token} />}

        {activeTab === "chat" && (
  <ChatView token={token} currentUserId={user?.id ?? null} />
)}
{activeTab === "webinars" && <StudentWebinarsView token={token} />}
{activeTab === "feedback" && <StudentFeedbackView token={token} />}
{activeTab === "account" && (
  <StudentAccountView onDeleteAccount={deleteMyAccount} />
)}
      </main>
    </div>
  );
}

function SessionsView({
  bookings,
  counselorNames,
  loading,
  error,
  actionMessage,
  actionError,
  cancellingId,
  onCancel,
}: {
  bookings: SessionBooking[];
  counselorNames: Record<number, string>;
  loading: boolean;
  error: string;
  actionMessage: string;
  actionError: string;
  cancellingId: number | null;
  onCancel: (bookingId: number) => Promise<void>;
}) {
  function getStatusClasses(status: SessionBooking["status"]) {
    if (status === "confirmed") return "bg-blue-100 text-blue-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  }

  function formatStatus(status: SessionBooking["status"]) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500">
        Loading your sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">
          My Counseling Sessions
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          My Counseling Sessions
        </h1>
        <p className="text-gray-600 mt-1">
          Review your upcoming and previous counseling bookings.
        </p>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">
            No sessions booked yet
          </h2>
          <p className="text-gray-500 mt-2">
            Visit the Counselors page to choose a counselor and book a session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const date = new Date(booking.session_date);
            const canCancel =
              booking.status === "pending" || booking.status === "confirmed";

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-5"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">
                      {counselorNames[booking.counselor_id] ||
                        "Career Counselor"}
                    </h2>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                        booking.status
                      )}`}
                    >
                      {formatStatus(booking.status)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {date.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {date.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <p className="text-sm text-gray-400">
                    Booking #{booking.id}
                  </p>

                  {canCancel && (
                    <button
                      onClick={() => onCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancellingId === booking.id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </button>
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

function AIGuideView({ token }: { token: string | null }) {
  const [educationLevel, setEducationLevel] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [favoriteSubjects, setFavoriteSubjects] = useState("");
  const [workStyle, setWorkStyle] = useState("");
  const [recommendations, setRecommendations] = useState<
    CareerRecommendation[]
  >([]);
  const [detailedRoadmap, setDetailedRoadmap] =
  useState<DetailedRoadmapResponse | null>(null);

  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  const [isRoadmapGenerating, setIsRoadmapGenerating] = useState(false);

  const [roadmapError, setRoadmapError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecommendations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/recommendations/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load your career recommendations."
        );
      }

      setRecommendations(data.recommendations || []);

      if (data.assessment) {
        setEducationLevel(data.assessment.education_level || "");
        setSkills(data.assessment.skills || "");
        setInterests(data.assessment.interests || "");
        setFavoriteSubjects(data.assessment.favorite_subjects || "");
        setWorkStyle(data.assessment.work_style || "");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your career recommendations."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/recommendations/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          education_level: educationLevel,
          interests,
          skills,
          favorite_subjects: favoriteSubjects,
          work_style: workStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not generate career recommendations."
        );
      }

      setRecommendations(data.recommendations || []);
      setMessage(
        "Your new results are ready. Please choose one career path to personalize your roadmap."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not generate career recommendations."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function chooseCareerPath(recommendation: CareerRecommendation) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setSelectingId(recommendation.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/recommendations/${recommendation.id}/select`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not select this career path.");
      }

      setRecommendations((currentRecommendations) =>
        currentRecommendations.map((item) => ({
          ...item,
          is_selected: item.id === data.id,
        }))
      );

      setMessage(
        `${data.career_title} is now your selected career path. Your roadmap is ready.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not select this career path."
      );
    } finally {
      setSelectingId(null);
    }
  }

  function startNewAssessment() {
    setRecommendations([]);
    setMessage("");
    setError("");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          AI Career Match
        </h1>
        <p className="mt-1 text-gray-600">
          Complete the assessment to receive career paths matched to your
          interests, strengths, and preferred work style.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading your career assessment...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form className="space-y-6" onSubmit={handleGenerate}>
            <div>
              <label
                htmlFor="educationLevel"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Education level
              </label>
              <select
                id="educationLevel"
                required
                value={educationLevel}
                onChange={(event) => setEducationLevel(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your education level</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="skills"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Your strongest skills
              </label>
              <textarea
                id="skills"
                required
                minLength={2}
                rows={3}
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder="Example: Python, Excel, communication, problem solving"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="interests"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Interests and hobbies
              </label>
              <textarea
                id="interests"
                required
                minLength={2}
                rows={3}
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
                placeholder="Example: Technology, data analysis, design, helping people"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="favoriteSubjects"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Favorite subjects
              </label>
              <textarea
                id="favoriteSubjects"
                required
                minLength={2}
                rows={2}
                value={favoriteSubjects}
                onChange={(event) => setFavoriteSubjects(event.target.value)}
                placeholder="Example: Mathematics, Computer Science, English"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="workStyle"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Preferred work style
              </label>
              <select
                id="workStyle"
                required
                value={workStyle}
                onChange={(event) => setWorkStyle(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a work style</option>
                <option value="Analytical and structured">
                  Analytical and structured
                </option>
                <option value="Creative and visual">
                  Creative and visual
                </option>
                <option value="Social and collaborative">
                  Social and collaborative
                </option>
                <option value="Leadership and planning">
                  Leadership and planning
                </option>
                <option value="Practical and hands-on">
                  Practical and hands-on
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:opacity-70"
            >
              <Sparkles className="h-5 w-5" />
              {generating
                ? "Analyzing your profile..."
                : "Generate Career Recommendations"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-blue-800">
              Generate new results if your interests, skills, or goals have
              changed. Choosing fresh results will reset your previous career
              selection.
            </p>

            <button
              onClick={startNewAssessment}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Take Assessment Again
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`rounded-xl border bg-white p-6 shadow-sm ${
                  recommendation.is_selected
                    ? "border-green-300 ring-2 ring-green-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <BrainCircuit
                    className={`h-8 w-8 ${
                      recommendation.is_selected
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  />

                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {recommendation.match_percentage}% Match
                  </span>
                </div>

                {recommendation.is_selected && (
                  <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selected path
                  </span>
                )}

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {recommendation.career_title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {recommendation.reason}
                </p>

                <button
                  onClick={() => chooseCareerPath(recommendation)}
                  disabled={
                    recommendation.is_selected ||
                    selectingId === recommendation.id
                  }
                  className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    recommendation.is_selected
                      ? "cursor-default bg-green-100 text-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                  }`}
                >
                  {recommendation.is_selected
                    ? "Selected Career"
                    : selectingId === recommendation.id
                    ? "Selecting..."
                    : "Choose This Career"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapsView({ token }: { token: string | null }) {
  const [topCareer, setTopCareer] = useState<CareerRecommendation | null>(
    null
  );
  const [detailedRoadmap, setDetailedRoadmap] =
  useState<DetailedRoadmapResponse | null>(null);

  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  const [isRoadmapGenerating, setIsRoadmapGenerating] = useState(false);

  const [roadmapError, setRoadmapError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTopCareer = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/recommendations/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load your career roadmap.");
      }

      const recommendations: CareerRecommendation[] =
        data.recommendations || [];

      const selectedCareer =
  recommendations.find((recommendation) => recommendation.is_selected) || null;

setTopCareer(selectedCareer || recommendations[0] || null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your career roadmap."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);
  const loadSavedRoadmap = useCallback(
  async (recommendationId: number) => {
    if (!token) {
      return;
    }

    setIsRoadmapLoading(true);
    setRoadmapError("");

    try {
      const response = await fetch(
        `${API_URL}/recommendations/${recommendationId}/roadmap`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 404) {
        setDetailedRoadmap(null);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load the saved roadmap.");
      }

      setDetailedRoadmap(data as DetailedRoadmapResponse);
    } catch (error) {
      setRoadmapError(
        error instanceof Error
          ? error.message
          : "Could not load the saved roadmap.",
      );
    } finally {
      setIsRoadmapLoading(false);
    }
  },
  [token],
);
const generateDetailedRoadmap = async (recommendationId: number) => {
  if (!token) {
    setRoadmapError("Please sign in again before generating a roadmap.");
    return;
  }

  setIsRoadmapGenerating(true);
  setRoadmapError("");

  try {
    const response = await fetch(
      `${API_URL}/recommendations/${recommendationId}/roadmap`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not generate the detailed roadmap.");
    }

    setDetailedRoadmap(data as DetailedRoadmapResponse);
  } catch (error) {
    setRoadmapError(
      error instanceof Error
        ? error.message
        : "Could not generate the detailed roadmap.",
    );
  } finally {
    setIsRoadmapGenerating(false);
  }
};
  useEffect(() => {
  loadTopCareer();
}, [loadTopCareer]);

useEffect(() => {
  if (topCareer?.is_selected) {
    loadSavedRoadmap(topCareer.id);
  } else {
    setDetailedRoadmap(null);
    setRoadmapError("");
  }
}, [topCareer, loadSavedRoadmap]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500">
        Loading your personalized roadmap...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">My Roadmap</h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!topCareer) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">My Roadmap</h1>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Map className="mx-auto mb-4 h-12 w-12 text-blue-300" />

          <h2 className="text-lg font-bold text-gray-900">
            Generate career recommendations first
          </h2>

          <p className="mt-2 text-gray-500">
            Your personalized roadmap will be created from your highest career
            match.
          </p>
        </div>
      </div>
    );
  }

  const roadmap = getRoadmapForCareer(topCareer.career_title);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {topCareer.match_percentage}% Career Match
          </span>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {topCareer.career_title} Roadmap
          </h1>

          <p className="text-gray-600 mt-1">
  {topCareer.is_selected
    ? "A learning path based on the career path you selected."
    : "A learning path based on your highest AI career recommendation."}
</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
  {!detailedRoadmap && topCareer.is_selected && (
    <button
      onClick={() => generateDetailedRoadmap(topCareer.id)}
      disabled={isRoadmapGenerating || isRoadmapLoading}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Sparkles className="h-4 w-4" />
      {isRoadmapGenerating
        ? "Generating your roadmap..."
        : "Generate Detailed AI Roadmap"}
    </button>
  )}

  <button
    onClick={() => window.print()}
    className="flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
  >
    <Download className="h-4 w-4" />
    Print Roadmap
  </button>
</div>
      </div>
      {roadmapError && (
  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {roadmapError}
  </div>
)}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Why this path:</strong> {topCareer.reason}
      </div>

      {isRoadmapLoading ? (
  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
    Loading your saved detailed roadmap...
  </div>
) : detailedRoadmap ? (
  <div className="space-y-6">
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
      <h2 className="text-xl font-bold text-gray-900">
        {detailedRoadmap.roadmap.career_goal}
      </h2>

      <p className="mt-2 text-sm text-gray-700">
        <strong>Starting point:</strong>{" "}
        {detailedRoadmap.roadmap.starting_point}
      </p>

      <p className="mt-2 text-sm text-gray-700">
        <strong>Estimated duration:</strong>{" "}
        {detailedRoadmap.roadmap.estimated_total_duration}
      </p>
    </div>

    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <h2 className="text-lg font-bold text-green-900">
        Your first 7 days
      </h2>

      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-900">
        {detailedRoadmap.roadmap.first_7_days.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>

    <div className="space-y-4">
      {detailedRoadmap.roadmap.stages.map((stage) => (
        <div
          key={stage.stage_number}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Stage {stage.stage_number} · {stage.timeframe}
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {stage.title}
              </h2>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {stage.timeframe}
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-700">{stage.goal}</p>

          <h3 className="mt-4 text-sm font-bold text-gray-900">
            Actions
          </h3>

          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700">
            {stage.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              <strong>Deliverable:</strong> {stage.deliverable}
            </p>

            <p className="mt-2">
              <strong>Readiness check:</strong> {stage.readiness_check}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
        <h2 className="text-lg font-bold text-purple-900">
          Portfolio projects
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-purple-900">
          {detailedRoadmap.roadmap.portfolio_projects.map((project) => (
            <li key={project}>{project}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-bold text-amber-900">
          Common mistakes to avoid
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900">
          {detailedRoadmap.roadmap.common_mistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </div>
    </div>

    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
      <h2 className="text-lg font-bold text-cyan-900">
        Free or low-cost resources
      </h2>

      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-cyan-900">
        {detailedRoadmap.roadmap.free_or_low_cost_resources.map(
          (resource) => (
            <li key={resource}>{resource}</li>
          ),
        )}
      </ul>
    </div>

    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-bold text-blue-900">
        Next best action
      </h2>

      <p className="mt-2 text-sm text-blue-900">
        {detailedRoadmap.roadmap.next_best_action}
      </p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      {detailedRoadmap.roadmap.local_requirements_note}
    </div>
  </div>
) : (
  <div className="space-y-4">
    {roadmap.map((step, index) => (
      <div
        key={step.title}
        className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {index + 1}
        </span>

        <div>
          <h2 className="font-bold text-gray-900">{step.title}</h2>

          <p className="mt-1 text-sm text-gray-600">
            {step.description}
          </p>
        </div>
      </div>
    ))}
  </div>
)}
    </div>
  );
}

function getRoadmapForCareer(careerTitle: string): RoadmapStep[] {
  const roadmaps: Record<string, RoadmapStep[]> = {
    "Data Analyst": [
      {
        title: "Master spreadsheet analysis",
        description:
          "Practice Excel or Google Sheets formulas, pivot tables, cleaning data, and creating basic charts.",
      },
      {
        title: "Learn SQL for databases",
        description:
          "Write SELECT queries, filters, joins, aggregations, and window functions using sample datasets.",
      },
      {
        title: "Build statistics foundations",
        description:
          "Study descriptive statistics, probability, distributions, hypothesis testing, and correlation.",
      },
      {
        title: "Analyze data with Python",
        description:
          "Use Python with Pandas, NumPy, and Matplotlib to clean, analyze, and visualize real datasets.",
      },
      {
        title: "Create a portfolio dashboard",
        description:
          "Build two or three public projects using Power BI, Tableau, or Python and document your findings.",
      },
      {
        title: "Prepare for analyst interviews",
        description:
          "Practice SQL questions, explain your projects clearly, and solve business-case exercises.",
      },
    ],

    "Machine Learning Engineer": [
      {
        title: "Strengthen Python programming",
        description:
          "Practice functions, object-oriented programming, data structures, Git, testing, and clean code.",
      },
      {
        title: "Learn mathematical foundations",
        description:
          "Study linear algebra, calculus basics, probability, statistics, and optimization concepts.",
      },
      {
        title: "Work with data",
        description:
          "Use Pandas, NumPy, data cleaning, visualization, and exploratory data analysis on real datasets.",
      },
      {
        title: "Learn core machine learning",
        description:
          "Build regression, classification, clustering, and model-evaluation projects with scikit-learn.",
      },
      {
        title: "Create deployed ML projects",
        description:
          "Build end-to-end projects and expose models through APIs using FastAPI or Flask.",
      },
      {
        title: "Prepare an ML portfolio",
        description:
          "Publish projects on GitHub with clear READMEs, datasets, methods, metrics, and lessons learned.",
      },
    ],

    "Backend Developer": [
      {
        title: "Build programming foundations",
        description:
          "Practice Python or JavaScript, data structures, problem solving, Git, and command-line basics.",
      },
      {
        title: "Learn databases and SQL",
        description:
          "Design relational tables and practice CRUD operations, joins, indexes, and database relationships.",
      },
      {
        title: "Build REST APIs",
        description:
          "Create secure APIs with FastAPI or Node.js, request validation, authentication, and error handling.",
      },
      {
        title: "Add authentication and security",
        description:
          "Implement password hashing, JWT authentication, role permissions, environment variables, and CORS.",
      },
      {
        title: "Test and deploy projects",
        description:
          "Write tests, use GitHub, deploy a backend, and connect it to a frontend and database.",
      },
      {
        title: "Prepare for backend interviews",
        description:
          "Practice API design, SQL, system basics, debugging, and explaining your completed projects.",
      },
    ],

    "Frontend Developer": [
      {
        title: "Learn web fundamentals",
        description:
          "Master semantic HTML, modern CSS, responsive layouts, accessibility, and browser developer tools.",
      },
      {
        title: "Strengthen JavaScript",
        description:
          "Practice ES6+, asynchronous code, APIs, array methods, DOM concepts, and error handling.",
      },
      {
        title: "Build with React",
        description:
          "Learn components, props, state, hooks, forms, routing, and reusable UI patterns.",
      },
      {
        title: "Improve UI and UX skills",
        description:
          "Use Figma, spacing, typography, color systems, responsive design, and accessible interactions.",
      },
      {
        title: "Create portfolio projects",
        description:
          "Build polished responsive applications and publish them with live demos and GitHub repositories.",
      },
      {
        title: "Prepare for frontend interviews",
        description:
          "Review JavaScript, React patterns, accessibility, CSS layouts, and your portfolio decisions.",
      },
    ],

    "Cybersecurity Analyst": [
      {
        title: "Learn networking fundamentals",
        description:
          "Study TCP/IP, DNS, HTTP, ports, routing, firewalls, and how common network attacks work.",
      },
      {
        title: "Practice Linux and command line",
        description:
          "Use Linux navigation, permissions, processes, logs, shell tools, and basic scripting.",
      },
      {
        title: "Study security fundamentals",
        description:
          "Learn threat models, vulnerability management, encryption, authentication, and access control.",
      },
      {
        title: "Use security tools",
        description:
          "Practice with Wireshark, Nmap, SIEM concepts, log analysis, and a safe home lab.",
      },
      {
        title: "Document security projects",
        description:
          "Create write-ups showing investigations, risk findings, remediation suggestions, and ethics.",
      },
      {
        title: "Prepare for entry-level roles",
        description:
          "Review incident response, SOC workflows, security alerts, and certification objectives.",
      },
    ],

    "UX/UI Designer": [
      {
        title: "Learn design fundamentals",
        description:
          "Practice hierarchy, color, typography, spacing, grids, visual consistency, and accessibility.",
      },
      {
        title: "Research users and problems",
        description:
          "Create personas, conduct interviews, map user journeys, and define clear user needs.",
      },
      {
        title: "Master Figma",
        description:
          "Build wireframes, components, auto layouts, interactive prototypes, and design systems.",
      },
      {
        title: "Design end-to-end experiences",
        description:
          "Take a product from problem definition to wireframes, prototypes, usability testing, and iteration.",
      },
      {
        title: "Build a case-study portfolio",
        description:
          "Document your process, decisions, research, visual designs, and outcomes for three projects.",
      },
      {
        title: "Prepare for design interviews",
        description:
          "Practice presenting case studies, explaining trade-offs, and receiving design critique.",
      },
    ],

    "Digital Marketing Specialist": [
      {
        title: "Learn marketing fundamentals",
        description:
          "Study audiences, positioning, funnels, brand messaging, customer journeys, and campaign goals.",
      },
      {
        title: "Create content and campaigns",
        description:
          "Practice writing content, social-media planning, email campaigns, paid-ad basics, and SEO.",
      },
      {
        title: "Use analytics tools",
        description:
          "Learn campaign metrics, conversion tracking, A/B testing, dashboards, and reporting.",
      },
      {
        title: "Build sample campaigns",
        description:
          "Create campaign plans for realistic brands, including audience, channels, content, and measurements.",
      },
      {
        title: "Create a marketing portfolio",
        description:
          "Show campaign strategy, sample creatives, dashboards, insights, and measurable objectives.",
      },
      {
        title: "Prepare for marketing roles",
        description:
          "Practice presenting campaign ideas, analyzing metrics, and explaining optimization decisions.",
      },
    ],

    "Project Manager": [
      {
        title: "Learn project management basics",
        description:
          "Study scope, timelines, stakeholders, risk, budgets, project lifecycles, and delivery methods.",
      },
      {
        title: "Practice Agile methods",
        description:
          "Learn Scrum roles, sprints, user stories, backlogs, stand-ups, retrospectives, and Kanban.",
      },
      {
        title: "Use planning tools",
        description:
          "Practice with Trello, Jira, Notion, Gantt charts, meeting notes, and status reporting.",
      },
      {
        title: "Lead a real or simulated project",
        description:
          "Coordinate a team project and document planning, communication, problems, and delivery outcomes.",
      },
      {
        title: "Build a project portfolio",
        description:
          "Show project charters, timelines, risk logs, sprint plans, retrospectives, and results.",
      },
      {
        title: "Prepare for PM interviews",
        description:
          "Practice stakeholder scenarios, prioritization, conflict resolution, and project storytelling.",
      },
    ],

    "Financial Analyst": [
      {
        title: "Strengthen finance fundamentals",
        description:
          "Study accounting statements, financial ratios, budgeting, cash flow, valuation, and economics.",
      },
      {
        title: "Master Excel for analysis",
        description:
          "Practice formulas, lookups, pivot tables, financial models, charts, and scenario analysis.",
      },
      {
        title: "Learn data and reporting tools",
        description:
          "Use SQL, Power BI, Tableau, or Python to analyze financial and operational datasets.",
      },
      {
        title: "Build financial models",
        description:
          "Create budgeting, forecasting, valuation, and performance-analysis projects using public data.",
      },
      {
        title: "Develop a portfolio",
        description:
          "Document models, dashboards, assumptions, insights, and recommendations in clear reports.",
      },
      {
        title: "Prepare for analyst interviews",
        description:
          "Practice accounting, Excel, valuation basics, market awareness, and business-case questions.",
      },
    ],

    "Healthcare Administrator": [
      {
        title: "Learn healthcare systems",
        description:
          "Study healthcare delivery, patient flow, insurance basics, regulations, quality, and operations.",
      },
      {
        title: "Build management skills",
        description:
          "Practice communication, scheduling, budgeting, team coordination, and operational planning.",
      },
      {
        title: "Understand healthcare data",
        description:
          "Learn basic reporting, privacy principles, metrics, records systems, and quality indicators.",
      },
      {
        title: "Gain relevant experience",
        description:
          "Seek internships, volunteer roles, or projects involving clinics, public health, or administration.",
      },
      {
        title: "Create an operations portfolio",
        description:
          "Document process-improvement ideas, workflow maps, reporting examples, and leadership experiences.",
      },
      {
        title: "Prepare for healthcare roles",
        description:
          "Practice communication scenarios, operations questions, ethics, and healthcare terminology.",
      },
    ],
  };

  return (
    roadmaps[careerTitle] || [
      {
        title: "Explore the career path",
        description:
          "Research daily responsibilities, required skills, entry-level roles, and realistic career opportunities.",
      },
      {
        title: "Identify skill gaps",
        description:
          "Compare your current skills with job descriptions and prioritize the most important missing skills.",
      },
      {
        title: "Build foundational knowledge",
        description:
          "Use structured courses, books, and practice exercises to develop the core skills for this path.",
      },
      {
        title: "Create practical projects",
        description:
          "Build portfolio projects that demonstrate your skills and solve realistic problems.",
      },
      {
        title: "Gain experience and feedback",
        description:
          "Seek internships, volunteering, competitions, or mentor feedback to improve your work.",
      },
      {
        title: "Prepare for applications",
        description:
          "Update your resume, portfolio, LinkedIn profile, and interview skills for relevant roles.",
      },
    ]
  );
}

function SavedPathsView({ token }: { token: string | null }) {
  const [recommendations, setRecommendations] = useState<
    CareerRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSavedPaths = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/recommendations/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load your saved career paths."
        );
      }

      setRecommendations(data.recommendations || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your saved career paths."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSavedPaths();
  }, [loadSavedPaths]);

  async function chooseCareerPath(recommendation: CareerRecommendation) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setSelectingId(recommendation.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/recommendations/${recommendation.id}/select`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: CareerRecommendation = await response.json();

      if (!response.ok) {
        throw new Error(data.reason || "Could not select this career path.");
      }

      setRecommendations((currentRecommendations) =>
        currentRecommendations.map((item) => ({
          ...item,
          is_selected: item.id === data.id,
        }))
      );

      setMessage(
        `${data.career_title} is now your selected career path. Your roadmap has been updated.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not select this career path."
      );
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">
        Saved Career Paths
      </h1>

      <p className="text-gray-600 mt-1">
        Select one career path to personalize your roadmap.
      </p>

      {message && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading saved career paths...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
          <BrainCircuit className="mx-auto mb-4 h-12 w-12 text-purple-300" />

          <h2 className="text-lg font-bold text-gray-900">
            No saved career paths yet
          </h2>

          <p className="mt-2 text-gray-500">
            Use AI Career Match to generate personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className={`bg-white p-6 rounded-xl border border-l-4 ${
                recommendation.is_selected
                  ? "border-green-200 border-l-green-500"
                  : "border-gray-200 border-l-purple-500"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <BrainCircuit
                  className={`w-8 h-8 shrink-0 ${
                    recommendation.is_selected
                      ? "text-green-600"
                      : "text-purple-600"
                  }`}
                />

                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  {recommendation.match_percentage}% Match
                </span>
              </div>

              {recommendation.is_selected && (
                <span className="mt-4 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                  Selected Path
                </span>
              )}

              <h2 className="mt-4 text-lg font-bold text-gray-900">
                {recommendation.career_title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {recommendation.reason}
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Generated{" "}
                {new Date(recommendation.generated_at).toLocaleDateString()}
              </p>

              <button
                onClick={() => chooseCareerPath(recommendation)}
                disabled={
                  recommendation.is_selected ||
                  selectingId === recommendation.id
                }
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  recommendation.is_selected
                    ? "cursor-default bg-green-100 text-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                }`}
              >
                {recommendation.is_selected
                  ? "Selected Path"
                  : selectingId === recommendation.id
                  ? "Selecting..."
                  : "Choose This Path"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

function ChatView({
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
        if (showLoading) setLoading(true);

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
        if (showLoading) setLoading(false);
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

      const storedConversationId = sessionStorage.getItem(
        "careerGuideChatConversationId"
      );

      const preferredConversation =
        data.find(
          (conversation) =>
            conversation.id === Number(storedConversationId)
        ) || data[0];

      if (preferredConversation) {
        await loadConversationDetail(preferredConversation.id);
        sessionStorage.removeItem("careerGuideChatConversationId");
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

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !activeConversation || !token) return;

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
        throw new Error(data.detail || "Could not send your message.");
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
      <div className="max-w-5xl mx-auto py-16 text-center text-gray-500">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Counselor Chat</h1>
        <p className="mt-1 text-gray-600">
          Message your counselors and discuss your career plans.
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
            No conversations yet
          </h2>
          <p className="mt-2 text-gray-500">
            Visit the Counselors page and click Message to start a conversation.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid-cols-[260px_1fr]">
          <aside className="border-b border-gray-200 bg-gray-50 md:border-b-0 md:border-r">
            <div className="border-b border-gray-200 px-4 py-4">
              <h2 className="font-bold text-gray-900">Conversations</h2>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {conversations.map((conversation) => {
                const isActive =
                  activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => loadConversationDetail(conversation.id, true)}
                    className={`w-full border-b border-gray-100 px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "bg-blue-50"
                        : "hover:bg-white"
                    }`}
                  >
                    <p className="truncate font-semibold text-gray-900">
                      {conversation.counselor_name}
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
                    {activeConversation.counselor_name}
                  </h2>
                  <p className="text-sm text-gray-500">Career Counselor</p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
                  {activeConversation.messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Start the conversation by sending a message.
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
                                isMine
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
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
                    placeholder="Write a message..."
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
                Select a conversation to begin.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StudentWebinarsView({ token }: { token: string | null }) {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [myWebinars, setMyWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"browse" | "mine">("browse");
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

      const [allResponse, mineResponse] = await Promise.all([
        fetch(`${API_URL}/webinars`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/webinars/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const allData = await allResponse.json();
      const mineData = await mineResponse.json();

      if (!allResponse.ok) {
        throw new Error(allData.detail || "Could not load available webinars.");
      }

      if (!mineResponse.ok) {
        throw new Error(mineData.detail || "Could not load your webinars.");
      }

      setWebinars(allData);
      setMyWebinars(mineData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load webinar information."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWebinars();
  }, [loadWebinars]);

  async function registerForWebinar(webinar: Webinar) {
    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setRegisteringId(webinar.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/webinars/${webinar.id}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not register for this webinar.");
      }

      setMessage(`You are registered for "${webinar.title}".`);
      await loadWebinars();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not register for this webinar."
      );
    } finally {
      setRegisteringId(null);
    }
  }

  const visibleWebinars = activeView === "browse" ? webinars : myWebinars;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Career Webinars</h1>
        <p className="mt-1 text-gray-600">
          Join live sessions hosted by approved career counselors.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveView("browse")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeView === "browse"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Browse Webinars
        </button>

        <button
          onClick={() => setActiveView("mine")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeView === "mine"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          My Webinars
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

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          Loading webinars...
        </div>
      ) : visibleWebinars.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Video className="mx-auto mb-4 h-12 w-12 text-blue-300" />

          <h2 className="text-lg font-bold text-gray-900">
            {activeView === "browse"
              ? "No upcoming webinars right now"
              : "You have not registered for any webinars"}
          </h2>

          <p className="mt-2 text-gray-500">
            {activeView === "browse"
              ? "Check again soon—counselors can add new career sessions at any time."
              : "Browse available webinars and register to access their meeting links."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleWebinars.map((webinar) => {
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
                    ) : webinar.is_registered ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Registered
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
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
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    {webinar.attendee_count}
                    {webinar.max_attendees !== null
                      ? ` / ${webinar.max_attendees} registered`
                      : " registered"}
                    {isFull && !webinar.is_registered ? " (full)" : ""}
                  </p>
                </div>

                <div className="mt-5">
                  {activeView === "mine" && webinar.meeting_link ? (
                    <a
                      href={webinar.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <Video className="h-4 w-4" />
                      Join Webinar
                    </a>
                  ) : webinar.is_registered ? (
                    <button
                      onClick={() => setActiveView("mine")}
                      className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
                    >
                      Registered — View in My Webinars
                    </button>
                  ) : webinar.is_cancelled ? (
                    <div className="rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600">
                      This webinar has been cancelled.
                    </div>
                  ) : isPast ? (
                    <div className="rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-600">
                      This webinar has already ended.
                    </div>
                  ) : isFull ? (
                    <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-700">
                      This webinar is full.
                    </div>
                  ) : (
                    <button
                      onClick={() => registerForWebinar(webinar)}
                      disabled={registeringId === webinar.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {registeringId === webinar.id
                        ? "Registering..."
                        : "Register for Webinar"}
                    </button>
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

function StudentFeedbackView({ token }: { token: string | null }) {
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

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
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
      setSubject("");
      setFeedbackMessage("");
      setFeedbackType("feedback");
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
          Share feedback, suggestions, or complaints to help improve
          CareerGuide.
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
            placeholder="Tell us what happened or what you would like to improve..."
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
function StudentAccountView({
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
          Manage your CareerGuide account.
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-700">
          Danger Zone
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Deleting your account permanently removes your profile and related
          CareerGuide data, including your career assessments, recommendations,
          session bookings, webinar registrations, feedback, and messages.
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