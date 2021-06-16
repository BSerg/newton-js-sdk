const response = {
    statusCode: 200,
    body: {
        access_token:
            'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Q2NVS1NRN3JZNkJNSVRWcDFzS09lejJUVE8tcElESGZLWW1EVmlnZEJNIn0.eyJleHAiOjE2MjMzMzAzNDYsImlhdCI6MTYyMzMzMDA0NiwianRpIjoiODEyZmQ4NDItOWZkMC00MzExLTkwMDMtYjllMzNkYzljM2MwIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6Iis3OTA0MjcyMzg0NCIsInR5cCI6IkJlYXJlciIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImJlNTI5MDk5LTYwYzgtNGNjZC04YjZhLTQ1N2NkYjcxYmNhYiIsInBob25lX251bWJlciI6Iis3OTA0MjcyMzg0NCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6IiIsImxvZ2luX3N0ZXAiOiJWRVJJRllfUEhPTkVfQ09ERSIsImxvZ2luX2Zsb3ciOiJTSE9SVCJ9.SvLpXkbHYxSgMlJuuZNZAxvxkil9sq1Kcr3fIF8F51K32Fp5qPM6vtkUh60aZzP7B5Z7ztDumKHXQh4PjBefv3xz7O5An50uY4Qdzn9O804iv-_V61wxXu-5KA-wgc8PB6yvoFk8FJA5SwaU_jglp3jovu17grDkMGhlpheHRHaY1z9-v5VsdYfT9vXJnoCEwGbRXLrfBu7oaGK6LLB8UkQDQTqDgdKHKUqHi9J0EfWi59gfeXjvAZuglMJrTpGLltVRGuPDhc8QR0f-g5kc-x-XtasQn29MbpziODOGMwwZrE89QniFzT7XOhH4J2fmtZ__Z41wpb7c_Cu31UCLtQ',
        expires_in: 300,
        refresh_expires_in: 1800,
        refresh_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1NjQ3YTU4Yy1jNmJjLTQ4ODYtOGM4NC1lMDY4MjVhNjhjMzYifQ.eyJleHAiOjE2MjMzMzE4NDYsImlhdCI6MTYyMzMzMDA0NiwianRpIjoiYTg1NjUyNDUtZmZmZS00ZjdmLWE0ZDEtMjZmZjRkMTY2ZWNlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwiYXVkIjoiaHR0cHM6Ly9rZXljbG9hay5uZXd0b24tdGVjaG5vbG9neS5ydS9hdXRoL3JlYWxtcy9zZXJ2aWNlIiwic3ViIjoiKzc5MDQyNzIzODQ0IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRlemlzIiwic2Vzc2lvbl9zdGF0ZSI6ImJlNTI5MDk5LTYwYzgtNGNjZC04YjZhLTQ1N2NkYjcxYmNhYiIsInNjb3BlIjoiIn0.zCTJVCVtTgTWWHcbP3sPlBFKVlmYBsYARlAyVJlNzXE',
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'be529099-60c8-4ccd-8b6a-457cdb71bcab',
        scope: '',
    },
};

export default (() => ({
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(response),
}))();
