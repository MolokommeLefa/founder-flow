
-- Enable RLS on realtime.messages and restrict channel access
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive their own message events" ON realtime.messages;

CREATE POLICY "Authenticated users can receive their own message events"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.sender_id = auth.uid() OR m.recipient_id = auth.uid()
  )
);
