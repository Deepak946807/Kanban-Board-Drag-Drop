# Kanban Board — Drag & Drop

A simple, clean Kanban-style task board built with vanilla HTML, CSS and JavaScript. Organize your tasks across **To Do**, **In Progress**, and **Done** columns using smooth drag-and-drop.

## Features

- Drag and drop tasks between columns to update their status
- Add new tasks directly to any column
- Edit or delete existing tasks
- Clean, responsive card-based UI
- No frameworks or build tools required — pure HTML/CSS/JS

## File Structure
kanban-board/
├── index.html      → Page structure and layout
├── style.css        → Styling, columns, card design and animations
├── script.js         → Drag-and-drop logic, task creation/editing/deletion
└── README.md          → This file

## How to Run

1. Download or clone this repository.
2. Open `index.html` directly in any browser (double-click it), or use the VS Code "Live Server" extension for auto-reload.

No installation, build step, or dependencies needed — it runs directly in the browser.

## How It Works

- Each task is rendered as a draggable card inside its column.
- The HTML5 Drag and Drop API (`dragstart`, `dragover`, `drop` events) handles moving cards between columns.
- When a card is dropped into a new column, its status updates accordingly in the DOM.

## Possible Next Steps

- Persist tasks using `localStorage` so the board survives a page refresh
- Add due dates and priority labels to task cards
- Add multi-board support for organizing different projects separately
