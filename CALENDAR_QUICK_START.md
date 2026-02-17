# Calendar Quick Start Guide

## Accessing the Calendar

1. Log in to your FounderFlow account
2. Click **"Calendar"** in the sidebar navigation
3. Or navigate directly to `/calendar`

## View Modes

The calendar now supports two view modes:

### Month View (Default)
- Shows full month grid with all days
- Perfect for getting a bird's eye view of your schedule
- Click **"Month"** button to switch to this view

### Week View (NEW!)
- Shows 7 days with hourly time slots (00:00 - 23:00)
- Great for detailed daily scheduling
- Shows tasks positioned at their specific start times
- Click **"Week"** button to switch to this view

## Creating a New Task

### From Month View:
1. Click on any day in the calendar
2. The task dialog will open with the selected date pre-filled
3. Enter task details and click **"Create Task"**

### From Week View:
1. Click on any time slot (hour cell)
2. The task dialog will open with the selected date and time pre-filled
3. Enter task details - the start time is automatically set
4. Click **"Create Task"** to save

### From Add Task Button:
1. Click the **"+ Add Task"** button in the top right
2. Fill in all details manually (date defaults to today)

## Task Dialog Fields

When creating or editing a task, you can set:

- **Title** (required) - What needs to be done
- **Description** (optional) - Additional details
- **Status** - Not Started (default), In Progress, or Completed
- **Priority** - Low, Medium, or High
- **Due Date** - When the task is due
- **Start Time** (NEW!) - When the task begins (optional)
- **End Time** (NEW!) - When the task ends (optional)
- **Task Color** (NEW!) - Choose from:
  - Blue (default)
  - Red
  - Orange
  - Yellow
  - Green
  - Purple
  - Pink
  - Gray
  - Or pick a custom color!

## Editing an Existing Task

1. Click on any task card in the calendar (small colored bars)
2. The task dialog will open with all fields populated
3. Make your changes
4. Click **"Update Task"** to save

## Viewing Task Details

- **Hover** over any task card to see full details in a tooltip:
  - Complete title
  - Description
  - Current status
  - Priority level

## Navigating the Calendar

### Change Months:
- Click **←** (left arrow) to go to previous month
- Click **→** (right arrow) to go to next month

### Return to Today:
- Click the **"Today"** button to jump to current date

### Mini Calendar (NEW!):
- **Sidebar navigation** (on desktop) shows a compact month view
- Click any date to jump to that day
- Use mini calendar arrows to browse months
- Current day is highlighted
- Selected day has a ring indicator

## Understanding the Calendar

### Visual Indicators:

**Month View:**
- **Current Day**: Highlighted with a colored ring
- **Days with Tasks**: Show a badge with task count
- **Task Colors**: Each task displays in its custom color (not just priority)
- **Task Blocks**: Semi-transparent background with solid colored border
- **Completed Tasks**: Shown with strikethrough text and muted appearance
- **Adjacent Month Days**: Grayed out for context

**Week View:**
- **Current Time Indicator**: Red horizontal line showing current time (like Apple Calendar)
- **Today's Column**: Subtle background highlighting today
- **Hour Lines**: Light gray horizontal lines for each hour
- **Task Blocks**: 
  - Positioned at their start time
  - Height represents duration
  - Custom color background and border
  - Shows task title and time
- **All-day Tasks**: Shown in the header section (tasks without specific times)

### Task Display:
- **Month View**: Each day shows up to **3 tasks** with "+X more" if needed
- **Week View**: Tasks positioned at their actual time slots
- **Hover**: All task cards show full details in tooltips

## Managing Task Visibility

### Show/Hide Completed Tasks:
- Click **"Hide Completed"** to filter out completed tasks
- Click **"Show Completed"** to display all tasks
- Filter applies to both Month and Week views
- This only affects the calendar view, not your actual tasks

## Tips for Best Use

1. **Color Code by Category**: Use different colors for work, personal, meetings, etc.
2. **Set Start/End Times**: Use time fields for precise scheduling in Week view
3. **Use Week View for Detailed Planning**: Perfect for daily time blocking
4. **Use Month View for Overview**: Great for seeing your entire month at a glance
5. **Mini Calendar Navigation**: Quick way to jump to any date
6. **Plan Ahead**: Click future dates to schedule upcoming work
7. **Update Status**: Move tasks through Not Started → In Progress → Completed
8. **Use Descriptions**: Add context to tasks so you remember details later

## Advanced Features

### Time-based Scheduling (Week View)
- Click on specific hour slots to create tasks at exact times
- Tasks with start/end times appear as blocks showing duration
- Current time indicator helps you see "now" at a glance
- All-day tasks (without times) appear in the header

### Color Customization
- Choose colors that make sense for your workflow
- Example color coding:
  - Red: Urgent/Important
  - Green: Health/Exercise
  - Blue: Regular work tasks
  - Purple: Meetings
  - Orange: Personal projects
  - Yellow: Learning/Development

## Keyboard Shortcuts (Future)

While not yet implemented, these shortcuts are planned:
- `N` - New task
- `T` - Go to today
- `←` `→` - Navigate months
- `Esc` - Close dialog

## Troubleshooting

**Can't see the calendar?**
- Make sure you're logged in
- Check that you're at `/calendar` URL
- Try refreshing the page

**Tasks not showing?**
- Verify tasks have due dates set
- Check if "Hide Completed" is filtering them out
- Ensure you're viewing the correct month

**Can't create tasks?**
- Make sure you're logged in with valid credentials
- Check your internet connection
- Verify title field is filled (required)

## Related Features

- **Tasks Page** (`/tasks`): Kanban view of all tasks
- **Analytics** (`/analytics`): Task completion metrics
- **Dashboard** (`/dashboard`): Today's focus tasks

---

**Need Help?** Refer to `CALENDAR_IMPLEMENTATION.md` for technical details.
