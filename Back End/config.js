module.exports = {
  // App config
  node_port: process.env.SERVER_PORT ||4000,

  // Database config
  // "database": "mongodb+srv://karangadhiya19:<db_password>@cluster0.pwdzu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  database:
    "mongodb+srv://karangadhiya19:C3eIC6cP4tvhwImr@cluster0.t6udc.mongodb.net/test?retryWrites=true&w=majority",

  // JWT
  ACCESS_TOKEN_SECRET_KEY: "karanawsjwt",
  REFRESH_TOKEN_SECRET_KEY: "karanawsrefresh",
  ACCESS_TOKEN_EXPIRE_TIME: 1000 * 60 * 10, // miliseconds * seconds * minutes * hours * days

  // HTTP Status
  OK_STATUS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  MEDIA_ERROR_STATUS: 415,
  VALIDATION_FAILURE_STATUS: 417,
  DATABASE_ERROR_STATUS: 422,
  INTERNAL_SERVER_ERROR: 500,
};
