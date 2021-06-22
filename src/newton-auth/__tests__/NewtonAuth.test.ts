import request from 'superagent';

import AuthError, {AuthErrorType} from '../AuthError';
import AuthResponse from '../AuthReponse';
import newtonAuth from '../NewtonAuth';
import {AuthFlowScheme, AuthFlowStep} from '../AuthState';

beforeEach(() => {
    newtonAuth.config({
        clientId: 'tezis',
        domain: 'https://keycloak.newton-technology.ru',
        realm: 'main',
        serviceRealm: 'service',
    });
});

describe('config', () => {
    it('should set config parameters correctly', () => {
        newtonAuth.config({
            clientId: 'some_client_id',
            domain: 'https://some.keycloak.com',
            realm: 'realm',
            serviceRealm: 'service_realm',
        });
        expect(newtonAuth.clientId).toEqual('some_client_id');
        expect(newtonAuth.domain).toEqual('https://some.keycloak.com');
        expect(newtonAuth.realm).toEqual('realm');
        expect(newtonAuth.serviceRealm).toEqual('service_realm');
        expect(newtonAuth.grantType).toEqual('password');
        expect(newtonAuth.authState).toBeFalsy();
    });
});

describe('validateFlow', () => {
    it('should throw error if step validation is failed', () => {
        expect(newtonAuth.authState?.loginStep).toBeUndefined();
        const protoNewtonAuth = Object.getPrototypeOf(newtonAuth);
        expect(() => protoNewtonAuth.validateFlowStep(AuthFlowStep.GET_MAIN_TOKEN)).toThrow(AuthError);
    });
    it('should throw error if scheme validation is failed', () => {
        expect(newtonAuth.authState?.loginFlow).toBeUndefined();
        const protoNewtonAuth = Object.getPrototypeOf(newtonAuth);
        expect(() => protoNewtonAuth.validateFlowScheme(AuthFlowScheme.SHORT)).toThrow(AuthError);
    });
});

describe('validateFlowScheme', () => {
    it('should throw error if scheme validation is failed', () => {
        expect(newtonAuth.authState?.loginFlow).toBeUndefined();
        const protoNewtonAuth = Object.getPrototypeOf(newtonAuth);
        expect(() => protoNewtonAuth.validateFlowScheme(AuthFlowScheme.SHORT)).toThrow(AuthError);
    });
});

