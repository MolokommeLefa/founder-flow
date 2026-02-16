# Calendar Quick Start Guide

## Accessing the Calendar

1. Log in to your FounderFlow account
2. Click **"Calendar"** in the sidebar navigation
3. Or navigate directly to `/calendar`

## Creating a New Task

### From Calendar View:
1. Click on any day in the calendar
2. The task dialog will open with the selected date pre-filled
3. Enter:
   - **Title** (required) - What needs to be done
   - **Description** (optional) - Additional details
   - **Status** - Not Started (default), In Progress, or Completed
   - **Priority** - Low (blue), Medium (yellow), or High (red)
   - **Due Date** - Pre-filled with clicked day, can be changed
4. Click **"Create Task"** to save

### From Add Task Button:
1. Click the **"+ Add Task"** button in the top right
2. Follow the same steps as above (date defaults to today)

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
- Click the **"Today"** button to jump to current month

## Managing Task Visibility

### Show/Hide Completed Tasks:
- Click **"Hide Completed"** to filter out completed tasks
- Click **"Show Completed"** to display all tasks
- This only affects the calendar view, not your actual tasks

## Understanding the Calendar

### Visual Indicators:

- **Current Day**: Highlighted with a colored ring
- **Days with Tasks**: Show a badge with task count
- **Task Priority Colors**:
  - 🔴 Red left border = High priority
  - 🟡 Yellow left border = Medium priority
  - 🔵 Blue left border = Low priority
- **Completed Tasks**: Shown with strikethrough text and muted appearance
- **Adjacent Month Days**: Grayed out for context

### Task Display:
- Each day shows up to **3 tasks**
- If more tasks exist, you'll see **"+X more"** indicator
- Tasks are ordered by creation date

## Tips for Best Use

1. **Color Code Your Priorities**: Use the priority system to quickly identify urgent tasks
2. **Use Descriptions**: Add context to tasks so you remember details later
3. **Update Status**: Move tasks through Not Started → In Progress → Completed
4. **Plan Ahead**: Click future dates to schedule upcoming work
5. **Weekly Review**: Navigate through months to plan and review

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
