import app from '../../src/index'

type Env = {
  DB: D1Database
  EXCHANGE_RATE_KV: KVNamespace
  JWT_SECRET: string
  ENGINE_API_URL: string
  EXCHANGE_API_KEY: string
  ENVIRONMENT: string
}

function createMockEnv(): Env {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => ({ ok: 1 }),
        }),
      }),
    } as unknown as D1Database,
    EXCHANGE_RATE_KV: {
      get: async () => null,
      put: async () => undefined,
    } as unknown as KVNamespace,
    JWT_SECRET: 'test-secret',
    ENGINE_API_URL: 'http://engine.local',
    EXCHANGE_API_KEY: 'test-key',
    ENVIRONMENT: 'test',
  }
}

async function requestJson(
  path: string,
  init: RequestInit,
  env: Env
): Promise<{ status: number; json: any; res: Response }> {
  const res = await app.request(path, init, env)
  const json = await res.json().catch(() => undefined)
  return { status: res.status, json, res }
}

describe('T041: broker authorization flow (integration)', () => {
  const email = `user+${Date.now()}@example.com`
  const password = 'Password!1'
  const brokerId = 'futu'
  const env = createMockEnv()

  it('creates auth task and issues delegation token for Engine', async () => {
    const signup = await requestJson(
      'http://localhost/auth/signup',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, locale: 'en' }),
      },
      env
    )

    expect(signup.status).toBe(201)
    expect(signup.json).toMatchObject({ email })

    const signin = await requestJson(
      'http://localhost/auth/signin',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      env
    )

    expect(signin.status).toBe(200)
    expect(signin.json).toMatchObject({ token: expect.any(String), user: { email } })

    const token: string = signin.json.token

    const connect = await requestJson(
      `http://localhost/brokers/${brokerId}/connect`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
      env
    )

    expect(connect.status).toBe(201)
    expect(connect.json).toMatchObject({ task_id: expect.any(String), token: expect.any(String) })

    const taskId: string = connect.json.task_id

    const taskStatus = await requestJson(
      `http://localhost/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
      env
    )

    expect(taskStatus.status).toBe(200)
    expect(taskStatus.json).toMatchObject({
      id: taskId,
      type: 'authorization',
      broker_id: brokerId,
      status: expect.stringMatching(/pending|in_progress|paused|completed|failed|expired/),
    })
  })
})
