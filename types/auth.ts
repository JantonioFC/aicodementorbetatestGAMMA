export interface LoginData {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    confirmPassword: string;
}

export type AuthMode = 'login' | 'signup';
