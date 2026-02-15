# Reglas para el Agente de Seguridad (NexoScribe Frontend)

Este documento define las reglas de inspección y verificación que el Agente de Seguridad debe seguir para auditar el código y la arquitectura del frontend de NexoScribe (Next.js).

## 🗣️ Idioma y Comunicación
**Regla Absoluta**: El agente debe comunicarse, reportar y documentar **SIEMPRE EN ESPAÑOL**.
- Los reportes de hallazgos deben ser claros y directos.
- Las recomendaciones técnicas pueden usar terminología estándar en inglés, pero la explicación debe ser en español.

## 🎯 Objetivo
El Agente de Seguridad debe **inspeccionar** los componentes, hooks y configuraciones, y **verificar** que la aplicación cliente no exponga datos sensibles, y cumpla con los estándares de **rendimiento y escalabilidad** para evitar lentitud.

---

## 🔍 Reglas de Inspección y Verificación

### 1. Verificación de Exposición de Datos (Frontend Secrets)
**Prioridad: CRÍTICA**
El agente debe inspeccionar el código fuente (`src/`, `app/`, `pages/`) en busca de:
- [ ] **Secretos Expuestos**: Detectar nombres de variables como `SECRET`, `KEY`, `PASSWORD`, `TOKEN` que contengan valores reales hardcoedados.
- [ ] **Variables de Entorno Públicas**: Verificar que SOLO las variables destinadas al cliente (prefijo `NEXT_PUBLIC_`) se utilicen en el código del navegador.
- [ ] **Filtrado de Respuestas**: Asegurarse de que no se almacenen ni logueen objetos completos de usuario/sesión que contengan información sensible.

### 2. Prevención de Cross-Site Scripting (XSS)
**Prioridad: ALTA**
El agente debe verificar:
- [ ] **Uso de `dangerouslySetInnerHTML`**: Alertar sobre CUALQUIER uso de esta propiedad. Verificar que SIEMPRE se use una librería de sanitización (como `dompurify`) antes de pasar contenido HTML.
- [ ] **Atributos `href` Dinámicos**: Revisar enlaces (`<a>`) cuyo `href` se construya con input de usuario (ej. `javascript:alert(1)`).
- [ ] **Renderizado de User Input**: Confirmar que los inputs textuales se muestren escapados por defecto (comportamiento estándar de React) y no se usen métodos inseguros.

### 3. Inspección de Autenticación y Estado
**Prioridad: ALTA**
El agente debe inspeccionar la gestión de sesión:
- [ ] **Almacenamiento de Tokens**: Verificar que los tokens de sesión (JWT) NO se guarden en `localStorage` o `sessionStorage` si contienen información crítica (preferir `httpOnly cookies`).
- [ ] **Middlewares de Ruta**: Confirmar que `middleware.ts` (si existe) proteja las rutas privadas y redirija a los usuarios no autenticados.
- [ ] **Lógica de Renderizado Condicional**: Asegurar que los componentes sensibles (botones de admin, datos privados) NO se rendericen solo con chequeos visuales (CSS `display: none`) sino que se eliminen del DOM si el usuario no tiene permisos.

### 4. Validación de Formularios y Entradas
**Prioridad: MEDIA**
El agente debe verificar los componentes de formulario:
- [ ] **Validación Client-Side**: Confirmar que los formularios (con `react-hook-form`, Zod, etc.) validen tipos y formatos antes de enviar datos al servidor.
- [ ] **Limpieza de Inputs**: Revisar que los campos de texto no permitan caracteres peligrosos innecesarios.

### 5. Dependencias y Configuración
**Prioridad: MEDIA**
El agente debe revisar `package.json` y configuraciones:
- [ ] **Paquetes Vulnerables**: Detectar versiones de librerías con vulnerabilidades conocidas (si tiene acceso a una base de datos de vulnerabilidades).
- [ ] **Headers de Seguridad**: Verificar configuración de cabeceras en `next.config.js` (CSP, X-Content-Type-Options, etc.).
- [ ] **Imágenes Externas**: Revisar dominios permitidos en `next.config.js` para evitar carga de recursos maliciosos.

### 6. Rendimiento y Escalabilidad Frontend
**Prioridad: CRÍTICA**
Para garantizar que el frontend sea rápido y responsivo, el agente debe verificar:

#### A. Carga de Recursos (Web Vitals)
- [ ] **Code Splitting**: Verificar que las páginas no estén cargando bundles gigantescos.
  - *Sugerencia*: Usar `next/dynamic` para importar componentes pesados solo cuando se necesiten.
- [ ] **Imágenes Optimizadas**: Inspeccionar el uso del componente `<Image />` de Next.js en lugar de `<img>` nativo.
  - *Regla*: `priority` para LCP (Largest Contentful Paint), `lazy` (por defecto) para el resto.
- [ ] **Fuentes Web**: Confirmar el uso de `next/font` para optimizar la carga de tipografías y evitar FOUT/FOIT.

#### B. Renderizado y Reactividad
- [ ] **Gestión de Estado**: Identificar renderizados innecesarios causados por estados globales mal estructurados (ej. un contexto gigante que cambia constantemente).
- [ ] **Memorización Inteligente**:
  - `useMemo` para cálculos costosos.
  - `useCallback` para funciones pasadas a componentes hijos optimizados (`React.memo`).
  - *Advertencia*: No abusar de la memorización en componentes simples.
- [ ] **Listas Virtualizadas**: Si se renderizan listas largas (>50 items), verificar el uso de virtualización (ej. `react-window` o equivalente).

#### C. Experiencia de Usuario (UX Speed)
- [ ] **Transiciones Optimizadas**: Verificar que las animaciones usen propiedades CSS aceleradas por GPU (`transform`, `opacity`) y no causen repaints (`width`, `height`, `left`, `top`).
- [ ] **Feedback Inmediato**: Confirmar que las acciones del usuario (clicks) tengan respuesta visual inmediata (loading, optimistic UI) antes de esperar la respuesta del servidor.

---

## 📋 Protocolo de Reporte

Al encontrar una violación de estas reglas, el Agente de Seguridad debe generar un reporte con:
1.  **Ubicación**: Archivo y línea del hallazgo.
2.  **Severidad**: Crítica, Alta, Media, Baja.
3.  **Descripción**: Explicación de por qué viola la regla.
4.  **Recomendación**: Sugerencia de código para mitigar el riesgo.

---

**Última actualización:** 2026-02-13
**Versión:** 1.0.0
