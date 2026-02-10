import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Menu, X, UsersRound, BarChart3, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export default function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Alumnos', href: '/alumnos', icon: Users },
        { name: 'Grupos', href: '/grupos', icon: UsersRound },
        { name: 'Asistencia', href: '/asistencia', icon: UserCheck },
        { name: 'Reportes', href: '/reportes', icon: BarChart3 },
        { name: 'Finanzas', href: '/finanzas', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header / Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 flex items-center justify-center">
                                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-800 flex flex-col leading-none">
                                <span>Asistencia</span>
                                <span className="text-xs text-casr-green font-semibold uppercase tracking-wider">Patín Artístico</span>
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-center space-x-1">
                                {navigation.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 group",
                                                isActive
                                                    ? "bg-casr-green/10 text-casr-green"
                                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-casr-green" : "text-gray-400 group-hover:text-gray-600")} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="bg-gray-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-casr-green"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 transition-colors",
                                            isActive
                                                ? "bg-casr-green/10 text-casr-green"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", isActive ? "text-casr-green" : "text-gray-400")} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">Club Atlético Santa Rosa</span> - Escuela de Patín
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        by Diem
                    </p>
                </div>
            </footer>
        </div>
    );
}
