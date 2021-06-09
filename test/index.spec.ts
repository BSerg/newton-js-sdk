import {hello} from '../src';

test('should return correct greeting', () => {
    expect(hello('Foo')).toEqual('Hello Foo');
});
