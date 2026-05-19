# Univoicer

## Configuración para login con Google (Firebase)

La app usa **Firebase Authentication** con proveedor de Google desde `script.js`.

### 1) Habilitar proveedor Google
1. Ve a Firebase Console → **Authentication** → **Sign-in method**.
2. Habilita **Google**.
3. Configura email de soporte del proyecto.

### 2) Autorizar dominios
En Firebase Console → Authentication → **Settings** → **Authorized domains**, agrega:
- `localhost`
- Tu dominio de despliegue (ej: `tuapp.com`)

### 3) Verificar configuración del proyecto
Confirma que `firebaseConfig` en `script.js` pertenezca al mismo proyecto donde habilitaste Google Auth.

### 4) Reglas recomendadas para Realtime Database
Si quieres que solo usuarios autenticados escriban:

```json
{
  "rules": {
    "characters": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Con esto el botón de crear personaje solo funciona con sesión iniciada y los registros se guardan con `createdBy` y `createdByName`.
