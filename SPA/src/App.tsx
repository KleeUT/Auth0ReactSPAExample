import React, { useState } from "react";
import "./App.css";

import createClient, { Auth0Client, Auth0ClientOptions } from "@auth0/auth0-spa-js";

const auth0Config: Auth0ClientOptions = {
  domain: "klee-test.au.auth0.com",
  client_id: "wwk4gzlOJENxSd97zZtbsxJp5qQq4oI3",
  audience: "TheSweetestAPI",
};

const configureAuth0Client = (): Auth0Client => {
  console.log("Making new client");
  return new Auth0Client(auth0Config);
};


async function clientMaker(): Promise<Auth0Client>{
  return createClient(auth0Config);
}

function useAuth0(): {
  login: () => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  getUser: () => Promise<void>;
  userData: string;
  gravatar: string;
  getAccessToken: () => Promise<void>;
  silentClient: () => Promise<void>;
  accessToken: string;
} {
  // The state needed to show the user is logged in.
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [auth0Client, setAuth0Client] = useState<Auth0Client>();
  const [userData, setUserData] = useState("Nothing Yet");
  const [gravatar, setGravatar] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // To  avoid creating a new instance of the client on each render
  if (!auth0Client) {
    setAuth0Client(configureAuth0Client());
  }

  async function silentClient() : Promise<void>{
    const c = await clientMaker();
    setAuth0Client(c);
    const a = await c.isAuthenticated()
    const data = await c?.getUser();
    // Make the user data into a string so we can dump it to the screen.
    setUserData(JSON.stringify(data));
    // Set the source for the user avatar
    // setGravatar(data.picture);
    setLoggedIn(a);

  }

  async function login(): Promise<void> {
    try {
      // Wait for Auth0 to do the OIDC work for us.
      await auth0Client?.loginWithPopup({extraP:"this is extra", login_hint:"ITs me mario"});
      // Update the state to represent that the user has logged in.
      setLoggedIn(true);
    } catch (e) {
      // If something goes wrong lets put it out to the console.
      console.error(e);
    }
  }

  function logout(): void {
    try {
      // Call the client to log the user out.
      auth0Client?.logout();
      // Update the state to represent the user is logged out.
      setLoggedIn(false);
      setUserData("All Logged out");
      setGravatar("");
    } catch (e) {
      // If something goes wrong put it out to the console.
      console.error(e);
    }
  }
  async function getUser(): Promise<void> {
    try {
      // Gets the data about the user from the id_token
      const data = await auth0Client?.getUser();
      // Make the user data into a string so we can dump it to the screen.
      setUserData(JSON.stringify(data));
      // Set the source for the user avatar
      setGravatar(data.picture);
    } catch (e) {
      // If something goes wrong put it out to the console.
      console.error(e);
    }
  }

  async function getAccessToken(): Promise<void> {
    try {
      const token = await auth0Client?.getTokenSilently({silent:"no one is going to talk", extra:"Luigi Mario"});
      setAccessToken(token);
    } catch (e) {
      console.log(e);
    }
  }
  return {
    login,
    logout,
    isLoggedIn,
    getUser,
    userData,
    gravatar,
    accessToken,
    getAccessToken,
    silentClient
  };
}

function App() {
  const auth = useAuth0();
  return (
    <div className="App">
      {/* Buttons for log in and log out functionality */}
      <button onClick={auth.silentClient}>Silent Login?</button>
      <button onClick={auth.login}>Login</button>
      <button onClick={auth.logout}>Logout</button>
      {/* Displaly if the user is logged in */}
      <p>Is Logged In : {auth.isLoggedIn ? "yes" : "no"}</p>
      {/* Button to get the users data */}
      <button onClick={auth.getUser}>Get User</button>
      {/* Display user data */}
      <p>User Data from id_token : {auth.userData}</p>
      {/* Display user avatar */}
      <img src={auth.gravatar} alt="Avatar from Gravatar" />
      <hr />
      <button onClick={auth.getAccessToken}>Get Access Token</button>
      <p>{auth.accessToken}</p>
    </div>
  );
}

export default App;
