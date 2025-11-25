const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100'

export const api = {
  // Función base para hacer requests
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`
    
    // Obtener la organización actual del localStorage
    const currentOrgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Inyectar x-org-id si existe
    if (currentOrgId) {
      headers['x-org-id'] = currentOrgId;
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // ✅ Importante para cookies httpOnly
      headers,
    })

    if (!response.ok) {
      let errorMessage = `Error: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Si JSON parsing falla, usar mensaje por defecto
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  },

  // Métodos específicos
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  },

  // Método específico para subir archivos (FormData)
  async upload<T>(endpoint: string, file: File, fieldName: string = 'file', additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Usamos fetch directamente para evitar que request() sobrescriba el Content-Type
    const url = `${API_URL}${endpoint}`
    const currentOrgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null;
    
    const headers: Record<string, string> = {};
    // Si usamos la función base, necesitamos una forma de NO poner Content-Type: application/json
    // Por ahora, replico la logica básica:
    
    if (typeof window !== 'undefined') {
       // Obtener token si es necesario (si lo manejas en headers, pero veo que usas cookies)
    }
    
    if (currentOrgId) {
      headers['x-org-id'] = currentOrgId;
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers, // NO incluir Content-Type, el navegador lo pone con el boundary correcto
    });

    if (!response.ok) {
        let errorMessage = `Error: ${response.statusText}`
        try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
        } catch {}
        throw new Error(errorMessage)
    }

    return response.json();
  },
}


// Tipos de Organizaciones
export interface Organization {
  _id: string
  name: string
  slug: string
  type: 'personal' | 'business'
  logo?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  isOwner: boolean
}

// API de organizaciones
export const organizationApi = {
  getUserOrganizations: () => 
    api.get<{ organizations: Organization[] }>('/api/organization/user-organizations'),
}

// Tipos de autenticación
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: {
    _id: string
    name: string
    email: string
    role: string
    isActive: boolean
    avatar?: string
  }
}

// API de autenticación
export const authApi = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/api/login', data),
  logout: () => 
    api.post<{ message: string }>('/api/logout'),
  getMe: () => 
    api.get<{ user: LoginResponse['user'] }>('/api/me'),
  register: (data: RegisterRequest) => 
    api.post<{ message: string; user: unknown }>('/api/register', data),
  
  verifyEmail: (email: string) => 
    api.post<{ message: string }>('/api/verify-email', { email }),
  
  verifyResetToken: (token: string) => 
    api.get<{ message: string }>(`/api/verify-resetToken/${token}`),
  
  changePassword: (token: string, newPassword: string) => 
    api.post<{ message: string }>('/api/changed-password', { token, newPassword }),
}

// Tipos para Dashboard
export interface DashboardStatsResponse {
  stats: {
    activeProjects: number
    pendingTasks: number
    createdNotes: number
  }
  recentProjects: {
    _id: string
    name: string
    progress: number
    tasksTotal: number
    tasksCompleted: number
  }[]
  upcomingTasks: Task[]
}

// API de Dashboard
export const dashboardApi = {
  getStats: () => 
    api.get<DashboardStatsResponse>('/api/dashboard/stats'),
}

// Tipos de notas
export interface Note {
  _id: string
  title: string
  content: string
  tags: string[]
  folderId?: string | { _id: string; name: string } | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
  folderId?: string | null
}

// API de notas
export const notesApi = {
  getAll: (folderId?: string | null) => {
    const params = folderId !== undefined ? `?folderId=${folderId === null ? 'null' : folderId}` : '';
    return api.get<{ notes: Note[] }>(`/api/note/user-notes${params}`);
  },
  
  getById: (id: string) => 
    api.get<{ note: Note }>(`/api/note/detail-note/${id}`),
  
  create: (data: CreateNoteRequest) => 
    api.post<{ message: string; note: Note }>('/api/note/create-note', data),
  
  update: (id: string, data: Partial<CreateNoteRequest>) => 
    api.patch<{ message: string; note: Note }>(`/api/note/edit-note/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ message: string }>(`/api/note/delete-note/${id}`),
}

// Tipos de carpetas
export interface Folder {
  _id: string
  name: string
  color?: string
  userId: string
  parentId?: string | null
  noteCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateFolderRequest {
  name: string
  color?: string
  parentId?: string | null
}

// API de carpetas
export const foldersApi = {
  getAll: () => 
    api.get<{ folders: Folder[] }>('/api/folder/user-folders'),
  
  getById: (id: string) => 
    api.get<{ folder: Folder }>(`/api/folder/detail-folder/${id}`),
  
  create: (data: CreateFolderRequest) => 
    api.post<{ message: string; folder: Folder }>('/api/folder/create-folder', data),
  
  update: (id: string, data: Partial<CreateFolderRequest>) => 
    api.patch<{ message: string; folder: Folder }>(`/api/folder/edit-folder/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ message: string; deletedNotesCount?: number }>(`/api/folder/delete-folder/${id}`),
}

// Tipos de Proyectos
export interface Project {
  _id: string
  name: string
  description?: string
  organizationId: string
  createdBy: string
  status: 'active' | 'archived' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  status?: 'active' | 'archived' | 'completed'
}

// API de Proyectos
export const projectsApi = {
  getAll: () => 
    api.get<{ projects: Project[] }>('/api/project/org-projects'),
  
  getById: (id: string) => 
    api.get<{ project: Project }>(`/api/project/detail-project/${id}`),
  
  create: (data: CreateProjectRequest) => 
    api.post<{ message: string; project: Project }>('/api/project/create-project', data),
  
  update: (id: string, data: Partial<CreateProjectRequest>) => 
    api.patch<{ message: string; project: Project }>(`/api/project/edit-project/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ message: string }>(`/api/project/delete-project/${id}`),
}

// Tipos de Tareas
export interface Task {
  _id: string
  title: string
  description?: string
  projectId?: string | { _id: string; name: string }
  organizationId: string
  assignedTo?: {
    _id: string
    name: string
    avatar?: string
  } | null
  createdBy: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  projectId?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  assignedTo?: string
}

// API de Tareas
export const tasksApi = {
  getAll: (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return api.get<{ tasks: Task[] }>(`/api/task/org-tasks${params}`);
  },
  
  create: (data: CreateTaskRequest) => 
    api.post<{ message: string; task: Task }>('/api/task/create-task', data),
  
  update: (id: string, data: Partial<CreateTaskRequest>) => 
    api.patch<{ message: string; task: Task }>(`/api/task/edit-task/${id}`, data),
  
  move: (id: string, status: string, position: number) => 
    api.patch<{ message: string; task: Task }>(`/api/task/move-task/${id}`, { status, position }),
  
  delete: (id: string) => 
    api.delete<{ message: string }>(`/api/task/delete-task/${id}`),
}

// API de Archivos
export const uploadApi = {
  uploadAvatar: (file: File) => 
    api.upload<{ message: string; url: string }>('/api/upload/avatar', file),
  
  uploadFile: (file: File, folder: string = 'general') => 
    api.upload<{ message: string; url: string; filename: string; mimetype: string }>('/api/upload/file', file, 'file', { folder }),
}