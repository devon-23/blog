import { create } from 'zustand';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;
  openWindow: (opts: { appId: string; title: string; width?: number; height?: number }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
}

let cascadeCount = 0;

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,

  openWindow: ({ appId, title, width = 560, height = 420 }) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false, zIndex: state.nextZIndex } : w
        ),
        nextZIndex: state.nextZIndex + 1,
      }));
      return;
    }

    const offset = (cascadeCount % 6) * 28;
    cascadeCount += 1;

    const id = `${appId}-${Date.now()}`;
    set((state) => ({
      windows: [
        ...state.windows,
        {
          id,
          appId,
          title,
          x: 60 + offset,
          y: 50 + offset,
          width,
          height,
          zIndex: state.nextZIndex,
          minimized: false,
          maximized: false,
        },
      ],
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  closeWindow: (id) => {
    set((state) => ({ windows: state.windows.filter((w) => w.id !== id) }));
  },

  focusWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: state.nextZIndex } : w)),
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  toggleMinimize: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
    }));
  },

  toggleMaximize: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
    }));
  },

  moveWindow: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  resizeWindow: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    }));
  },
}));
