import jwtDecode from 'jwt-decode';

interface IServiceAccessToken {
    login_flow?: LoginFlow;
    login_step?: LoginStep;
    phone_number?: string;
    masked_email?: string;
    bo_client_id?: string;
    user_id?: string;
    code_can_be_resubmitted_timestamp?: number;
    code_expires_timestamp?: number;
}

export enum LoginFlow {
    Short = 'SHORT',
    Normal = 'NORMAL',
    NormalWithEmail = 'NORMAL_WITH_EMAIL',
}

export enum LoginStep {
    SendPhoneCode = 'SEND_PHONE_CODE',
    VerifyPhoneCode = 'VERIFY_PHONE_CODE',
    SendEmailCode = 'SEND_EMAIL_CODE',
    VerifyEmailCode = 'VERIFY_EMAIL_CODE',
    GetMainToken = 'GET_MAIN_TOKEN',
}

class AuthState {
    public readonly loginFlow?: LoginFlow;
    public readonly loginStep?: LoginStep;
    public readonly phoneNumber?: string;
    public readonly maskedEmail?: string;
    public readonly boClientId?: string;
    public readonly userId?: string;
    public readonly codeCanBeResubmittedTimestamp?: number;
    public readonly codeExpiresTimestamp?: number;

    public constructor(token: string) {
        const data = jwtDecode<IServiceAccessToken>(token);
        this.loginFlow = data.login_flow;
        this.loginStep = data.login_step;
        this.phoneNumber = data.phone_number;
        this.maskedEmail = data.masked_email;
        this.boClientId = data.bo_client_id;
        this.userId = data.user_id;
        this.codeCanBeResubmittedTimestamp = data.code_can_be_resubmitted_timestamp !== undefined
            ? data.code_can_be_resubmitted_timestamp * 1000
            : undefined;
        this.codeExpiresTimestamp = data.code_expires_timestamp !== undefined
            ? data.code_expires_timestamp * 1000
            : undefined;
    }
}

export default AuthState;
