interface IRawResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
}

export default class AuthResponse {
    public readonly accessToken: string;
    public readonly accessTokenExpiresIn: number;
    public readonly refreshToken: string;
    public readonly refreshTokenExpiresIn: number;

    public constructor(raw: IRawResponse) {
        this.accessToken = raw.access_token;
        this.refreshToken = raw.refresh_token;
        this.accessTokenExpiresIn = raw.expires_in;
        this.refreshTokenExpiresIn = raw.refresh_expires_in;
    }
}
