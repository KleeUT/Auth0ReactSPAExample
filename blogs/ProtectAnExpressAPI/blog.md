Following on from the previous post where we got a JWT access token from Auth0. This post will go over how to secure an Express API, so tha certain endpoints can only be accessed by authenticated users.

# Create an express API.

## Set up the project

Before starting there is a little bit of

In a new folder run

`npm init -y` - To add a `package.json` file to the folder

Add Typescript
`npm i --save-dev typescript @types/express`

Add a `tsconfig.json` file with this contents.

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react"
  },
  "include": ["src"]
}
```

Add a build script to the `package.json` file.

```json
  "scripts": {
    "build": "tsc",
  },
```

## Set up express

Run `npm i express` to add the express package that we'll use to create the web server.

Make a new file `src/server.ts`

Add the following code to the `src/server.ts` file to set up a server with a `/public` endpoint that can be accessed with no authentication.

```typescript
import express, { Request, Response } from "express";
const port = process.env.PORT || 8080;
const app = express();

app.use((req, res, next) => {
  // allow calling from different domains
  res.set("Access-Control-Allow-Origin", "*");
  // allow authorization header
  res.set("Access-Control-Allow-Headers", "authorization");
  next();
});

// Allow requests from anyone to the /public route.
app.get("/public", (req: Request, res: Response) =>
  res.json({ hello: "world" })
);

// Start the express server.
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

## Adding an authenticated endpoint

With the basic server structure set up lets add an endpoint that will be protected. Lest give this an very original path of `/protected`

Install some extra packages to help take care of the undifferentiated heavy lifting.

The (`express-jwt`)[https://github.com/auth0/express-jwt] package that will validate the JWT access token provided and the [`jwks-rsa`](https://github.com/auth0/node-jwks-rsa) package that will handle fetching the correct public key to use when validating the token.

`npm i express-jwt jwks-rsa`

Import these 2 packages into the `server.ts` file.

```typescript
import jwt from "express-jwt";
import jwks from "jwks-rsa";
```

Configure the JWKS callback to fetch the JWKS data from Auth0.

```typescript
const jwksCallback = jwks.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  // JWKS url from the Auth0 Tenant
  jwksUri: "https://klee-test.au.auth0.com/.well-known/jwks.json",
});
```

The JWKS endpoint can be found in the application under Advanced Settings -> Endpoints

Configure the JWT middleware to use teh jwks callback, accept tokens with the correct audience and issuer parameters and, limit the signing methods to `RS256` to avoid potential JWT exploits.

```typescript
var requireJWTAuthentication = jwt({
  secret: jwksCallback,
  // The same audience parameter needs to be used by the client to configure their Auth0 SDK
  audience: "TheSweetestAPI",
  // The Auth0 domain
  issuer: "https://klee-test.au.auth0.com/",
  // Has to be RS256 because that's what Auth0 uses to sign it's tokens
  algorithms: ["RS256"],
});
```

Finally add a protected endpoint with some secret information making use of the JWT middleware to ensure that only authenticated parties can access it.
The middleware will add a `user` property to the request parameter that includes the decoded body of a valid token.

```typescript
app.get(
  "/private",
  requireJWTAuthentication,
  (req: AuthenticatedRequest, res: Response) => {
    // requireJWTAuthentication adds a user property with the payload from a valid JWT
    return res.json({
      secrets: [
        `You're ${JSON.stringify(req.user)}`,
        "          ... I'm Batman!",
      ],
    });
  }
);
```

### Build and run the server

Add or update these scripts in the `package.json` file to speed up building and running of the server.

```json
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  },
```

run `npm run build` then `npm start` to start the server.

# Testing the endpoints

With the sever running the next step is to test the endpoints. To do this open up [Postwoman](https://postwoman.io). Postwoman is a service that can be used to test APIs from within the browser.

Fist try to connect to the `http://localhost:8080/public/` endpoint. The request should return a `200` status with hello world body.
![200 response from get request to /public in Postwoman](https://dev-to-uploads.s3.amazonaws.com/i/q5v018dqb19fkgcbxo9w.png)

Next try the same thing with the `http://localhost:8080/private/` endpoint. The request should return with a `401` status and a body stating `UnauthorizedError: No authorization token was found`.

![401 response from get request to /private with no auth in Postwoman](https://dev-to-uploads.s3.amazonaws.com/i/l0tmlpjzxhr4jw4l4jod.png)

The final step is to get a token. Use the SPA application from [the previous blog in this series](https://dev.to/kleeut/getting-a-jwt-access-token-from-auth0-3e81). After logging in there and getting the token copy it out of the webpage. Back in Postwoman change the Authorization to be Bearer auth and paste the token to be used as the bearer authentication.

![Paste the token into Postwoman as a bearer token](https://dev-to-uploads.s3.amazonaws.com/i/b1t5f6444lahead004ba.png)

Now when the request is sent the response will return with a `200` status and a body revealing the secrets.

![200 response from get request to /private with auth in Postwoman](https://dev-to-uploads.s3.amazonaws.com/i/crvw33tgie3860br5wox.png)

If you tamper with the JWT and send the request again the request will return with a `401` status and a message stating `UnauthorizedError: invalid token`.
![401 response from /private endpoint after modifying the token](https://dev-to-uploads.s3.amazonaws.com/i/41fgf1gji9ffp19aym8g.png)

---

Cover photo by Gabriel Wasylko on Unsplash
