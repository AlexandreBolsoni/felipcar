import React, { Component } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Shield, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-react';

type LoginProps = {
    onLogin: () => void;
};

type LoginState = {
    email: string;
    password: string;
    showPassword: boolean;
    error: string;
    loading: boolean;
};

export class AdminLogin extends Component<LoginProps, LoginState> {
    declare state: LoginState;

    constructor(props: LoginProps) {
        super(props);
        this.state = {
            email: '',
            password: '',
            showPassword: false,
            error: '',
            loading: false,
        };
    }

    handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { email, password } = this.state;

        if (!email.trim() || !password.trim()) {
            this.setState({ error: 'Preencha email e senha.' });
            return;
        }

        this.setState({ loading: true, error: '' });

        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            this.props.onLogin();
        } catch (err: any) {
            const code = err.code;
            let msg: string;
            if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
                msg = 'Email ou senha inválidos.';
            } else if (code === 'auth/too-many-requests') {
                msg = 'Muitas tentativas. Tente novamente mais tarde.';
            } else {
                msg = 'Erro ao fazer login. Tente novamente.';
            }
            this.setState({ error: msg });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { email, password, showPassword, error, loading } = this.state;

        return (
            <div className="min-h-screen bg-[#1F1F21] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black tracking-tight text-red-500">
                            FELIP<span className="text-white">CAR</span>
                        </h1>
                        <p className="text-zinc-400 text-sm mt-2">Painel Administrativo</p>
                    </div>

                    <form
                        onSubmit={this.handleLogin}
                        className="bg-[#2A2A2D] rounded-2xl border border-zinc-800 shadow-md p-8 space-y-5"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <div className="p-2 rounded-lg bg-red-600/10 border border-red-600/20">
                                <Shield size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-lg">Acesso Restrito</h2>
                                <p className="text-xs text-zinc-400">Faça login para continuar</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-400 text-sm rounded-lg px-4 py-3">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => this.setState({ email: e.target.value })}
                                placeholder="admin@felipcar.com"
                                className="w-full bg-[#1F1F21] border border-zinc-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => this.setState({ password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-[#1F1F21] border border-zinc-700/80 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showPassword: !showPassword })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Entrando...</span>
                            ) : (
                                <><LogIn size={16} /> Entrar</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }
}
