import { describe, expect, it } from 'bun:test';
import { app } from '../src/index';

describe('Elysia API Integration Tests', () => {
  it('GET / should return Inkboot API is running', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Inkboot API is running');
  });

  it('POST /characters with invalid body should return 422 Validation Error', async () => {
    // novelId is missing, which is required
    const invalidPayload = {
      name: 'Rudeus',
      age: 12
    };

    const response = await app.handle(
      new Request('http://localhost/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPayload)
      })
    );

    // According to our new global error handler, this should be 422
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.status).toBe('error');
    expect(data.message).toBe('Validation Error');
  });
});
