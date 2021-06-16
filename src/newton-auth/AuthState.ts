import jwtDecode from 'jwt-decode';

interface IAccessToken {
    login_flow?: AuthFlowScheme;
    login_step?: AuthFlowStep;
    masked_email?: string;
    bo_client_id?: string;
    user_id?: string;
}

export enum AuthFlowScheme {
    SHORT = 'SHORT',
    NORMAL = 'NORMAL',
    NORMAL_WITH_EMAIL = 'NORMAL_WITH_EMAIL',
}

export enum AuthFlowStep {
    SEND_PHONE_CODE = 'SEND_PHONE_CODE',
    VERIFY_PHONE_CODE = 'VERIFY_PHONE_CODE',
    SEND_EMAIL_CODE = 'SEND_EMAIL_CODE',
    VERIFY_EMAIL_CODE = 'VERIFY_EMAIL_CODE',
    GET_MAIN_TOKEN = 'GET_MAIN_TOKEN',
}

class AuthState {
    public readonly scheme?: AuthFlowScheme;
    public readonly step?: AuthFlowStep;
    public readonly maskedEmail?: string;
    public readonly boClientId?: string;
    public readonly userId?: string;

    public constructor(token: string) {
        const data = jwtDecode<IAccessToken>(token);
        this.scheme = data.login_flow;
        this.step = data.login_step;
        this.maskedEmail = data.masked_email;
        this.boClientId = data.bo_client_id;
        this.userId = data.user_id;
    }
}

export default AuthState;
