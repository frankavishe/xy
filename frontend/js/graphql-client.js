// Minimal GraphQL client: fetch() for queries/mutations, a hand-rolled
// graphql-transport-ws implementation for subscriptions. No client
// libraries — spec 2.2 keeps the frontend to native HTML5/ES6+ only.

export async function gqlRequest(query, variables = {}) {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export class GraphQLSubscriptionClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.connectPromise = null;
    this.subscriptions = new Map();
    this.nextId = 1;
  }

  connect() {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url, 'graphql-transport-ws');
      this.ws = ws;

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'connection_init' }));
      });

      ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'connection_ack':
            resolve();
            break;
          case 'next': {
            const sub = this.subscriptions.get(message.id);
            sub?.onNext(message.payload?.data);
            break;
          }
          case 'error': {
            const sub = this.subscriptions.get(message.id);
            sub?.onError?.(message.payload);
            this.subscriptions.delete(message.id);
            break;
          }
          case 'complete': {
            const sub = this.subscriptions.get(message.id);
            sub?.onComplete?.();
            this.subscriptions.delete(message.id);
            break;
          }
        }
      });

      ws.addEventListener('error', (err) => reject(err));
      ws.addEventListener('close', () => {
        this.connectPromise = null;
      });
    });
    return this.connectPromise;
  }

  /** Returns an unsubscribe function. */
  async subscribe(query, variables, { onNext, onError, onComplete }) {
    await this.connect();
    const id = String(this.nextId++);
    this.subscriptions.set(id, { onNext, onError, onComplete });
    this.ws.send(JSON.stringify({ id, type: 'subscribe', payload: { query, variables } }));
    return () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ id, type: 'complete' }));
      }
      this.subscriptions.delete(id);
    };
  }
}
