# SSL Certificates Directory

Place your SSL certificates here for production HTTPS:

- `server.crt` — SSL certificate
- `server.key` — SSL private key

For local development/testing, you can generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/CN=localhost"
```
