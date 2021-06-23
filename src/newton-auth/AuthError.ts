interface IRawError {
    error: string;
    error_description: string;
}

export enum AuthErrorCode {
    UNKNOWN_ERROR = 'unknown_error',
    REALM_DISABLED = 'realm_disabled',
    INVALID_REQUEST = 'invalid_request',
    NOT_ALLOWED = 'not_allowed',
    INVALID_TOKEN = 'invalid_token',
    INCORRECT_FLOW_SEQUENCE = 'incorrect_flow_sequence',
    INVALID_GRANT = 'invalid_grant',
    INVALID_PHONE = 'invalid_phone',
    PHONE_MISSING = 'phone_missing',
    USERNAME_MISSING = 'username_missing',
    USERNAME_IN_USE = 'username_in_use',
    EMAIL_IN_USE = 'email_in_use',
    CODE_MISSING = 'code_missing',
    CODE_ALREADY_SUBMITTED = 'code_already_submitted',
    PASSWORD_MISSING = 'password_missing',
}

export default class AuthError {
    public readonly error: string;
    public readonly errorDescription: string;

    public constructor(raw?: IRawError) {
        this.error = raw?.error ?? AuthErrorCode.UNKNOWN_ERROR;
        this.errorDescription = raw?.error_description;
    }
}