describe('SHORT flow', () => {
    describe('sendPhoneCode', () => {
        beforeEach(() => {
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.SEND_PHONE_CODE]);
        });

        it('should call post request once', async () => {
            await newtonAuth.sendPhoneCode(phone_number);
            expect(request.post).toBeCalledTimes(1);
        });

        it('should keep correct auth flow state', async () => {
            await newtonAuth.sendPhoneCode(phone_number);
            expect(newtonAuth.authState?.loginFlow).toEqual(AuthFlowScheme.SHORT);
            expect(newtonAuth.authState?.loginStep).toEqual(AuthFlowStep.VERIFY_PHONE_CODE);
            expect(newtonAuth.authState?.codeCanBeResubmittedTimestamp).toBeTruthy();
            expect(newtonAuth.authState?.codeExpiresTimestamp).toBeTruthy();
        });

        it('should resolve correct response', async () => {
            const result = await newtonAuth.sendPhoneCode(phone_number);
            expect(result).toBeInstanceOf(AuthResponse);
            expect(result.accessTokenExpiresIn).toEqual(300);
            expect(result.refreshTokenExpiresIn).toEqual(1800);
            expect(result.accessToken).toEqual(
                responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.SEND_PHONE_CODE].body.access_token,
            );
            expect(result.refreshToken).toEqual(
                responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.SEND_PHONE_CODE].body.refresh_token,
            );
        });

        it('should reset state', async () => {
            newtonAuth.reset = jest.fn();
            await newtonAuth.sendPhoneCode(phone_number);
            expect(newtonAuth.reset).toBeCalledTimes(1);
            expect(newtonAuth.authState).toBeTruthy();
        });

        it('should reject correct error if http request is failed', async () => {
            mockErrorResponse({});
            await expect(newtonAuth.sendPhoneCode(phone_number)).rejects.toBeInstanceOf(AuthError);
            await expect(newtonAuth.sendPhoneCode(phone_number)).rejects.toHaveProperty(
                'error',
                AuthErrorType.UNKNOWN_ERROR,
            );
        });

        it('should reject correct error if an access token is invalid', async () => {
            const invalidTokenHttpResp = errorHttpResponse[AuthFlowScheme.SHORT][AuthFlowStep.SEND_PHONE_CODE];
            mockResponse(invalidTokenHttpResp);
            await expect(newtonAuth.sendPhoneCode(phone_number)).rejects.toHaveProperty(
                'error',
                AuthErrorType.UNKNOWN_ERROR,
            );
        });

        it('should reject correct error if http error is expected', async () => {
            mockResponse(unknownErrorHttpResponse);
            await expect(newtonAuth.sendPhoneCode(phone_number)).rejects.toBeInstanceOf(AuthError);
            await expect(newtonAuth.sendPhoneCode(phone_number)).rejects.toHaveProperty(
                'error',
                AuthErrorType.UNKNOWN_ERROR,
            );
        });
    });

    describe('verifyPhone', () => {
        beforeEach(async () => {
            mockResponse(sendPhoneCodeHttpResponse);
            await newtonAuth.sendPhoneCode(phone_number);
        });

        it('should reject error if auth flow state is not expected', async () => {
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
            await newtonAuth.verifyPhone(phone_code);
            await expect(newtonAuth.verifyPhone(phone_code)).rejects.toHaveProperty(
                'error',
                AuthErrorType.INCORRECT_FLOW_SEQUENCE,
            );
        });

        it('should keep correct auth flow state', async () => {
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
            await newtonAuth.verifyPhone(phone_code);
            expect(newtonAuth.authState?.loginFlow).toEqual(AuthFlowScheme.SHORT);
            expect(newtonAuth.authState?.loginStep).toEqual(AuthFlowStep.GET_MAIN_TOKEN);
            expect(newtonAuth.authState?.phoneNumber).toEqual(phone_number);
        });

        it('should resolve correct result', async () => {
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
            const result = await newtonAuth.verifyPhone(phone_code);
            expect(result).toBeInstanceOf(AuthResponse);
        });
    });

    describe('authorize', () => {
        beforeEach(async () => {
            mockResponse(sendPhoneCodeHttpResponse);
            await newtonAuth.sendPhoneCode(phone_number);
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
            await newtonAuth.verifyPhone(phone_code);
        });

        it('should reject error if auth flow state is not expected', async () => {
            mockResponse(sendPhoneCodeHttpResponse);
            await newtonAuth.sendPhoneCode(phone_number);
            await expect(newtonAuth.authorize()).rejects.toHaveProperty('error', AuthErrorType.INCORRECT_FLOW_SEQUENCE);
        });

        it('should resolve correct result', async () => {
            mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
            const result = await newtonAuth.authorize();
            expect(result).toBeInstanceOf(AuthResponse);
            expect(newtonAuth.authState.loginFlow).toBeFalsy();
            expect(newtonAuth.authState.loginStep).toBeFalsy();
            expect(newtonAuth.authState.userId).toBeTruthy();
        });
    });
});

describe('NORMAL flow', () => {
    test('flow should be processed correctly', async () => {
        mockResponse(sendPhoneCodeHttpResponse);
        await newtonAuth.sendPhoneCode(phone_number);
        await expect(newtonAuth.authorize(password)).rejects.toHaveProperty(
            'error',
            AuthErrorType.INCORRECT_FLOW_SEQUENCE,
        );
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
        await expect(newtonAuth.authorize()).rejects.toHaveProperty('error', AuthErrorType.PASSWORD_MISSING);
        await expect(newtonAuth.authorize(password)).resolves.toBeInstanceOf(AuthResponse);
    });
});

