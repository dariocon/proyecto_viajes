export interface UserLogin {
   
    username:    string;
    password:     string;

}

export interface User {
   
    username: string,
    name: string,
    surname: string,
    email: string,
    password: string,
    gender: string,
    birthDate: string,
    address: string,
    role: string,
    registrationDate: string,
    userStatus: string

}

export interface UserLoginResponse {
   
    message:    string;
    data: {
        id: number,
        username: string,
        rol: string
    };

}

export interface VerifiedResponse {
    user?: {
        id: number,
        username: string,
        rol: string
    };

}

export interface LoginResponse{
    message: string;
    token: string;
}

export interface Token {
    iat: number;
    exp: number;
    username: string;
    role: string;
}

export interface UserRegister {
    username: string,
    name: string,
    surname: string,
    email: string,
    password: string,
    gender: string,
    birthDate: string,
    address: string

}
export interface RegisterResponse{
    message: string;
}

