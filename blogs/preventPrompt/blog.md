In [this blog]() I mentioned that the consent prompt can be removed for users logging in. This prompt makes a lot of sense if you're providing an API that can be consumed by a third party application. For example a user allowing facebook access to their email contacts. For this case though where a user is logging into an application which wants access to a first party API the prompt makes for a jarring login experience.

# Prevent Auth0 consent prompt

To prevent the consent prompt the api needs to allow it and application needs to be running on a trusted domain. A trusted domain is a domain that is configured in the Auth0 Applications `Allowed Callback URLs` property. The exception to this is `localhost`. Auth0 _never_ allows `localhost` to be a trusted domain because any application could be running on `localhost`. The standard advice from Auth0 is to map a url to `localhost` in the local machines host file.

Edit the hosts file to add `local.auth` as a mapping to `localhost`. This file can be found in the following locations. [More info on editing hosts file](https://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/)

Run the code and navigate to `http://local.auth:3000`.

![Secure Origin required error](https://dev-to-uploads.s3.amazonaws.com/i/2q58ef87z76dwrdt42cl.png)

With previous versions of the Auth0 SDKs this solution worked out of the box to allow local development, no consent prompt without needing to use `localhost` explicitly. The new Auth0 SPA SDK uses the web crypto api which refuses to run on any domain that isn't https or `localhost` (see [Auth0 SPA SDK FAQ](https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin)). Dang! This means that to test the the login flow without the seeing the consent prompt the code needs to be deployed to a server running https and that's not what `create-react-app` does by default. Fortunately it turns out that the good people at `create-react-app` have thought ahead and [provided a way to run the development server with https](https://create-react-app.dev/docs/using-https-in-development/). To do this set the environment variable `HTTPS` to `true` in the console where the development server is running:

- on Windows (Powershell) `$env:HTTPS = "true"`
- on Windows (CMD) `set HTTPS=true"`
- on Mac/Linus `HTTPS=true`
  then `npm start`.

Now navigate to `https://local.auth:3000`. The browser will show an error page.

![Self signed cert error](https://dev-to-uploads.s3.amazonaws.com/i/h38jr1fi6w2i1vex67wj.png)

Since the self signed certificate is expected accept the risk and continue to the page. The page will now render since web crypto is able to run on the https url. Click login and the login popup will display an error saying that the call back url is not allowed. To fix this update the configuration for the Application in Auth0.

![The callback is not allowed error message](https://dev-to-uploads.s3.amazonaws.com/i/waqe6x3f7eoi3ijq9a7j.png)

## Configure Auth0

### Update the Auth0 application config

In the Auth0 Application section find the Application matching the `client_id` parameter used in the React app. In that Application's settings add `https://local.auth:3000` to the `Allowed Callback URLs`, `Allowed Logout URLs`, `Allowed Web Origins` and `Allowed Origins (CORS)` and save the configuration.

![Application configurations updated](https://dev-to-uploads.s3.amazonaws.com/i/ssbpbvixbze1arsts64p.png)

> Make sure not to include a `/` at the end of hte configured origin url or the login pop up will display an error with these details.
> ![Origin now allowed error message](https://dev-to-uploads.s3.amazonaws.com/i/5wqtwp2jo64wzw1eoi75.png)

### Update the Auth0 API config

In the Auth0 console navigate to the APIs page and find the API that matches the `audience` parameter being used in the React app. In that APIs settings find the `Allow Skipping User Consent` setting and make sure it is enabled. This will mean that this API will allow the skipping of the consent prompt for configured applications.
![Allow Skipping User Consent flag enabled](https://dev-to-uploads.s3.amazonaws.com/i/g8tmlho99tywy8drdbap.png)

## Test login again

Go back to the app running on `https://local.auth:3000`, log out and sign up as a new user to see the experience without requiring the consent prompt.

# The other option

There is another option if changing the hosts file sounds like too much work or not an option. That is to deploy the code to an available web server that is serving pages over https. There are a myriad of hosting provides that are happy to hep you set this up.

---

Cover image from [Unsplash](https://unsplash.com/photos/5_UkFNpURas)
