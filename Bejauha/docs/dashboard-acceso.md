# Dashboard Admin — Acceso

> Documento privado. **No compartir por canales públicos.**

## 🔗 URL para los admins

```
https://n8n.srv1398596.hstgr.cloud/webhook/bejauha-dashboard?token=bjh_NssQxwv-fbPZnSPI8fnzPmUX3Kbp1v3Ymy006w
```

Recomendar a Cami / Amanda / Estefanía que la guarden como **acceso directo en la pantalla de inicio del celular** (en iOS: compartir → "Añadir a pantalla de inicio"; en Android: 3 puntos → "Añadir a pantalla de inicio"). Así queda como un app más.

## 🛡️ Seguridad

- El token es un secreto largo (~40 chars). Sin el token, la URL devuelve "Acceso denegado".
- Si en algún momento el token se filtra (admin perdió el celular, se compartió por error), avisar para rotarlo.
- Para rotar: regenerar el token en el script y re-deployar el workflow. El token actual queda inservible.

## ♻️ Cómo actualizar los datos

El dashboard muestra datos en vivo. **Refresca el navegador** y vuelve a cargar la página → trae los datos más recientes.

## ⚙️ Detalles técnicos

- **Workflow:** `Bejauha - Dashboard Admin (WF05)` · ID `6yuuBScT8qA7QxPk`
- **Tipo:** GET webhook → 3 SQL queries (leads, clientes_paquete, handoffs) → HTML con datos embebidos
- **Tamaño de la respuesta:** ~160 KB (con la base actual de ~2.000 leads)
- **Solo lectura.** Los cambios siguen siendo por `BEJA ...` en WhatsApp.
