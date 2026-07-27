import React, { Component } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { PublicLandingPage } from './components/PublicLandingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { signOut } from 'firebase/auth';
import { Menu, X, Shield, Wrench, Calendar, MapPin, Star } from 'lucide-react';

type AppState = {
    currentView: 'PUBLIC' | 'LOGIN' | 'ADMIN';
    user: User | null;
    authReady: boolean;
    updateKey: number;
    mobileMenuOpen: boolean;
};

export default class App extends Component<{}, AppState> {
    declare state: AppState;
    private unsubscribeAuth: (() => void) | null = null;

    constructor(props: {}) {
        super(props);
        this.state = {
            currentView: 'PUBLIC',
            user: null,
            authReady: false,
            updateKey: 0,
            mobileMenuOpen: false,
        };
    }

    componentDidMount() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.setState({ user, authReady: true });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeAuth) this.unsubscribeAuth();
    }

    goToAdmin = () => {
        if (this.state.user) {
            this.setState(prev => ({ currentView: 'ADMIN', updateKey: prev.updateKey + 1, mobileMenuOpen: false }));
        } else {
            this.setState({ currentView: 'LOGIN', mobileMenuOpen: false });
        }
    };

    handleLoginSuccess = () => {
        this.setState(prev => ({ currentView: 'ADMIN', updateKey: prev.updateKey + 1 }));
    };

    handleLogout = async () => {
        await signOut(auth);
        this.setState(prev => ({ currentView: 'PUBLIC', updateKey: prev.updateKey + 1 }));
    };

    toggleMobileMenu = () => {
        this.setState(prev => ({ mobileMenuOpen: !prev.mobileMenuOpen }));
    };

    closeMobileMenu = () => {
        this.setState({ mobileMenuOpen: false });
    };

    renderPublicHeader() {
        return (
            <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#1F1F21]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-red-500">
                        FELIP<span className="text-white">CAR</span>
                    </h1>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden sm:inline-block border-l border-zinc-800 pl-2 ml-1">
                        Estética Automotiva
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
                    <a href="#servicos" className="hover:text-red-500 transition-colors">Serviços</a>
                    <a href="#agendar" className="hover:text-red-500 transition-colors">Agendamento</a>
                    <a href="#localizacao" className="hover:text-red-500 transition-colors">Localização</a>
                    <a href="#avaliacoes" className="hover:text-red-500 transition-colors">Avaliações</a>
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        onClick={this.goToAdmin}
                        className="bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Shield size={14} className="text-red-500" />
                        <span>Painel Admin</span>
                    </button>

                    <button
                        onClick={this.toggleMobileMenu}
                        className="md:hidden p-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                        aria-label="Menu"
                    >
                        {this.state.mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </header>
        );
    }

    renderMobileMenu() {
        return (
            <div className="md:hidden fixed top-[57px] left-0 right-0 z-30 bg-[#1A1A1C] border-b border-zinc-800 p-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
                <a
                    href="#servicos"
                    onClick={this.closeMobileMenu}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#222225] border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:border-red-500/50 transition-all"
                >
                    <Wrench size={16} className="text-red-500" /> Serviços e Tratamentos
                </a>
                <a
                    href="#agendar"
                    onClick={this.closeMobileMenu}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#222225] border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:border-red-500/50 transition-all"
                >
                    <Calendar size={16} className="text-red-500" /> Agendamento Online
                </a>
                <a
                    href="#localizacao"
                    onClick={this.closeMobileMenu}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#222225] border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:border-red-500/50 transition-all"
                >
                    <MapPin size={16} className="text-red-500" /> Localização & Horários
                </a>
                <a
                    href="#avaliacoes"
                    onClick={this.closeMobileMenu}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#222225] border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:border-red-500/50 transition-all"
                >
                    <Star size={16} className="text-yellow-400" /> Depoimentos & Avaliações
                </a>
            </div>
        );
    }

    renderPublicView() {
        return (
            <div className="min-h-screen bg-[#1F1F21] text-zinc-100 font-sans selection:bg-red-600 selection:text-white flex flex-col">
                {this.renderPublicHeader()}
                {this.state.mobileMenuOpen && this.renderMobileMenu()}

                <main key={this.state.updateKey} className="flex-1">
                    <PublicLandingPage />
                </main>

                <footer className="border-t border-zinc-800 bg-[#18181A] py-8 mt-12 text-center text-zinc-400 text-xs sm:text-sm">
                    <p>FelipCar Estética Automotiva &copy; 2026. Todos os direitos reservados.</p>
                </footer>
            </div>
        );
    }

    render() {
        if (!this.state.authReady) {
            return (
                <div className="min-h-screen bg-[#1F1F21] flex items-center justify-center">
                    <div className="animate-pulse text-zinc-400 text-sm">Carregando...</div>
                </div>
            );
        }

        switch (this.state.currentView) {
            case 'PUBLIC':
                return this.renderPublicView();
            case 'LOGIN':
                return <AdminLogin onLogin={this.handleLoginSuccess} />;
            case 'ADMIN':
                return <AdminDashboard onLogout={this.handleLogout} />;
            default:
                return this.renderPublicView();
        }
    }
}