describe('NORMAL_WITH_EMAIL flow', () => {
    beforeEach(async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.SEND_PHONE_CODE]);
        await newtonAuth.sendPhoneCode(phone_number);
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
    });
    test('sendEmailCode() should resolve correct response with email', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.SEND_EMAIL_CODE]);
        await expect(newtonAuth.sendEmailCode(email)).resolves.toBeInstanceOf(AuthResponse);
    });
    test('sendEmailCode() should resolve correct response without email', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.SEND_EMAIL_CODE]);
        await expect(newtonAuth.sendEmailCode()).resolves.toBeInstanceOf(AuthResponse);
    });
    test('flow should be processed correctly', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.SEND_EMAIL_CODE]);
        await newtonAuth.sendEmailCode();
        await expect(newtonAuth.sendEmailCode()).rejects.toHaveProperty('error', AuthErrorType.INCORRECT_FLOW_SEQUENCE);
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL_WITH_EMAIL][AuthFlowStep.VERIFY_EMAIL_CODE]);
        await newtonAuth.verifyEmail(email_code);
        await expect(newtonAuth.verifyEmail(email_code)).rejects.toHaveProperty(
            'error',
            AuthErrorType.INCORRECT_FLOW_SEQUENCE,
        );
        await expect(newtonAuth.authorize()).rejects.toHaveProperty('error', AuthErrorType.PASSWORD_MISSING);
        await expect(newtonAuth.authorize(password)).resolves.toBeInstanceOf(AuthResponse);
    });
});

describe('refreshToken', () => {
    beforeEach(async () => {
        mockResponse(sendPhoneCodeHttpResponse);
        await newtonAuth.sendPhoneCode(phone_number);
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
    });

    it('should resolve correct result', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
        const resp = await newtonAuth.authorize();
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
        await expect(newtonAuth.refreshAccessToken(resp.refreshToken)).resolves.toBeInstanceOf(AuthResponse);
    });
});

describe('changePassword', () => {
    it('should resolve correct response', async () => {
        mockResponse(sendPhoneCodeHttpResponse);
        await newtonAuth.sendPhoneCode(phone_number);
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
        const response = await newtonAuth.authorize(password);
        await expect(newtonAuth.changePassword(response.accessToken, newPassword)).resolves.toBeInstanceOf(
            AuthResponse,
        );
    });
});

describe('resetPassword', () => {
    beforeEach(async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL][AuthFlowStep.SEND_PHONE_CODE]);
        await newtonAuth.sendPhoneCode(phone_number);
    });

    it('should reject error if there is incorrect flow scheme', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
        await expect(newtonAuth.resetPassword()).rejects.toHaveProperty('error', AuthErrorType.INCORRECT_FLOW_SEQUENCE);
    });

    it('should reject error if there is incorrect flow step', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL][AuthFlowStep.SEND_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
        await expect(newtonAuth.resetPassword()).rejects.toHaveProperty('error', AuthErrorType.INCORRECT_FLOW_SEQUENCE);
    });

    it('should resolve correct response', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.NORMAL][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
        await expect(newtonAuth.resetPassword()).resolves.toBeInstanceOf(AuthResponse);
    });
});

describe('revokeRefreshToken', () => {
    beforeEach(async () => {
        mockResponse(sendPhoneCodeHttpResponse);
        await newtonAuth.sendPhoneCode(phone_number);
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.VERIFY_PHONE_CODE]);
        await newtonAuth.verifyPhone(phone_code);
    });

    it('should reject error if request is failed', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
        const resp = await newtonAuth.authorize();
        mockErrorResponse(errorHttpResponse);
        await expect(newtonAuth.revokeRefreshToken(resp.accessToken)).rejects.toHaveProperty(
            'error',
            AuthErrorType.UNKNOWN_ERROR,
        );
    });

    it('should resolve true if token is revoked successfully', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
        const resp = await newtonAuth.authorize();
        mockResponse({statusCode: 200});
        await expect(newtonAuth.revokeRefreshToken(resp.accessToken)).resolves.toBeTruthy();
    });

    it('should reject error if token is not revoked successfully', async () => {
        mockResponse(responseOfStep[AuthFlowScheme.SHORT][AuthFlowStep.GET_MAIN_TOKEN]);
        const resp = await newtonAuth.authorize(password);
        mockResponse({statusCode: 500});
        await expect(newtonAuth.revokeRefreshToken(resp.accessToken)).rejects.toBeInstanceOf(AuthError);
    });
});

const phone_number = '+70123456789';
const phone_code = '1111';
const email = 'sample@mail.com';
const email_code = '2222';
const password = 'password';
const newPassword = 'new_password';

const unknownErrorHttpResponse = {
    statusCode: 500,
    body: {
        error: AuthErrorType.UNKNOWN_ERROR,
        error_description: 'Some unknown error',
    },
};

