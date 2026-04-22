ARG DB_MONGO_VERSION

FROM mongo:${DB_MONGO_VERSION}

ENTRYPOINT \
  mongod --port $MONGO_REPLICA_PORT --replSet rs0 --bind_ip 0.0.0.0 & MONGOD_PID=$!; \

  INIT_REPL_CMD="db.isMaster().primary || rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '$MONGO_REPLICA_HOST:$MONGO_REPLICA_PORT' }]})" \
  INIT_USER_CMD="db.getUser('$MONGO_INITDB_ROOT_USERNAME') || db.createUser({ user: '$MONGO_INITDB_ROOT_USERNAME', pwd: '$MONGO_INITDB_ROOT_PASSWORD', roles: [ 'root' ] })"; \
  INIT_DB_CMD="db.getSiblingDB('$MONGO_INITDB_DATABASE').getCollectionNames().length == 0 && db.getSiblingDB('$MONGO_INITDB_DATABASE').createCollection('createtest')"; \
  \

  until ($MONGO_COMMAND admin --port $MONGO_REPLICA_PORT --eval "$INIT_REPL_CMD" && \
         $MONGO_COMMAND admin --port $MONGO_REPLICA_PORT --eval "$INIT_USER_CMD" && \
         $MONGO_COMMAND admin --port $MONGO_REPLICA_PORT --eval "$INIT_DB_CMD"); do sleep 1; done; \
  \

  echo "REPLICA SET ONLINE"; wait $MONGOD_PID;