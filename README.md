## Allumer le serveur en mode Dev
```
  cd server
  npm i
  npm run dev
```

## Tester avec curl
```
  curl -X POST http://localhost:3000/login
  curl -d '{"name": "paul", "password": "Azerty123"}' -H 'Content-Type: application/json' -X POST http://localhost:3000/login
```
