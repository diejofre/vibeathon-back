import { google } from "googleapis";

export async function getAccessTokenFromRefresh(refreshToken) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // callback URL isn't required for refresh, but OAuth2 client needs consistency
    "http://localhost:3000/auth/google/callback"
  );
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  // credentials contains access_token and expiry_date
  return credentials.access_token;
}
