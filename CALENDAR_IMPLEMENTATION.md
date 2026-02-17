# Calendar Implementation Documentation

## Overview

This document describes the implementation of the Notion-inspired Calendar feature for the FounderFlow application. The calendar provides an intuitive interface for managing tasks and schedules with a clean, modern design.

## Features Implemented

### 1. Calendar Layout & Design ✅

#### View Modes
- **Monthly Grid View**: Displays all days of the current month in a 7-column grid (Sun-Sat)
- **Weekly Timeline View**: NEW! Shows 7 days with hourly time slots (00:00 - 23:00)
- **View Mode Toggle**: Switch between Month and Week views seamlessly

#### Mini Calendar Sidebar
- **Compact Month View**: NEW! Quick navigation calendar in the sidebar
- **Date Selection**: Click any date to navigate to that day
- **Month Navigation**: Built-in prev/next month controls

#### Navigation & Controls
- Previous/Next month buttons and "Today" button for quick navigation
- Month/Year Header: Displays current month and year prominently
- Day Highlighting: Current day is highlighted with a ring border
- Grayed Out Days: Days from previous/next months shown in muted colors
- Consistent Styling: Uses Shadcn/UI components and Tailwind CSS patterns

### 2. Task Integration ✅

The calendar integrates seamlessly with the existing Supabase tasks database:

#### Task Display
- Tasks displayed on their due dates
- Task count badges show number of tasks per day
- **Custom Color Coding**: NEW! Each task can have a custom color (not just priority-based)
- Task blocks with semi-transparent backgrounds and colored borders
- Rounded corners (6px border-radius) for modern look
- Limit of 3 visible tasks per day in month view with "+X more" indicator

#### Week View Features
- **Time-based Positioning**: NEW! Tasks positioned based on start_time
- **Current Time Indicator**: NEW! Red horizontal line showing current time (like Apple Calendar)
- **Today Column Highlight**: NEW! Subtle background for today's column
- **Hour Lines**: Light gray horizontal lines for each hour
- **Task Duration**: Visual representation of task length (start_time to end_time)
- **All-day Tasks**: Tasks without specific times shown at the top

### 3. Task Creation & Management ✅

