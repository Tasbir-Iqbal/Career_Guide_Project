import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth, Role } from "../context/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const ROLE_OPTIONS: {
  id: Role;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bg: string;
}[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    description:
      "Get personalized AI career recommendations and connect with counselors",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "counselor",
    label: "Career Counselor",
    icon: Briefcase,
    description:
      "Guide students, publish articles, and host webinars after approval",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const MAJORS = [
  "Computer Science",
  "Business Administration",
  "Engineering",
  "Psychology",
  "Medicine",
  "Law",
  "Arts & Design",
  "Data Science",
  "Economics",
  "Education",
  "Other",
];

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [major, setMajor] = useState("");

  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("Available");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  function validateStep1() {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  }

  function validateStep2() {
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return false;
    }

    if (selectedRole === "counselor") {
      if (specialization.trim().length < 2) {
        setError("Please enter your counseling specialization.");
        return false;
      }

      if (bio.trim().length < 10) {
        setError(
          "Please write a professional bio of at least 10 characters."
        );
        return false;
      }
    }

    return true;
  }

  function handleNext() {
    setError("");

    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!validateStep2()) {
      return;
    }

    try {
      setLoading(true);

      const response = await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        major,
        specialization: specialization.trim() || undefined,
        bio: bio.trim() || undefined,
        availability: availability.trim() || "Available",
      });

      if (selectedRole === "counselor") {
        setSuccessMessage(
          response?.message ||
            "Your counselor application was submitted successfully. An administrator must approve it before you can sign in."
        );
        return;
      }

      navigate("/student");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Clock className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Application submitted
          </h1>

          <p className="mt-3 leading-7 text-gray-600">{successMessage}</p>

          <p className="mt-4 text-sm text-gray-500">
            You will be able to log in after an administrator approves your
            counselor account.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 p-12 lg:flex lg:w-5/12 lg:flex-col lg:justify-between">
        <div className="absolute inset-0">
          <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CareerGuide</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-white">
            Start your journey
            <br />
            toward a fulfilling career.
          </h1>

          <p className="max-w-xs leading-relaxed text-indigo-200">
            Join students and counselors building clearer career paths
            together.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            "Personalized AI career matching",
            "Verified counselor guidance",
            "Step-by-step career roadmaps",
            "Articles, sessions, and webinars",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-400/50 bg-green-400/20">
                <CheckCircle2 className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-sm text-indigo-100">{feature}</span>
            </div>
          ))}

          <div className="mt-6 aspect-video overflow-hidden rounded-2xl shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758518727653-5650fd9e146c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
              alt="Career guidance"
              className="h-full w-full object-cover opacity-80"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            {[1, 2].map((currentStep) => (
              <div key={currentStep} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    step >= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step > currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    currentStep
                  )}
                </div>

                <span
                  className={`hidden text-sm font-medium sm:block ${
                    step >= currentStep ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {currentStep === 1 ? "Your Details" : "Account Type"}
                </span>

                {currentStep < 2 && (
                  <div
                    className={`h-0.5 w-12 ${
                      step > currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create your account
                </h2>
                <p className="mt-1 text-gray-500">
                  Join CareerGuide — it&apos;s completely free.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="John Smith"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-11 pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Re-enter your password"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-11 w-full border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  type="button"
                  className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  Almost there!
                </h2>

                <p className="mt-1 text-gray-500">
                  Choose your account type and complete your profile.
                </p>
              </div>

              <div className="mb-5">
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                  I am joining as a...
                </Label>

                <div className="grid gap-3">
                  {ROLE_OPTIONS.map(
                    ({ id, label, icon: Icon, description, color, bg }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setError("");
                          setSelectedRole(id);
                        }}
                        className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                          selectedRole === id
                            ? `border-blue-500 ${bg}`
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}
                        >
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {label}
                          </div>
                          <div className="mt-0.5 text-xs leading-relaxed text-gray-500">
                            {description}
                          </div>
                        </div>

                        {selectedRole === id && (
                          <CheckCircle2 className="ml-auto mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>

              {selectedRole === "student" && (
                <div className="mb-5">
                  <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Academic major or field
                    <span className="ml-1 text-gray-400">(optional)</span>
                  </Label>

                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <select
                      value={major}
                      onChange={(event) => setMajor(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select your major...</option>
                      {MAJORS.map((currentMajor) => (
                        <option key={currentMajor} value={currentMajor}>
                          {currentMajor}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedRole === "counselor" && (
                <div className="mb-5 space-y-4">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Counseling specialization
                    </Label>
                    <Input
                      required
                      type="text"
                      value={specialization}
                      onChange={(event) =>
                        setSpecialization(event.target.value)
                      }
                      placeholder="Example: Technology and Data Careers"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Professional bio
                    </Label>
                    <textarea
                      required
                      rows={4}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Briefly describe your experience, qualifications, and the students you can guide."
                      className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Availability
                    </Label>
                    <Input
                      type="text"
                      value={availability}
                      onChange={(event) => setAvailability(event.target.value)}
                      placeholder="Example: Weekdays, 4 PM to 8 PM"
                      className="h-11"
                    />
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Counselor accounts require administrator approval before
                    sign-in is available.
                  </div>
                </div>
              )}

              <div className="mb-5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer accent-blue-600"
                />

                <label
                  htmlFor="terms"
                  className="cursor-pointer text-sm leading-relaxed text-gray-600"
                >
                  I agree to the{" "}
                  <span className="cursor-pointer font-medium text-blue-600 hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="cursor-pointer font-medium text-blue-600 hover:underline">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>

              {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : selectedRole === "counselor" ? (
                  <>
                    Submit Counselor Application
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Create Student Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}