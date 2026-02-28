export interface User {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'employee';
    avatar?: string;
    age?: number;
    gender?: string;
    dob?: string;
    joining_date?: string;
    salary?: number | string;
    department?: string;
    location?: string;
    address?: string;
    bio?: string;
}

export interface Employee {
    id: number | string;
    name: string;
    designation: string;
    department?: string;
    department_id?: number | null;
    salary: number | string;
    status: 'active' | 'inactive';
    created_at?: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: User) => void;
    isAuthenticated: boolean;
}

export interface UIContextType {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    activeModule: string;
    setActiveModule: (module: string) => void;
}