#### Creating Tasks
- Click on any calendar day to open the task creation dialog
- **NEW! Click on time slots** in week view to create tasks at specific times
- Due date is automatically pre-filled with the selected day/time
- Dialog includes:
  - Title input (required)
  - Description textarea (optional)
  - Status selection (Not Started, In Progress, Completed)
  - Priority selection (Low, Medium, High)
  - Due date picker (editable)
  - **NEW! Start Time picker** (datetime-local input)
  - **NEW! End Time picker** (datetime-local input)
  - **NEW! Color Picker** with predefined palette:
    - Blue (#2563eb) - Default
    - Red (#dc2626)
    - Orange (#ea580c)
    - Yellow (#ca8a04)
    - Green (#16a34a)
    - Purple (#9333ea)
    - Pink (#db2777)
    - Gray (#6b7280)
    - Custom color option with HTML color picker

#### Editing Tasks
- Click on any task card to edit it
- Same dialog opens with all fields pre-populated
- Can update all task properties including status, priority, color, and times

### 4. Task Display ✅

Each day cell (Month View) shows:
- Day number (current day has special highlighting)
- Task count badge (if tasks exist)
- Up to 3 task cards with:
  - Truncated title
  - **Custom color background** (semi-transparent) with solid border
  - Hover tooltip with full details
  - Strikethrough for completed tasks

Week View shows:
- Time-based task positioning within hourly slots
- Task blocks with duration-based height
- Task title and start time
- Color-coded borders and backgrounds
- Hover tooltips with full task details
- All-day tasks in the header section

### 5. Additional Features ✅

- **Show/Hide Completed**: Toggle to filter out completed tasks
- **Loading States**: Proper loading indicators while fetching data
- **Authentication**: Redirects to /auth if user is not authenticated
- **Responsive Design**: Works on both desktop and mobile (via existing DashboardSidebar pattern)

## Technical Implementation

### Database Schema Updates

**NEW Migration**: `20260217085336_add_task_color_and_time_fields.sql`

Added columns to the `tasks` table:
```sql
color VARCHAR(7) DEFAULT '#2563eb'    -- Hex color code for task visualization
start_time TIMESTAMP WITH TIME ZONE   -- Task start time for calendar scheduling
end_time TIMESTAMP WITH TIME ZONE     -- Task end time for calendar scheduling
```

### Files Modified

1. **`src/hooks/useTasks.ts`**
   - Updated `DbTask` interface to include `color`, `start_time`, `end_time`
   - Updated `NewTask` interface to include optional color and time fields
   - Modified `addTask` to handle new fields (defaults color to #2563eb)
   - Modified `updateTask` to handle new fields

2. **`src/App.tsx`**
   - Added `/calendar` route pointing to the Calendar page

3. **`src/components/dashboard/DashboardSidebar.tsx`**
   - Added `href: "/calendar"` to the Calendar menu item

4. **`src/pages/Calender.tsx`** (Note: filename kept as-is per requirements)
   - Complete calendar implementation with Month and Week views
   - Integrated MiniCalendar sidebar
   - Added view mode toggle
   - Updated task rendering to use custom colors
   - Added time slot click handler for week view

5. **`src/components/dashboard/TaskDialog.tsx`**
   - Added ColorPicker component integration
   - Added start_time and end_time datetime-local inputs
   - Updated state management for new fields
   - Updated form submission to include color and times

### Files Created

1. **`src/components/ui/color-picker.tsx`**
   - Predefined color palette component
   - Custom color picker with HTML color input
   - Visual feedback for selected color
   - Accessible with ARIA labels

2. **`src/components/calendar/WeekView.tsx`**
   - Week timeline view with hourly slots
   - Time-based task positioning
   - Current time indicator (red line)
   - Task blocks with duration-based heights
   - All-day task section in header
   - Today column highlighting

3. **`src/components/calendar/MiniCalendar.tsx`**
   - Compact month view for sidebar
   - Date selection functionality
   - Month navigation controls
   - Current day and selected day highlighting

### Key Dependencies Used

- **date-fns**: Date manipulation and formatting
  - `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`
  - `eachDayOfInterval`, `format`, `isSameMonth`, `isToday`
  - `addMonths`, `subMonths`, `parseISO`
- **Shadcn UI Components**: Dialog, Button, Input, Textarea, Label, Select, Badge, Tooltip
- **lucide-react**: Icons (ChevronLeft, ChevronRight, Plus)
- **@hello-pangea/dnd**: Available for future drag-and-drop enhancement

## Code Structure

```
Calendar Component
├── State Management
│   ├── User authentication state
│   ├── Current date state (for navigation)
│   ├── Dialog state (open/closed)
│   ├── Selected date state (for new tasks)
│   ├── Selected task state (for editing)
│   └── Show completed toggle state
│
├── Data Integration
│   ├── useTasks hook integration
│   ├── Filter tasks by current month
│   ├── Group tasks by date
│   └── Handle loading states
│
├── Calendar Grid
│   ├── Calculate calendar bounds
│   ├── Generate day cells for full weeks
│   ├── Render day cells with tasks
│   └── Handle day/task click events
│
└── Task Dialog
    ├── Create mode (when clicking day)
    ├── Edit mode (when clicking task)
    └── Form validation and submission
```

## Usage

### Accessing the Calendar

1. Navigate to `/calendar` or click "Calendar" in the sidebar
2. User must be authenticated (redirects to `/auth` if not)

### Switching View Modes

1. Click "Month" button to see monthly grid view
2. Click "Week" button to see weekly timeline view
3. View preference persists during session

### Creating a Task

**From Month View:**
1. Click on any day in the calendar
2. Fill in the task details in the dialog (color, times optional)
3. Click "Create Task" to save

**From Week View:**
1. Click on any time slot (hour cell)
2. Start time will be pre-filled with selected hour
3. Fill in remaining details and save

### Customizing Task Appearance

1. When creating or editing a task, use the color picker
2. Select from predefined colors or choose a custom color
3. Color will be applied to task borders and backgrounds
4. Color coding helps visually organize tasks by category/type

### Editing a Task

1. Click on any task card in the calendar (month or week view)
2. Modify the task details in the dialog
3. Update color, times, or other properties
4. Click "Update Task" to save changes

### Navigating the Calendar

**Month Navigation:**
- Click the left arrow (←) to go to previous month
- Click the right arrow (→) to go to next month
- Click "Today" button to jump to current month

**Mini Calendar (Sidebar):**
- Click any date to navigate to that day
- Use arrow buttons to change months
- Current day is highlighted
- Selected day has a ring indicator

### Filtering Tasks

- Click "Hide Completed" to hide completed tasks from view
- Click "Show Completed" to display all tasks
- Filter applies to both month and week views

## Performance Considerations

- Tasks are filtered by month to reduce rendering overhead
- Only 3 tasks shown per day by default to maintain clean layout
- Tooltips loaded on demand (hover)
- Calendar recalculates only when month changes

## Future Enhancements

The following features are available for future implementation:

1. **Drag and Drop**: The `@hello-pangea/dnd` package is already installed
   - Can implement drag-to-reschedule functionality
   - Update task due_date when dropped on new day
   - Resize tasks by dragging edges to adjust duration

2. **Day View**: Single day view with detailed time slots
   - Hourly breakdown with 15-minute increments
   - More space for task details

3. **Task Search**: Filter tasks by title/description

4. **Recurring Tasks**: Support for recurring task patterns

5. **Calendar Export**: Export tasks to iCal format

6. **Task Categories**: Group tasks by custom categories with color coding

7. **Multiple Calendars**: Support for different calendar types (personal, work, etc.)

8. **Keyboard Shortcuts**: 
   - Arrow keys for navigation
   - 'N' for new task
   - 'T' for today
   - 'W'/'M' for week/month view

## Testing

All tests pass successfully:
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Build process
- ✅ Unit tests
- ✅ Security checks (0 vulnerabilities)

## Conventions Followed

- Uses existing authentication pattern from other pages
- Follows same layout structure (DashboardSidebar + DashboardHeader)
- Consistent with existing task management patterns
- Uses Shadcn UI components throughout
- Follows Tailwind CSS styling conventions
- Proper TypeScript typing for all components

## Known Limitations

1. **File Naming**: The file is named `Calender.tsx` (with typo) to maintain existing routing structure
2. **Mobile View**: Uses the same responsive patterns as other pages but could be further optimized for smaller screens
3. **Timezone**: Currently uses browser's local timezone

## Support

For issues or questions about the calendar implementation, refer to:
- `src/pages/Calender.tsx` - Main calendar component
- `src/components/dashboard/TaskDialog.tsx` - Task creation/editing dialog
- `src/hooks/useTasks.ts` - Task data management
