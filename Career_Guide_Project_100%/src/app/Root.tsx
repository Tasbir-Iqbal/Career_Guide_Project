import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "./context/AuthContext";
import {
  BookOpen, Users, LayoutDashboard, LogOut, Menu, X,
  GraduationCap, Briefcase, FileText, ChevronDown, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";

const ROLE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  counselor: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export function Root() {
  const { role, setRole, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (newRole: "guest" | "student" | "counselor" | "admin") => {
    setRole(newRole);
    if (newRole === "guest") navigate("/");
    else navigate(`/${newRole}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "Articles", path: "/articles" },
    { name: "Counselors", path: "/counselors" },
  ];

  const roleNavItem =
    role === "student" ? { name: "My Dashboard", path: "/student", icon: GraduationCap } :
    role === "counselor" ? { name: "Counselor Portal", path: "/counselor", icon: Briefcase } :
    role === "admin" ? { name: "Admin Console", path: "/admin", icon: LayoutDashboard } :
    null;

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 hidden sm:block tracking-tight">
                  CareerPath <span className="text-blue-600">AI</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {roleNavItem && (
                  <Link
                    to={roleNavItem.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive(roleNavItem.path)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <roleNavItem.icon className="w-4 h-4" />
                    {roleNavItem.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Demo Role Switcher */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-gray-400 font-medium">Demo:</span>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="guest">Guest</option>
                  <option value="student">Student</option>
                  <option value="counselor">Counselor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900 leading-none">{user.name}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 capitalize border-0 ${ROLE_COLORS[role]}`}>
                          {role}
                        </Badge>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {roleNavItem && (
                      <DropdownMenuItem onClick={() => navigate(roleNavItem.path)} className="cursor-pointer">
                        <roleNavItem.icon className="w-4 h-4 mr-2" />
                        My Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-gray-700">
                    Log in
                  </Button>
                  <Button size="sm" onClick={() => navigate("/signup")} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-sm">
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {roleNavItem && (
                <Link
                  to={roleNavItem.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <roleNavItem.icon className="w-4 h-4" />
                  {roleNavItem.name}
                </Link>
              )}
            </div>
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Demo Role:</span>
                <select
                  value={role}
                  onChange={(e) => { handleRoleChange(e.target.value as any); setIsMobileMenuOpen(false); }}
                  className="flex-1 border border-gray-200 rounded-md text-sm py-1.5 px-2 bg-gray-50"
                >
                  <option value="guest">Guest</option>
                  <option value="student">Student</option>
                  <option value="counselor">Counselor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!user ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}>Log in</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { navigate("/signup"); setIsMobileMenuOpen(false); }}>Sign up</Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">CareerPath AI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Empowering students with AI-driven career guidance and connecting them with expert counselors.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-200">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/articles" className="hover:text-white transition-colors">Articles</Link></li>
                <li><Link to="/counselors" className="hover:text-white transition-colors">Find Counselors</Link></li>
                <li><Link to="/student" className="hover:text-white transition-colors">Student Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-200">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Log In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} CareerPath AI. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
