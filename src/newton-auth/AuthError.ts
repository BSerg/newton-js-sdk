interface IRawError {
    error: string;
    error_description: string;
}

export enum AuthErrorCode {
    UnknownError = 'unknown_error',
    RealmDisabled = 'realm_disabled',
    InvalidRequest = 'invalid_request',
    NotAllowed = 'not_allowed',
    InvalidToken = 'invalid_token',
    IncorrectFlowSequence = 'incorrect_flow_sequence',
    InvalidGrant = 'invalid_grant',
    InvalidPhone = 'invalid_phone',
    PhoneMissing = 'phone_missing',
    UsernameMissing = 'username_missing',
    UsernameInUse = 'username_in_use',
    EmailInUse = 'email_in_use',
    CodeMissing = 'code_missing',
    CodeAlreadySubmitted = 'code_already_submitted',
    PasswordMissing = 'password_missing',
    AttemptsOtpCheckExceeded = 'attempts_otp_check_exceeded',
}

export default class AuthError {
    public readonly error: string;
    public readonly errorDescription: string;

    public constructor(raw?: IRawError) {
        this.error = raw?.error ?? AuthErrorCode.UnknownError;
        this.errorDescription = raw?.error_description;
    }
}
