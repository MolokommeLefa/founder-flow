-- Add color, start_time, and end_time columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Add validation constraint for color field to ensure valid hex codes
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_color_format_check 
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Add comment to document the color field
COMMENT ON COLUMN public.tasks.color IS 'Hex color code for task visualization (e.g., #dc2626)';
COMMENT ON COLUMN public.tasks.start_time IS 'Task start time for calendar scheduling';
COMMENT ON COLUMN public.tasks.end_time IS 'Task end time for calendar scheduling';
