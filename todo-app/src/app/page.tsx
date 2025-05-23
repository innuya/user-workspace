'use client'

import React, { useState, useEffect, useRef } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  reminder?: string; // ISO string for datetime-local input
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newReminder, setNewReminder] = useState("");
  const [alerts, setAlerts] = useState<number[]>([]); // todo ids with active alerts
  const notifiedRef = useRef<Set<number>>(new Set()); // track notified todos to avoid repeat notifications

  // Load todos from localStorage on mount
  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  // Save todos to localStorage on change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Check reminders every minute and show notifications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const alertIds = todos
        .filter(todo => {
          if (!todo.reminder || todo.completed) return false;
          const reminderDate = new Date(todo.reminder);
          return reminderDate <= now;
        })
        .map(todo => todo.id);

      setAlerts(alertIds);

      // Show notifications for new alerts
      if ("Notification" in window && Notification.permission === "granted") {
        alertIds.forEach(id => {
          if (!notifiedRef.current.has(id)) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
              new Notification("Todo Reminder", {
                body: todo.text,
                tag: `todo-reminder-${id}`
              });
              notifiedRef.current.add(id);
            }
          }
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // every 60 seconds
    return () => clearInterval(interval);
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim() === "") return;
    const todo: Todo = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      reminder: newReminder || undefined,
    };
    setTodos([todo, ...todos]);
    setNewTodo("");
    setNewReminder("");
  };

  const toggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
    setAlerts((prev) => prev.filter(alertId => alertId !== id));
    notifiedRef.current.delete(id);
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    setAlerts((prev) => prev.filter(alertId => alertId !== id));
    notifiedRef.current.delete(id);
  };

  const updateReminder = (id: number, reminder: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, reminder } : todo
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter(alertId => alertId !== id));
    notifiedRef.current.delete(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-6 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Todo App
      </h1>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col gap-2 mb-6">
          <input
            type="text"
            aria-label="Add new todo"
            placeholder="Add a new todo"
            className="rounded border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="datetime-local"
            aria-label="Set reminder for new todo"
            className="rounded border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTodo();
            }}
          />
          <button
            onClick={addTodo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
            aria-label="Add todo"
          >
            Add
          </button>
        </div>
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {todos.length === 0 && (
            <li className="text-center text-gray-500 dark:text-gray-400">
              No todos yet. Add one above!
            </li>
          )}
          {todos.map((todo) => {
            const isAlert = alerts.includes(todo.id);
            return (
              <li
                key={todo.id}
                className={`flex flex-col gap-2 rounded px-4 py-2 transition hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  isAlert ? "bg-red-100 dark:bg-red-700" : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleComplete(todo.id)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      aria-label={`Mark todo '${todo.text}' as completed`}
                    />
                    <span
                      className={`${
                        todo.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                      } transition`}
                    >
                      {todo.text}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    aria-label={`Delete todo '${todo.text}'`}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  aria-label={`Set reminder for todo '${todo.text}'`}
                  className="rounded border border-gray-300 dark:border-gray-700 px-3 py-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={todo.reminder || ""}
                  onChange={(e) => updateReminder(todo.id, e.target.value)}
                />
                {isAlert && (
                  <div className="flex items-center justify-between bg-red-200 dark:bg-red-800 rounded px-3 py-1 mt-1 text-red-900 dark:text-red-100">
                    <span>Reminder reached!</span>
                    <button
                      onClick={() => dismissAlert(todo.id)}
                      aria-label={`Dismiss reminder alert for todo '${todo.text}'`}
                      className="font-bold hover:text-red-700 dark:hover:text-red-300"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
