import request from 'superagent';

import AuthError, {AuthErrorCode} from './AuthError';
import AuthState, {LoginFlow, LoginStep} from './AuthState';
import AuthResponse from './AuthReponse';

interface NewtonAuthParams {
    domain: string;
    clientId: string;
    grantType?: string;
    realm: string;
    serviceRealm: string;
}

class NewtonAuth {
    private _domain: string;
    private _clientId: string;
    private _grantType: string;
    private _realm: string;
    private _serviceRealm: string;

    private _serviceToken: string | null = null;
    private _authState: AuthState | null = null;

    public get authState(): AuthState | null {
        return this._authState;
    }

    public get domain(): string {
        return this._domain;
    }

    public get clientId(): string {
        return this._clientId;
    }

    public get grantType(): string {
        return this._grantType;
    }

    public get realm(): string {
        return this._realm;
    }

    public get serviceRealm(): string {
        return this._serviceRealm;
    }

    public config(params: NewtonAuthParams): void {
        this._domain = params.domain;
        this._clientId = params.clientId;
        this._grantType = params.grantType ?? 'password';
        this._realm = params.realm;
        this._serviceRealm = params.serviceRealm;
        this.reset();
    }

    public async sendPhoneCode(phone: string): Promise<AuthResponse> {
        this.reset();
        return this.requestServiceToken({phone_number: phone});
    }

    public async verifyPhone(code: string): Promise<AuthResponse> {
        this.validateFlowStep(LoginStep.VerifyPhoneCode);
        return this.requestServiceToken({code});
    }

    public async sendEmailCode(email?: string): Promise<AuthResponse> {
        this.validateFlowStep(LoginStep.SendEmailCode);
        return this.requestServiceToken({email});
    }

    public async verifyEmail(code: string): Promise<AuthResponse> {
        this.validateFlowStep(LoginStep.VerifyEmailCode);
        return this.requestServiceToken({code});
    }

    public async authorize(password?: string): Promise<AuthResponse> {
        this.validateFlowStep(LoginStep.GetMainToken);
        if (this._authState?.loginFlow != LoginFlow.Short && !password) {
            throw new AuthError({
                error: AuthErrorCode.PasswordMissing,
                error_description: 'Password is required for this flow',
            });
        }
        return this.requestMainToken({password});
    }

    public async changePassword(accessToken: string, newPassword: string): Promise<AuthResponse> {
        const url = `${this.domain}/auth/realms/${this._realm}/users/password`;
        return this.postRequest(url, {password: newPassword}, {Authorization: `Bearer ${accessToken}`});
    }

    public async resetPassword(accessToken?: string): Promise<AuthResponse> {
        this.validateFlowScheme(LoginFlow.Normal);
        this.validateFlowStep(LoginStep.GetMainToken);
        const header = accessToken
            ? {Authorization: `Bearer ${accessToken}`}
            : {};
        return this.requestServiceToken({reset_password: true}, header);
    }

    public async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
        return this.requestMainToken({grant_type: 'refresh_token', refresh_token: refreshToken});
    }

    public async revokeRefreshToken(accessToken: string): Promise<boolean> {
        const url = `${this.domain}/auth/realms/${this._realm}/users/logout`;
        await this.getRequest(url, {}, {Authorization: `Bearer ${accessToken}`});
        return true;
    }

    public reset(): void {
        this._authState = null;
        this._serviceToken = null;
    }

    private validateFlowScheme(scheme: LoginFlow): void {
        if (this._authState?.loginFlow !== scheme) {
            throw new AuthError({
                error: AuthErrorCode.IncorrectFlowSequence,
                error_description: `Method is not allowed in scheme ${this._authState?.loginFlow}`,
            });
        }
    }

    private validateFlowStep(step: LoginStep): void {
        if (this._authState?.loginStep !== step) {
            throw new AuthError({
                error: AuthErrorCode.IncorrectFlowSequence,
                error_description: `Method is not allowed on step ${this._authState?.loginStep}`,
            });
        }
    }

    private async requestServiceToken(
        params?: {[key: string]: any},
        headers?: {[key: string]: string},
    ): Promise<AuthResponse> {
        const url = `${this.domain}/auth/realms/${this._serviceRealm}/protocol/openid-connect/token`;
        return await this.postRequest(
            url,
            {
                client_id: this.clientId,
                grant_type: this.grantType,
                ...params,
            },
            headers,
        );
    }

    private async requestMainToken(
        params?: {[key: string]: any},
        headers?: {[key: string]: string},
    ): Promise<AuthResponse> {
        const url = `${this.domain}/auth/realms/${this._realm}/protocol/openid-connect/token`;
        const response = await this.postRequest(
            url,
            {
                client_id: this.clientId,
                grant_type: this.grantType,
                ...params,
            },
            headers,
        );
        this._serviceToken = null;
        return response;
    }

    private async getRequest(url: string, query?: any, headers?: any) {
        try {
            const resp = await request.get(url).query(query).set(headers);
            if (resp.statusCode !== 200) {
                throw new AuthError(resp.body);
            }
            return resp.body;
        } catch (err) {
            if (err instanceof AuthError) {
                throw err;
            }
            throw new AuthError({
                error: AuthErrorCode.UnknownError,
                error_description: 'Unknown error',
            });
        }
    }

    private async postRequest(url: string, params?: any, headers?: any) {
        try {
            const _headers = {'Content-Type': 'application/x-www-form-urlencoded'};
            if (this._serviceToken) {
                _headers['Authorization'] = `Bearer ${this._serviceToken}`;
            }
            const resp = await request
                .post(url)
                .send(params)
                .set({..._headers, ...headers});
            if (resp.statusCode !== 200) {
                throw new AuthError(resp.body);
            }
            const authResponse = new AuthResponse(resp.body);
            this._serviceToken = authResponse.accessToken;
            this._authState = authResponse.accessToken ? new AuthState(authResponse.accessToken) : undefined;
            return authResponse;
        } catch (err) {
            if (err instanceof AuthError) {
                throw err;
            }
            if (err.response?.body) {
                throw new AuthError(err.response.body)
            }
            throw new AuthError({
                error: AuthErrorCode.UnknownError,
                error_description: 'Unknown error',
            });
        }
    }
}

export default new NewtonAuth();
