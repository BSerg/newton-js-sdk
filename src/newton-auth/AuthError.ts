interface IRawError {
    error: string;
    error_description: string;
}

export enum AuthErrorType {
    UNKNOWN_ERROR = 'unknown_error',
    INCORRECT_FLOW_SEQUENCE = 'incorrect_flow_sequence',
    PASSWORD_MISSING = 'password_missing',
}

export default class AuthError {
    public readonly error: string;
    public readonly errorDescription: string;

    public constructor(raw?: IRawError) {
        this.error = raw?.error ?? AuthErrorType.UNKNOWN_ERROR;
        this.errorDescription = raw?.error_description;
    }
}
