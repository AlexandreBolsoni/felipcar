import React, { Component } from 'react';
import { Download } from 'lucide-react';

type InstallPWAState = {
    deferredPrompt: any;
    isInstallable: boolean;
};

type InstallPWAProps = {
    isDark?: boolean;
};

export class InstallPWA extends Component<InstallPWAProps, InstallPWAState> {
    declare state: InstallPWAState;

    constructor(props: InstallPWAProps) {
        super(props);
        this.state = {
            deferredPrompt: null,
            isInstallable: false,
        };
    }

    componentDidMount() {
        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    }

    handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        this.setState({ deferredPrompt: e, isInstallable: true });
    };

    handleInstall = async () => {
        const { deferredPrompt } = this.state;
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        this.setState({ deferredPrompt: null, isInstallable: false });
    };

    render() {
        const { isInstallable } = this.state;
        const { isDark } = this.props;

        if (!isInstallable) return null;

        return (
            <button
                onClick={this.handleInstall}
                className={`p-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isDark
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                }`}
                title="Instalar aplicativo"
            >
                <Download size={15} />
                <span>Instalar</span>
            </button>
        );
    }
}
