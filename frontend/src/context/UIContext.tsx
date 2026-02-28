import React, { createContext, useState, useContext, useEffect } from 'react';
import { UIContextType } from '../types';

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const [primaryColor, setPrimaryColor] = useState(() => {
        return localStorage.getItem('primaryColor') || '#fadb14';
    });
    const [activeModule, setActiveModule] = useState('dashboard');

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    useEffect(() => {
        localStorage.setItem('primaryColor', primaryColor);
        document.documentElement.style.setProperty('--brand-color', primaryColor);
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-hover', primaryColor);
    }, [primaryColor]);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const setPrimaryColorSafe = (c: string) => setPrimaryColor(c);

    return (
        <UIContext.Provider value={{
            isSidebarCollapsed,
            toggleSidebar,
            isDarkMode,
            toggleDarkMode,
            primaryColor,
            setPrimaryColor: setPrimaryColorSafe,
            activeModule,
            setActiveModule
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