const sendPhoneCodeHttpResponse = {
    statusCode: 200,
    body: {
        access_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Q2NVS1NRN3JZNkJNSVRWcDFzS09lejJUVE8tcElESGZLWW1EVmlnZEJNIn0.eyJleHAiOjE2MjM0MTIzNDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfUEhPTkVfQ09ERSIsImxvZ2luX2Zsb3ciOiJTSE9SVCJ9.pHrJTmjsM_zkJjJ7_AXSlWMHyPvh8K5rm3C46x_Pn5BSZKsyKMmFV0VfN5Os-M2_zs8isut5ETVqeROy3xSDQWOlljysmyT5H2iBiev3JuW8AGgsQLVg7Q6aDa6MaW483eA7yxz5ZQZOusobom-1VEw-AKzxowNRnG07Nyn6MbOuf8MwEAFstmcCNwjdAEL7f6lUe3zCcvlCogOcZY8e_-546QzeIR64uGs9YOoHJ_jT891pkknZ75jLWZoeuZMT45169XFtTNxl3Njku1VfKXztUd0ZAYn0meMlYNc9mFxgHBknviC6ydSln_C11Q5SFrXRZNHHx_Q7pLoaKZLa_A',
        expires_in: 300,
        refresh_expires_in: 1800,
        refresh_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
        scope: '',
    },
};

