import NewtonAuth from '../index';

describe('NewtonAuth', () => {
    const newtonAuth = new NewtonAuth();

    test('method hello should return correct string', () => {
        expect(newtonAuth.hello('Foo')).toEqual('Hello Foo');
    });
});
