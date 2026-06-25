# Open Source Environment Variables

This repository does not store real local credentials, cloud keys, tokens, or database passwords in source code.

Configure local secrets with environment variables or JVM system properties before starting services.

## Backend Database

| Variable | Purpose | Example |
| --- | --- | --- |
| `IHRM_MYSQL_URL` | Main `ihrm` JDBC URL | `jdbc:mysql://127.0.0.1:3306/ihrm?useUnicode=true&characterEncoding=utf8&useSSL=false` |
| `IHRM_MYSQL_USERNAME` | Main MySQL username | `root` |
| `IHRM_MYSQL_PASSWORD` | Main MySQL password | leave empty or set locally |
| `IHRM_ACTIVITI_MYSQL_URL` | Activiti `act` JDBC URL | `jdbc:mysql://127.0.0.1:3306/act?useUnicode=true&characterEncoding=utf8&serverTimezone=GMT&useSSL=false` |
| `IHRM_ACTIVITI_MYSQL_USERNAME` | Activiti MySQL username | defaults to `IHRM_MYSQL_USERNAME` |
| `IHRM_ACTIVITI_MYSQL_PASSWORD` | Activiti MySQL password | defaults to `IHRM_MYSQL_PASSWORD` |

## Redis

| Variable | Purpose | Example |
| --- | --- | --- |
| `IHRM_REDIS_HOST` | Redis host | `127.0.0.1` |
| `IHRM_REDIS_PORT` | Redis port | `6379` or local dev `6380` |

## Qiniu Upload

| Variable | Purpose |
| --- | --- |
| `IHRM_QINIU_ACCESS_KEY` | Qiniu access key |
| `IHRM_QINIU_SECRET_KEY` | Qiniu secret key |
| `IHRM_QINIU_BUCKET` | Qiniu bucket |
| `IHRM_QINIU_DOMAIN` | Public object domain |

If Qiniu credentials are not configured, upload calls fail explicitly instead of using hard-coded keys.

## Demo Credentials

| Variable | Purpose |
| --- | --- |
| `IHRM_DEFAULT_USER_PASSWORD` | Default initial password for newly created/imported users |
| `PHASE1_LOGIN_MOBILE` | Optional local smoke-test login account |
| `PHASE1_LOGIN_PASSWORD` | Optional local smoke-test login password |
| `IHRM_DEMO_MOBILE` | Optional local demo mobile for manual hash utility |
| `IHRM_DEMO_PASSWORD` | Optional local demo password for manual hash utility |
| `IHRM_JWT_DEMO_KEY` | Optional local JWT demo signing key |
| `IHRM_JWT_DEMO_TOKEN` | Optional local JWT demo token |
| `VITE_USE_DEMO_LOGIN` | Optional Vue3 local demo-login toggle |
| `VITE_DEMO_MOBILE` | Optional Vue3 local demo mobile |
| `VITE_DEMO_PASSWORD` | Optional Vue3 local demo password |

Do not commit real `.env`, `.env.*`, local logs, build outputs, `node_modules`, or database volumes.
