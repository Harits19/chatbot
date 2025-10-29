import { replaceObject } from '../services/variable';

describe('replaceObject', () => {
  test('replaces string and number placeholders', () => {
    const source = { user: { name: 'Alice', age: 30 } };
    const template = {
      greeting: 'Hello, {{ user.name }}!',
      ageMsg: 'You are {{ user.age }} years old'
    };

    const result = replaceObject(source, template);

    expect(result).toEqual({
      greeting: 'Hello, Alice!',
      ageMsg: 'You are 30 years old'
    });
  });

  test('replaces multiple placeholders in one string', () => {
    const source = { user: { name: 'Bob', age: 25 } };
    const template = { both: '{{ user.name }} - {{ user.age }}' };

    const result = replaceObject(source, template);

    expect(result).toEqual({ both: 'Bob - 25' });
  });

  test('supports nested paths', () => {
    const source = { a: { b: { c: 'nested' } } };
    const template = { val: 'Value: {{ a.b.c }}' };

    const result = replaceObject(source, template);
    expect(result).toEqual({ val: 'Value: nested' });
  });

  test('throws on non-primitive replacement value', () => {
    const source = { user: { meta: { id: 1 } } };
    const template = { data: '{{ user.meta }}' };

    expect(() => replaceObject(source, template)).toThrow(/Unimplemented typeof/);
  });
});