const errorHttpResponse = {
    [AuthFlowScheme.SHORT]: {
        [AuthFlowStep.SEND_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token: 'invalid_token',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
    },
};

const responseOfStep = {
    [AuthFlowScheme.SHORT]: {
        [AuthFlowStep.SEND_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjQzNTY3NTEsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfUEhPTkVfQ09ERSIsImxvZ2luX2Zsb3ciOiJTSE9SVCIsImNvZGVfY2FuX2JlX3Jlc3VibWl0dGVkX3RpbWVzdGFtcCI6MTYyNDM1MjkxNCwiY29kZV9leHBpcmVzX3RpbWVzdGFtcCI6MTYyNDM1MzE1NH0.7dlR-6Im-ubkGks22_4WUPoGbtZyoVtC9-O8xKwV-cU',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.VERIFY_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjM0MTU4NjgsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJHRVRfTUFJTl9UT0tFTiIsImxvZ2luX2Zsb3ciOiJTSE9SVCJ9.dMVHEO1cO6xoCfwv6GCAQejntUG8f8RMXWen3qETuJg',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.GET_MAIN_TOKEN]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0VFd6N0c4NXoxdWVRR0ZWdjZKT0cza1hRdVA1am0zVmEtWV9zUVpEb29NIn0.eyJleHAiOjE2MjM3ODIyMzEsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiYTA0MjhmOGMtZmExYy00YWUxLTlmMzMtZjFmOTk5MWY0ZGY2IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjRhYjMwNGJlLWQ1MDUtNDBjYy04ZDI0LWM2MGVmNzIxZTIxYiIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSIsImJvX2NsaWVudF9pZCI6bnVsbCwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjo4NDEsInByZWZlcnJlZF91c2VybmFtZSI6Ijg0MSJ9.oREmnLy07KJ_ed4EhnHZjMf0IdB3chSccvRB5G4rXdUzbAjibOw0M3ZJIF_eVqF3XRI3LSdXTeGLuawFu_cq_hfYWpOoncwe7xMYVaFUDz0oeBe9qxaYqyz-GEN-20grpKhYY4Kf26Y-fu5YJThH-HADrokhorjRngbebItTtdWtJFR-g7enBoEdRAUunKleurxuyJAVRZXTNp943_VKG3ZRxNCcMLU2wUAhlZhmgr_yokTnQuT0TQDwCkpMRpfDRFsIfwUbjvq92hZY0JGDCK31uVSlveC_JG0e__gKKHDx06CzNJ3jtkSjv3JS9xfZQqA0ElinTK8n3vl_4f-vZA',
                expires_in: 300,
                refresh_expires_in: 5184000,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkY2E0MTg3ZS02YmQ3LTRkMTktOWVjNC0xZjY5ZTRjZTAzMjQifQ.eyJleHAiOjE2Mjg5NjU5MzEsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiNzVjNTRiMTgtYzdmMi00NGI5LWFlNTUtNjQ0NTFkZThkNzcwIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwic3ViIjoiNGFiMzA0YmUtZDUwNS00MGNjLThkMjQtYzYwZWY3MjFlMjFiIiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsInNjb3BlIjoiZW1haWwgcHJvZmlsZSJ9.DJjQeMDVmLb4ieffhdPo33Ijgt8HZ_a0PWz5o7pVIio',
                token_type: 'Bearer',
                'not-before-policy': 1622012381,
                session_state: 'ceefad37-1f0c-4312-a673-3aa380307da6',
                scope: 'email profile',
            },
        },
    },
    [AuthFlowScheme.NORMAL]: {
        [AuthFlowStep.SEND_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjQzNTY3OTcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfUEhPTkVfQ09ERSIsImxvZ2luX2Zsb3ciOiJOT1JNQUwiLCJjb2RlX2Nhbl9iZV9yZXN1Ym1pdHRlZF90aW1lc3RhbXAiOjE2MjQzNTI5MTQsImNvZGVfZXhwaXJlc190aW1lc3RhbXAiOjE2MjQzNTMxNTR9.jnRuGUt20PjdYaIr7L6_WiZgqR_zMhwtsM-xoGYrENo',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.VERIFY_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjM4MzE2NTIsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJHRVRfTUFJTl9UT0tFTiIsImxvZ2luX2Zsb3ciOiJOT1JNQUwifQ.vj63HZmhm5E6piYV4VHKDPVtWFIB472TAiyR_iPpfEo',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.GET_MAIN_TOKEN]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0VFd6N0c4NXoxdWVRR0ZWdjZKT0cza1hRdVA1am0zVmEtWV9zUVpEb29NIn0.eyJleHAiOjE2MjM3ODIyMzEsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiYTA0MjhmOGMtZmExYy00YWUxLTlmMzMtZjFmOTk5MWY0ZGY2IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjRhYjMwNGJlLWQ1MDUtNDBjYy04ZDI0LWM2MGVmNzIxZTIxYiIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSIsImJvX2NsaWVudF9pZCI6bnVsbCwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjo4NDEsInByZWZlcnJlZF91c2VybmFtZSI6Ijg0MSJ9.oREmnLy07KJ_ed4EhnHZjMf0IdB3chSccvRB5G4rXdUzbAjibOw0M3ZJIF_eVqF3XRI3LSdXTeGLuawFu_cq_hfYWpOoncwe7xMYVaFUDz0oeBe9qxaYqyz-GEN-20grpKhYY4Kf26Y-fu5YJThH-HADrokhorjRngbebItTtdWtJFR-g7enBoEdRAUunKleurxuyJAVRZXTNp943_VKG3ZRxNCcMLU2wUAhlZhmgr_yokTnQuT0TQDwCkpMRpfDRFsIfwUbjvq92hZY0JGDCK31uVSlveC_JG0e__gKKHDx06CzNJ3jtkSjv3JS9xfZQqA0ElinTK8n3vl_4f-vZA',
                expires_in: 300,
                refresh_expires_in: 5184000,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkY2E0MTg3ZS02YmQ3LTRkMTktOWVjNC0xZjY5ZTRjZTAzMjQifQ.eyJleHAiOjE2Mjg5NjU5MzEsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiNzVjNTRiMTgtYzdmMi00NGI5LWFlNTUtNjQ0NTFkZThkNzcwIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwic3ViIjoiNGFiMzA0YmUtZDUwNS00MGNjLThkMjQtYzYwZWY3MjFlMjFiIiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsInNjb3BlIjoiZW1haWwgcHJvZmlsZSJ9.DJjQeMDVmLb4ieffhdPo33Ijgt8HZ_a0PWz5o7pVIio',
                token_type: 'Bearer',
                'not-before-policy': 1622012381,
                session_state: 'ceefad37-1f0c-4312-a673-3aa380307da6',
                scope: 'email profile',
            },
        },
    },
    [AuthFlowScheme.NORMAL_WITH_EMAIL]: {
        [AuthFlowStep.SEND_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjQzNTY4MjcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfUEhPTkVfQ09ERSIsImxvZ2luX2Zsb3ciOiJOT1JNQUxfV0lUSF9FTUFJTCIsImNvZGVfY2FuX2JlX3Jlc3VibWl0dGVkX3RpbWVzdGFtcCI6MTYyNDM1MjkxNCwiY29kZV9leHBpcmVzX3RpbWVzdGFtcCI6MTYyNDM1MzE1NH0.XrlggDBBj_7M9GWm_P89jnji14c8M-SmLMoxBU4mwdo',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.VERIFY_PHONE_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjM4MzQzMjAsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJTRU5EX0VNQUlMX0NPREUiLCJsb2dpbl9mbG93IjoiTk9STUFMX1dJVEhfRU1BSUwifQ.k9s4VnRGoQW5Cpl4HxWsKCeBfOVmA7UzOmm1-zQ9gEA',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.SEND_EMAIL_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjQzNTY4NTQsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfRU1BSUxfQ09ERSIsImxvZ2luX2Zsb3ciOiJOT1JNQUxfV0lUSF9FTUFJTCIsImNvZGVfY2FuX2JlX3Jlc3VibWl0dGVkX3RpbWVzdGFtcCI6MTYyNDM1MjkxNCwiY29kZV9leHBpcmVzX3RpbWVzdGFtcCI6MTYyNDM1MzE1NH0.ckdm9Oj3Kf3d-wuT4VAG87Ug-UmsxZpKJiakfSiCqNQ',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.VERIFY_EMAIL_CODE]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjM4MzM0MTgsImlhdCI6MTYyMzQxMjA0NywianRpIjoiMGRhZTIwYzQtM2U0MC00OTViLWE2Y2QtM2U5MGExMDNhYTQyIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3MDEyMzQ1Njc4OSIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInBob25lX251bWJlciI6Iis3MDEyMzQ1Njc4OSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJHRVRfTUFJTl9UT0tFTiIsImxvZ2luX2Zsb3ciOiJOT1JNQUxfV0lUSF9FTUFJTCJ9.8zcF-Op_ToInshfCx39HOWL3QazTpJ6Z_HGC7UuqD_s',
                expires_in: 300,
                refresh_expires_in: 1800,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjM0MTM4NDcsImlhdCI6MTYyMzQxMjA0NywianRpIjoiNDI4YjU3ZTEtOGUxNS00M2NhLTkyMjAtNjlhZDM5MDUwM2NmIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzcwMTIzNDU2Nzg5IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImUxOTUwZGRmLTU4M2EtNDdkZS05MzNhLTFiMTVkMGVlYzc1ZCIsInNjb3BlIjoiIn0.7qp7sagIaAKo6dUaVt7UcGNUCPpcNndQmRj3T3FvaQw',
                token_type: 'Bearer',
                'not-before-policy': 0,
                session_state: 'e1950ddf-583a-47de-933a-1b15d0eec75d',
                scope: '',
            },
        },
        [AuthFlowStep.GET_MAIN_TOKEN]: {
            statusCode: 200,
            body: {
                access_token:
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MjM4MzM0OTgsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiYTA0MjhmOGMtZmExYy00YWUxLTlmMzMtZjFmOTk5MWY0ZGY2IiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjRhYjMwNGJlLWQ1MDUtNDBjYy04ZDI0LWM2MGVmNzIxZTIxYiIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSIsImJvX2NsaWVudF9pZCI6bnVsbCwibWFza2VkX2VtYWlsIjoiYSoqKnoiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidXNlcl9pZCI6ODQxLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiI4NDEifQ.kehi_BrezETLtB37Dc0j8iQqHusDThiNj5fLi0rL7BE',
                expires_in: 300,
                refresh_expires_in: 5184000,
                refresh_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkY2E0MTg3ZS02YmQ3LTRkMTktOWVjNC0xZjY5ZTRjZTAzMjQifQ.eyJleHAiOjE2Mjg5NjU5MzEsImlhdCI6MTYyMzc4MTkzMSwianRpIjoiNzVjNTRiMTgtYzdmMi00NGI5LWFlNTUtNjQ0NTFkZThkNzcwIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9tYWluIiwic3ViIjoiNGFiMzA0YmUtZDUwNS00MGNjLThkMjQtYzYwZWY3MjFlMjFiIiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImNlZWZhZDM3LTFmMGMtNDMxMi1hNjczLTNhYTM4MDMwN2RhNiIsInNjb3BlIjoiZW1haWwgcHJvZmlsZSJ9.DJjQeMDVmLb4ieffhdPo33Ijgt8HZ_a0PWz5o7pVIio',
                token_type: 'Bearer',
                'not-before-policy': 1622012381,
                session_state: 'ceefad37-1f0c-4312-a673-3aa380307da6',
                scope: 'email profile',
            },
        },
    },
};

const mockResponse = (resp) => {
    (request as any).set = jest.fn().mockResolvedValue(resp);
};

const mockErrorResponse = (resp) => {
    (request as any).set = jest.fn().mockRejectedValue(resp);
};
