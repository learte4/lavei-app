import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { users } from "../shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    }
  }
}

const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).limit(1);
}

async function getUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id)).limit(1);
}

async function getUserByGoogleId(googleId: string) {
  return db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
}

export function setupAuth(app: Express) {
  const store = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true,
    tableName: "sessions"
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const [user] = await getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          if (!user.password) {
            return done(null, false, { message: "Esta conta usa login social. Por favor, entre com Google." });
          }
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          return done(null, {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const firstName = profile.name?.givenName;
            const lastName = profile.name?.familyName;
            const profileImageUrl = profile.photos?.[0]?.value;

            if (!email) {
              return done(new Error("Email não disponível na conta Google"));
            }

            let [user] = await getUserByGoogleId(googleId);

            if (!user) {
              const [existingUser] = await getUserByEmail(email);
              if (existingUser) {
                const [updated] = await db
                  .update(users)
                  .set({ 
                    googleId, 
                    firstName: firstName || existingUser.firstName,
                    lastName: lastName || existingUser.lastName,
                    profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
                    updatedAt: new Date() 
                  })
                  .where(eq(users.id, existingUser.id))
                  .returning();
                user = updated;
              } else {
                const [newUser] = await db
                  .insert(users)
                  .values({
                    email,
                    googleId,
                    firstName,
                    lastName,
                    profileImageUrl,
                  })
                  .returning();
                user = newUser;
              }
            }

            return done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
            });
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      const [existingUser] = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }

      const hashedPassword = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
        })
        .returning();

      req.login(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        (err) => {
          if (err) return next(err);
          res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  app.get("/api/login", (_req, res) => {
    res.status(400).json({ message: "Use POST /api/login com email e password" });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Email ou senha incorretos" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    res.json(req.user);
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { 
      scope: ["profile", "email"] 
    }));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
};
