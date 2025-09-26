import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export function configurePassport(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://vibeathon-back.onrender.com/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const update = {
            $set: {
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              photoUrl: profile.photos?.[0]?.value,
              role: "teacher",
            },
          };
          if (refreshToken) {
            update.$set.refreshToken = refreshToken;
          }
          const user = await User.findOneAndUpdate(
            { googleId: profile.id },
            update,
            { upsert: true, new: true }
          );
          return done(null, { dbUserId: user._id.toString(), accessToken });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((sessionUser, done) => done(null, sessionUser));
  passport.deserializeUser(async (sessionUser, done) => {
    try {
      const user = await User.findById(sessionUser.dbUserId);
      if (!user) return done(null, false);
      const userWithToken = user.toObject ? user.toObject() : { ...user };
      userWithToken.accessToken = sessionUser.accessToken;
      done(null, userWithToken);
    } catch (err) {
      done(err, null);
    }
  });
}
