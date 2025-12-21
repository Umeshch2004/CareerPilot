import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { generateWeeklyTasks } from '../services/geminiService';
import { useUser } from './UserContext';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  generateNewTasks: (focusArea: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user.email) {
        setTasks([]);
        return;
    }
    setLoading(true);
    try {
        const data = await api.tasks.getAll(user.email);
        setTasks(data);
        setError(null);
    } catch (err) {
        console.error("Failed to fetch tasks", err);
        setError("Failed to load tasks");
    } finally {
        setLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTaskStatus = async (taskId: string) => {
      // Optimistic update
      const updated = tasks.map(t => 
          t.id === taskId ? { ...t, status: (t.status === 'Done' ? 'Todo' : 'Done') as Task['status'] } : t
      );
      setTasks(updated);
      
      // Persist
      try {
        await api.tasks.saveBatch(updated, user.email);
      } catch (e) {
        console.error("Failed to save task status", e);
        // Revert on error could be implemented here
      }
  };

  const generateNewTasks = async (focusArea: string) => {
      setLoading(true);
      try {
          const current = user.role || "Professional";
          const target = user.targetRole || "Senior Level";
          const generated = await generateWeeklyTasks(current, target, focusArea);
          const sanitized = generated.map(t => ({...t, status: 'Todo' as const}));
          
          setTasks(sanitized);
          await api.tasks.saveBatch(sanitized, user.email);
          setError(null);
      } catch (err) {
          setError("Failed to generate tasks");
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, error, toggleTaskStatus, generateNewTasks, refreshTasks: fetchTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};