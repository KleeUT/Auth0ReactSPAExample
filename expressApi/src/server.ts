import express, { Request, Response } from "express";
import jwt from "express-jwt";
import jwks from "jwks-rsa";
const port = process.env.PORT || 8080;
const app = express();

const jwksCallback = jwks.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  // JWKS url from the Auth0 Tenant
  jwksUri: "https://klee-test.au.auth0.com/.well-known/jwks.json",
});

// Configure jwt check
var jwtCheck = jwt({
  secret: jwksCallback,
  // The same audience parameter needs to be used by the client to configure their Auth0 SDK
  audience: "TheSweetestAPI",
  // The Auth0 domain
  issuer: "https://klee-test.au.auth0.com/",
  // Has to be RS256 because that's what Auth0 uses to sign it's tokens
  algorithms: ["RS256"],
});

interface AuthenticatedRequest extends Request {
  user: any;
}

app.use((req, res, next) => {
  // allow calling from different domains
  res.set("Access-Control-Allow-Origin", "*");
  // allow authorization header
  res.set("Access-Control-Allow-Headers", "authorization");
  next();
});

// Allow requests from anyone to the /public route.
app.get("/public", (req: Request, res: Response) => {
  console.log("public");
  // res.set("Access-Control-Allow-Origin", "*");
  res.json({ hello: "world" });
});

// Require authenticated requests to access the /private route.
app.get("/private", jwtCheck, (req: AuthenticatedRequest, res: Response) => {
  // jwtCheck adds a user property with the payload from a valid JWT
  console.log(req.user);
  return res.json({
    secrets: [
      `You're ${JSON.stringify(req.user)}`,
      "          ... I'm Batman!",
    ],
  });
});

// Start the express server.
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
