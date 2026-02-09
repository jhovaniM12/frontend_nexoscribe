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

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        credentials: 'include', // ✅ Importante para cookies httpOnly
        headers,
      })
    } catch (fetchError) {
      // Manejar errores de red (conexión fallida, CORS, etc.)
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : 'No se pudo conectar con el servidor'

      const error = new Error(errorMessage) as Error & {
        status?: number
        statusText?: string
        isExpected?: boolean
        isNetworkError?: boolean
      }
      error.isNetworkError = true
      error.status = 0
      error.statusText = 'Network Error'
      // Marcar como esperado para que no se muestre como error crítico
      error.isExpected = true
      throw error
    }

    if (!response.ok) {
      let errorMessage = `Error: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Si JSON parsing falla, usar mensaje por defecto
      }

      // Crear error con más información
      const error = new Error(errorMessage) as Error & {
        status?: number
        statusText?: string
        isExpected?: boolean
      }
      error.status = response.status
      error.statusText = response.statusText
      error.isExpected = response.status === 404 // Marcar errores 404 como esperados
      throw error
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

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
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

  async upload<T>(endpoint: string, file: File, fieldName: string = 'file', additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${API_URL}${endpoint}`
    const currentOrgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null;

    const headers: Record<string, string> = {};

    if (currentOrgId) {
      headers['x-org-id'] = currentOrgId;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Error: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch { }
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
  members?: { _id: string; role: string; user: any }[]
}

// API de organizaciones
export const organizationApi = {
  getUserOrganizations: () =>
    api.get<{ organizations: Organization[] }>('/api/organization/user-organizations'),

  create: (data: { name: string, type?: 'personal' | 'business' }) =>
    api.post<{ message: string; organization: Organization }>('/api/organization/create', data),

  inviteMember: (organizationId: string, data: { email: string, role?: 'admin' | 'editor' | 'viewer' }) =>
    api.post<{ message: string; invitation: { _id: string; email: string; role: string; token: string; status: string } }>(`/api/organization/${organizationId}/invite`, data),

  acceptInvitation: (token: string) =>
    api.get<{ message: string; organizationId: string; organizationName: string }>(`/api/organization/invite/accept/${token}`),

  getMembers: (organizationId: string) =>
    api.get<{
      members: Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>;
      owner: { _id: string; name: string; email: string; avatar?: string } | null;
      pendingInvitations: Array<{ _id: string; email: string; role: string; invitedBy: { _id: string; name: string } }>
    }>(`/api/organization/${organizationId}/members`),
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
  accountType: 'individual' | 'business'
  companyName?: string
}

export interface LoginResponse {
  message: string
  user: {
    _id: string
    name: string
    email: string
    role: string
    systemRole?: string
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
  // Public sharing fields
  isPublic?: boolean
  publicToken?: string | null
  publicExpiresAt?: string | null
  allowComments?: boolean
  // Organization fields
  isPinned?: boolean
  isArchived?: boolean
}

export interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
  folderId?: string | null
}

export interface ShareNoteResponse {
  message: string
  publicToken: string
  publicUrl: string
  expiresAt: string
  allowComments: boolean
}

export interface PublicComment {
  _id: string
  noteId: string
  authorName: string
  authorEmail?: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PublicNote {
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  allowComments: boolean
}

// API de notas
export const notesApi = {
  getAll: (options?: { folderId?: string | null; archived?: boolean; pinned?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.folderId !== undefined) {
      params.set('folderId', options.folderId === null ? 'null' : options.folderId);
    }
    if (options?.archived) {
      params.set('archived', 'true');
    }
    if (options?.pinned) {
      params.set('pinned', 'true');
    }
    const queryString = params.toString();
    return api.get<{ notes: Note[] }>(`/api/note/user-notes${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) =>
    api.get<{ note: Note }>(`/api/note/detail-note/${id}`),

  create: (data: CreateNoteRequest) =>
    api.post<{ message: string; note: Note }>('/api/note/create-note', data),

  update: (id: string, data: Partial<CreateNoteRequest>) =>
    api.patch<{ message: string; note: Note }>(`/api/note/edit-note/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/note/delete-note/${id}`),

  // Public sharing
  share: (id: string, data: { duration: '1h' | '24h' | '7d' | '30d'; allowComments?: boolean }) =>
    api.post<ShareNoteResponse>(`/api/note/share/${id}`, data),

  unshare: (id: string) =>
    api.post<{ message: string; note: Note }>(`/api/note/unshare/${id}`, {}),

  // Pin and Archive
  togglePin: (id: string) =>
    api.post<{ message: string; note: Note; isPinned: boolean }>(`/api/note/pin/${id}`, {}),

  toggleArchive: (id: string) =>
    api.post<{ message: string; note: Note; isArchived: boolean }>(`/api/note/archive/${id}`, {}),
}

// API para notas públicas (sin autenticación)
export const publicApi = {
  getNote: async (token: string): Promise<{ message: string; note: PublicNote; comments: PublicComment[] }> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100'}/api/public/note/${token}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener la nota');
    }
    return response.json();
  },

  addComment: async (token: string, data: { authorName: string; authorEmail?: string; content: string }): Promise<{ message: string; comment: PublicComment }> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100'}/api/public/note/${token}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al agregar comentario');
    }
    return response.json();
  },
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
  sections?: {
    _id: string
    name: string
    order: number
    limit?: number
  }[]
}

export interface CreateProjectRequest {
  name: string
  description?: string
  status?: 'active' | 'archived' | 'completed'
}

// Tipos de Admin
export interface AdminUser {
  _id: string
  name: string
  email: string
  systemRole: string
  isActive: boolean
  createdAt: string
  avatar?: string
}

export interface AdminOrganization {
  _id: string
  name: string
  type: string
  members: Array<{ userId: string | { name: string, email: string }; role: string }>
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

// API de Admin
export const adminApi = {
  getGlobalStats: () =>
    api.get<{ stats: { totalUsers: number; totalOrganizations: number; totalNotes: number; totalProjects: number; userGrowth: number; orgGrowth: number } }>('/api/admin/stats'),

  getAllOrganizations: (page = 1, limit = 10) =>
    api.get<{ organizations: AdminOrganization[], total: number, pages: number }>
      (`/api/admin/organizations?page=${page}&limit=${limit}`),

  getOrganizationDetail: (id: string) =>
    api.get<{ organization: AdminOrganization, stats: { totalMembers: number; totalTasks: number; totalProjects: number; totalNotes: number } }>(`/api/admin/organizations/${id}`),

  getAllUsers: (page = 1, limit = 10) =>
    api.get<{ users: AdminUser[], total: number, pages: number }>
      (`/api/admin/users?page=${page}&limit=${limit}`),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.request<{ message: string, user: AdminUser }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    }),

  deleteUser: (id: string) =>
    api.delete<{ message: string }>(`/api/admin/users/${id}`),
}
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

  // Sections
  addSection: (projectId: string, data: { name: string; limit?: number }) =>
    api.post<{ project: Project }>(`/api/project/${projectId}/sections`, data),

  updateSection: (projectId: string, sectionId: string, data: { name?: string; limit?: number }) =>
    api.patch<{ project: Project }>(`/api/project/${projectId}/sections/${sectionId}`, data),

  deleteSection: (projectId: string, sectionId: string) =>
    api.delete<{ project: Project }>(`/api/project/${projectId}/sections/${sectionId}`),

  reorderSections: (projectId: string, sections: { _id: string; name: string; order: number; limit?: number }[]) =>
    api.put<{ project: Project }>(`/api/project/${projectId}/sections/reorder`, { sections }),
}

// Tipos de Tareas
export interface Attachment {
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  projectId?: string | { _id: string; name: string }
  sectionId?: string
  organizationId: string
  assignedTo?: {
    _id: string
    name: string
    avatar?: string
  } | null
  createdBy: string
  status: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  estimatedTime?: number // Minutos
  position: number
  isOverdue?: boolean
  overdueAt?: string
  attachments?: Attachment[]
  tags?: string[]
  commentsCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  projectId?: string
  sectionId?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  estimatedTime?: number
  assignedTo?: string
  attachments?: Attachment[]
  tags?: string[]
}

// API de Tareas
export const tasksApi = {
  getAll: (projectId?: string, assignedTo?: string, search?: string) => {
    const params = new URLSearchParams()
    if (projectId) params.append('projectId', projectId)
    if (assignedTo) params.append('assignedTo', assignedTo)
    if (search) params.append('search', search)
    const queryString = params.toString()
    return api.get<{ tasks: Task[] }>(`/api/task/org-tasks${queryString ? `?${queryString}` : ''}`);
  },

  create: (data: CreateTaskRequest) =>
    api.post<{ message: string; task: Task }>('/api/task/create-task', data),

  update: (id: string, data: Partial<CreateTaskRequest>) =>
    api.patch<{ message: string; task: Task }>(`/api/task/edit-task/${id}`, data),

  move: (id: string, status: string | undefined, position: number, sectionId?: string, projectId?: string) =>
    api.patch<{ message: string; task: Task }>(`/api/task/move-task/${id}`, { status, position, sectionId, projectId }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/task/delete-task/${id}`),
}

// Tipos de Comentarios
export interface Comment {
  _id: string
  taskId: string
  userId: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  content: string
  editedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  content: string
}

// API de Comentarios
export const commentsApi = {
  getAll: (taskId: string) =>
    api.get<{ comments: Comment[] }>(`/api/task/${taskId}/comments`),

  create: (taskId: string, data: CreateCommentRequest) =>
    api.post<{ message: string; comment: Comment }>(`/api/task/${taskId}/comments`, data),

  update: (taskId: string, commentId: string, data: CreateCommentRequest) =>
    api.patch<{ message: string; comment: Comment }>(`/api/task/${taskId}/comments/${commentId}`, data),

  delete: (taskId: string, commentId: string) =>
    api.delete<{ message: string }>(`/api/task/${taskId}/comments/${commentId}`),
}
// API de Archivos
export const uploadApi = {
  uploadAvatar: (file: File) =>
    api.upload<{ message: string; url: string }>('/api/upload/avatar', file),

  uploadFile: (file: File, folder: string = 'general') =>
    api.upload<{ message: string; url: string; filename: string; mimetype: string }>('/api/upload/file', file, 'file', { folder }),

  getProxyUrl: (url: string) => `${API_URL}/api/proxy/image?url=${encodeURIComponent(url)}`
}

// Tipos de Pizarra
export interface WhiteboardContent {
  version: string
  objects: unknown[]
  [key: string]: unknown
}

export interface Whiteboard {
  _id: string
  title: string
  thumbnail?: string
  content: WhiteboardContent | null
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    name: string
    avatar?: string
  }
}

// API de Pizarras (Whiteboards)
export const whiteboardApi = {
  getAll: () =>
    api.get<{ whiteboards: Whiteboard[] }>('/api/whiteboard'),

  create: (title: string) =>
    api.post<{ message: string; whiteboard: Whiteboard }>('/api/whiteboard', { title }),

  getById: (id: string) =>
    api.get<{ whiteboard: Whiteboard }>(`/api/whiteboard/${id}`),

  update: (id: string, data: { title?: string, content?: WhiteboardContent, thumbnail?: string }) =>
    api.request<{ message: string; whiteboard: Whiteboard }>(`/api/whiteboard/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/whiteboard/${id}`)
}
