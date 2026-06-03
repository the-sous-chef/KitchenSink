CREATE TABLE webhook_events (
    svix_id text PRIMARY KEY,
    received_at timestamptz NOT NULL DEFAULT now()
);
