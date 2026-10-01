import { FormEvent, useEffect, useState } from "react";
import {
  Search,
  Star,
  MapPin,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle,
  Filter,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const SPECIALTIES = [
  "All",
  "Tech & Engineering",
  "Business & Finance",
  "Medicine & Healthcare",
  "Arts & Design",
  "Law & Policy",
  "Academic Advising",
];

type ApiCounselor = {
  id: number;
  user_id: number;
  name: string;
  specialization: string | null;
  bio: string | null;
  availability: string | null;
};

type CounselorCard = {
  id: number;
  userId: number;
  name: string;
  title: string;
  specialty: string;
  image: string;
  rating: number;
  reviews: number;
  students: number;
  location: string;
  experience: string;
  tags: string[];
  bio: string;
  available: boolean;
  sessions: number;
  avatarColor: string;
  initials: string;
};

function getSpecialty(specialization: string) {
  const text = specialization.toLowerCase();

  if (
    text.includes("engineering") ||
    text.includes("programming") ||
    text.includes("technology") ||
    text.includes("artificial intelligence")
  ) {
    return "Tech & Engineering";
  }

  if (text.includes("business") || text.includes("finance")) {
    return "Business & Finance";
  }

  if (text.includes("medical") || text.includes("health")) {
    return "Medicine & Healthcare";
  }

  if (text.includes("design") || text.includes("art")) {
    return "Arts & Design";
  }

  if (text.includes("law") || text.includes("policy")) {
    return "Law & Policy";
  }

  return "Academic Advising";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toCounselorCard(counselor: ApiCounselor): CounselorCard {
  const specialization = counselor.specialization || "Career Guidance";
  const availability = counselor.availability || "";

  return {
    id: counselor.id,
    userId: counselor.user_id,
    name: counselor.name,
    title: "Career Counselor",
    specialty: getSpecialty(specialization),
    image: "",
    rating: 5,
    reviews: 0,
    students: 0,
    location: "Online",
    experience: "—",
    tags: specialization
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    bio: counselor.bio || "Career guidance and academic advising.",
    available: availability.toLowerCase() !== "unavailable",
    sessions: 0,
    avatarColor: "from-blue-500 to-indigo-600",
    initials: getInitials(counselor.name),
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

async function getApiError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || "Could not create the booking.";
  } catch {
    return "Could not create the booking.";
  }
}

export function CounselorsPage() {
  const { role, token } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [counselors, setCounselors] = useState<CounselorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCounselor, setSelectedCounselor] =
    useState<CounselorCard | null>(null);
  const [sessionDate, setSessionDate] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [messagingCounselorId, setMessagingCounselorId] = useState<
  number | null
>(null);

  useEffect(() => {
    async function loadCounselors() {
      try {
        const response = await fetch(`${API_URL}/counselors`);

        if (!response.ok) {
          throw new Error("Could not load counselors.");
        }

        const data: ApiCounselor[] = await response.json();
        setCounselors(data.map(toCounselorCard));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load counselors."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCounselors();
  }, []);

  const filtered = counselors.filter((counselor) => {
    const matchesSpecialty =
      activeSpecialty === "All" || counselor.specialty === activeSpecialty;

    const matchesSearch =
      !searchQuery ||
      counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      counselor.specialty
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesAvailable = !availableOnly || counselor.available;

    return matchesSpecialty && matchesSearch && matchesAvailable;
  });

  function openBookingForm(counselor: CounselorCard) {
    setBookingError("");
    setBookingSuccess("");

    if (role !== "student") {
      setBookingError(
        role === "guest"
          ? "Please log in as a student before booking a session."
          : "Only student accounts can book counseling sessions."
      );
      return;
    }

    setSelectedCounselor(counselor);
  }

  function closeBookingForm() {
    if (bookingLoading) {
      return;
    }

    setSelectedCounselor(null);
    setSessionDate("");
    setBookingError("");
  }

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCounselor || !token) {
      setBookingError("Please log in as a student before booking a session.");
      return;
    }

    if (!sessionDate) {
      setBookingError("Please choose a date and time.");
      return;
    }

    setBookingError("");
    setBookingSuccess("");
    setBookingLoading(true);

    try {
      const response = await fetch(`${API_URL}/students/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          counselor_id: selectedCounselor.userId,
          session_date: sessionDate,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setBookingSuccess(
        `Your session with ${selectedCounselor.name} has been requested. It is pending counselor confirmation.`
      );
      setSelectedCounselor(null);
      setSessionDate("");
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Could not create the booking."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  async function openChat(counselor: CounselorCard) {
  if (role !== "student" || !token) {
    setBookingError(
      role === "guest"
        ? "Please log in as a student before messaging a counselor."
        : "Only student accounts can message counselors."
    );
    return;
  }

  try {
    setMessagingCounselorId(counselor.id);
    setBookingError("");
    setBookingSuccess("");

    const response = await fetch(`${API_URL}/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        counselor_id: counselor.userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Could not open a conversation with this counselor."
      );
    }

    sessionStorage.setItem("careerGuideChatConversationId", String(data.id));

    setBookingSuccess(
      `Conversation with ${counselor.name} is ready. Open Counselor Chat from your Student Portal to send a message.`
    );
  } catch (error) {
    setBookingError(
      error instanceof Error
        ? error.message
        : "Could not open a conversation with this counselor."
    );
  } finally {
    setMessagingCounselorId(null);
  }
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium mb-5">
            <Users className="w-4 h-4" /> Expert Counselors
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Counselor
          </h1>

          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Connect with verified career experts who can help you plan your
            next academic or professional step.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, specialty, or skill..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-12 h-12 bg-white border-0 shadow-lg text-gray-900 placeholder-gray-400 rounded-xl"
              />
            </div>

            <Button
              onClick={() => setAvailableOnly(!availableOnly)}
              variant={availableOnly ? "default" : "outline"}
              className={`h-12 px-5 rounded-xl whitespace-nowrap ${
                availableOnly
                  ? "bg-white text-blue-700 hover:bg-gray-50"
                  : "bg-white/10 border-white/30 text-white hover:bg-white/20"
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {availableOnly ? "Available Now ✓" : "Available Now"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {bookingSuccess && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {bookingSuccess}
          </div>
        )}

        {bookingError && !selectedCounselor && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {bookingError}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setActiveSpecialty(specialty)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeSpecialty === specialty
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filtered.length}
            </span>{" "}
            counselors
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            Sort by:
            <button className="flex items-center gap-1 font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Top Rated <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading counselors...
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Could not load counselors
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              No counselors found
            </h3>
            <p className="text-gray-500">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((counselor) => (
              <div
                key={counselor.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden group"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative shrink-0">
                      <Avatar className="w-16 h-16 ring-2 ring-white shadow-md">
                        <AvatarImage
                          src={counselor.image}
                          alt={counselor.name}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={`bg-gradient-to-br ${counselor.avatarColor} text-white font-bold text-lg`}
                        >
                          {counselor.initials}
                        </AvatarFallback>
                      </Avatar>

                      {counselor.available && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">
                            {counselor.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {counselor.title}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        <StarRating rating={counselor.rating} />
                        <span className="text-sm font-bold text-gray-800">
                          {counselor.rating}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({counselor.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
                    {counselor.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {counselor.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {counselor.students}+
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Students
                      </div>
                    </div>

                    <div className="text-center border-x border-gray-100">
                      <div className="text-sm font-bold text-gray-900">
                        {counselor.experience}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Experience
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {counselor.sessions}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Sessions
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {counselor.location}
                    <span
                      className={`ml-auto flex items-center gap-1 font-medium ${
                        counselor.available
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          counselor.available
                            ? "bg-green-400"
                            : "bg-gray-300"
                        }`}
                      />
                      {counselor.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto p-4 pt-0 grid grid-cols-2 gap-2">
                  <Button
  variant="outline"
  size="sm"
  disabled={messagingCounselorId === counselor.id}
  onClick={() => openChat(counselor)}
  className="h-9 text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-xs disabled:opacity-60"
>
  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
  {messagingCounselorId === counselor.id ? "Opening..." : "Message"}
</Button>

                  <Button
                    size="sm"
                    disabled={!counselor.available}
                    onClick={() => openBookingForm(counselor)}
                    className={`h-9 text-xs ${
                      counselor.available
                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-sm"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Book Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span className="text-sm font-semibold text-indigo-200 uppercase tracking-wide">
                AI-Powered
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              Can't decide? Let AI match you
            </h3>
            <p className="text-indigo-100">
              Our AI will help find a counselor aligned with your goals.
            </p>
          </div>

          <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-6 h-11 shrink-0 border-0">
            Get AI Match <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {selectedCounselor && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">
                  Book a counseling session
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedCounselor.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCounselor.specialty}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBookingForm}
                disabled={bookingLoading}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close booking form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBooking}>
              <label
                htmlFor="session-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Choose a date and time
              </label>

              <Input
                id="session-date"
                type="datetime-local"
                value={sessionDate}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) => setSessionDate(event.target.value)}
                required
                className="h-11"
              />

              {bookingError && (
                <p className="mt-3 text-sm text-red-600">{bookingError}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeBookingForm}
                  disabled={bookingLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={bookingLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}