# Backend – Semillero Classroom Notifier

## ¿Qué hace este backend?
- **Autenticación con Google** (OAuth) para docentes.
- **Sincroniza cursos y tareas** desde Google Classroom.
- **Gestiona alumnos** (guarda email alternativo y teléfono en MongoDB).
- **Mensajería a alumnos**:
  - Email (Nodemailer) a correo alternativo.
  - SMS (Twilio) a teléfonos guardados.
- **Notificador automático (scheduler)**:
  - Detecta tareas nuevas en Classroom y envía avisos por email alternativo y SMS.
  - Evita duplicados registrando las tareas ya notificadas.

## Variables de entorno (.env)
Crea `backend/.env` con:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MONGODB_URI=...

# Email (Gmail con contraseña de aplicación)
EMAIL_USER=...
EMAIL_PASS=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Scheduler (notificador automático)
NOTIFIER_ENABLED=true                 # "true" para activar el job en background
NOTIFIER_INTERVAL_MS=60000            # intervalo (ms). Ej: 60000 = 1 min, 600000 = 10 min
COURSES_TO_WATCH=                     # vacío = autodetecta cursos del docente
```

Notas:
- El scheduler ya no requiere access token en .env: usa el **refreshToken** de cada docente guardado al iniciar sesión con Google.
- Si usás Twilio Trial, el SMS mostrará el prefijo “Sent from your Twilio trial account - …”. Eso se quita al pasar la cuenta a pago.

## Puesta en marcha (local)
1) Instalar dependencias
```
cd backend
npm install
```
2) Iniciar el servidor
```
npm start
```
- Levanta en `http://localhost:3000`

## Scripts
- `npm start`: `node --watch src/index.js`
