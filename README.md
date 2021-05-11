# installed packages
```sh
# dependencies
* express               # REST API
* express-session       # session handling
* connect-mongo         # session Store in mongodb
* passport              # user-authentification
 + passport-local       # local auth
* cors                  # CORS settings in express
* socket.io             # WebSocket connections
* rxjs                  # reactivity
* swagger-ui-express    # swagger
 + swagger-jsdoc        # creating doc for swagger
* sendgrid              # for sending emails
* mongodb               # Database
* class-validator       # for DTO's
* class-transformer     # transform plain json into real objects
 + reflect-metadata     # dep of class-transformer

#dev-dependencies
* @types/express
* @types/express-session
* @types/mongodb
- @types/mongoose       # just a fix for 'connect-mongo' requireing this in type definitions
* @types/node
* @types/passport
* @types/socket.io
* @types/swagger-ui-express
```

# project structure (WIP)

```sh
- root
 - src                      # all source files
  - app                     # application files
   - models                 # all application objects
    - *model                # subfolder for each model
     +*model.ts             # object class definition
     +*model.collection.ts  # mongodb-collection handler
     +*model.rest.ts        # REST handles
     +*model.io.ts          # Socket.IO handles
  - util                    # helper / utility files & classes
   - enums                  # all enums
   - interfaces             # all interfaces
```

# .env contents (without secrets)

```ini
MONGODB_URI=
MONGODB_DB=app
MONGO_APPNAME=APP

SENDGRID=
MAIL_FROM=no-reply@app.com
MAIL_SUBJECT_VERIFICATION=Welcome, please verify!
MAIL_SUBJECT_WELCOME=Welcome Fighter
MAIL_SUBJECT_BETA=New User Registration for Beta Access

OID_REALM=http://localhost:8090/
OID_STEAM_REDIRECT=http://localhost:8090/auth/steam/return
OID_STEAM_KEY=
OID_STEAM_RETURN=http://localhost:8080/

COOKIE_DOMAIN=localhost

LOGLEVEL=0
LOGCOLOR=true
```

# Docker
## Local development
```ps
docker build -t app-backend .
docker run -dp 8090:8090 app-backend
```