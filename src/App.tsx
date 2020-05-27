import React, { useState } from "react";
import "./App.css";

import { Auth0Client, Auth0ClientOptions } from "@auth0/auth0-spa-js";

const configureAuth0Client = (): Auth0Client => {
  console.log("Making new client");
  const auth0Config: Auth0ClientOptions = {
    domain: "klee-test.au.auth0.com",
    client_id: "wwk4gzlOJENxSd97zZtbsxJp5qQq4oI3",
  };
  return new Auth0Client(auth0Config);
};

function useAuth0(): {
  login: () => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  getUser: () => Promise<void>;
  userData: string;
  gravatar: string;
} {
  // The state needed to show the user is logged in.
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [auth0Client, setAuth0Client] = useState<Auth0Client>();
  const [userData, setUserData] = useState("Nothing Yet");
  const [gravatar, setGravatar] = useState("");

  // To  avoid creating a new instance of the client on each render
  if (!auth0Client) {
    setAuth0Client(configureAuth0Client());
  }

  async function login(): Promise<void> {
    try {
      // Wait for Auth0 to do the OIDC work for us.
      await auth0Client?.loginWithPopup();
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
  return {
    login,
    logout,
    isLoggedIn,
    getUser,
    userData,
    gravatar,
  };
}

function App() {
  const auth = useAuth0();
  return (
    <div className="App">
      {/* Buttons for log in and log out functionality */}
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
    </div>
  );
}

export default App;
