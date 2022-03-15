interface IRawError {
    error: string;
    error_description: string;
    otp_checks_left?: number;
    otp_sends_left?: number;
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
    /// Password is blacklisted
    InvalidPasswordBlacklisted = 'invalid_password_blacklisted',
    /// Password has too few digits
    InvalidPasswordMinDigits = 'invalid_password_min_digits',
    /// Password was recently used
    InvalidPasswordHistory = 'invalid_password_history',
    /// Password if too short
    Invalid_password_min_length = 'invalid_password_min_length',
    /// Password has too few lower chars
    InvalidPasswordMinLowerCaseChars = 'invalid_password_min_lower_case_chars',
    /// Password is too long
    InvalidPasswordMaxLength = 'invalid_password_max_length',
    /// Password equals email
    InvalidPasswordNotEmail = 'invalid_password_not_email',
    /// Password equals username
    InvalidPasswordNotUsername = 'invalid_password_not_username',
    /// Invalid password regex pattern
    InvalidPasswordRegexPattern = 'invalid_password_regex_pattern',
    /// Password has too few special symbols
    InvalidPasswordMinSpecialChars = 'invalid_password_min_special_chars',
    /// Password has too few uppersymbols
    InvalidPasswordMinUpperCaseChars = 'invalid_password_min_upper_case_chars',
}

export default class AuthError {
    public readonly error: string;
    public readonly errorDescription: string;
    public readonly otpChecksLeft?: number;
    public readonly otpSendsLeft?: number;

    public constructor(raw?: IRawError) {
        this.error = raw?.error ?? AuthErrorCode.UnknownError;
        this.errorDescription = raw?.error_description;
        this.otpChecksLeft = raw?.otp_checks_left;
        this.otpSendsLeft = raw?.otp_sends_left;
    }
}
