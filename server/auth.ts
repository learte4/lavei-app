import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { userStore } from "./userStore";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      role: string;
    }
  }
}

const PostgresSessionStore = connectPg(session);
const defaultRedirectUris = "lavei://,exp://127.0.0.1:8081";
const allowedRedirectUris = (process.env.ALLOWED_REDIRECT_URIS ?? defaultRedirectUris)
  .split(",")
  .map((uri) => uri.trim())
  .filter(Boolean);

const resolveRedirectUri = (candidate?: string) => {
  if (!candidate) {
    return allowedRedirectUris[0] ?? "lavei://";
  }
  if (allowedRedirectUris.includes(candidate)) {
    return candidate;
  }
  return null;
};

const createOAuthState = () => randomBytes(16).toString("hex");

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

async function getUserByEmail(email: string) {
  return userStore.findByEmail(email);
}

async function getUserById(id: string) {
  return userStore.findById(id);
}

async function getUserByGoogleId(googleId: string) {
  return userStore.findByGoogleId(googleId);
}

export function setupAuth(app: Express) {
  console.log("Configuring authentication routes...");
  const useDatabaseSessions = Boolean(process.env.DATABASE_URL);
  let store: session.Store;

  if (useDatabaseSessions) {
    const { pool } = require("./db");
    store = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "sessions",
    });
  } else {
    console.warn("DATABASE_URL não definido. Usando MemoryStore para sessões (apenas dev/teste).");
    store = new session.MemoryStore();
  }
  
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
          const user = await getUserByEmail(email);
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
            role: user.role,
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

            let user = await getUserByGoogleId(googleId);

            if (!user) {
              const existingUser = await getUserByEmail(email);
              if (existingUser) {
                user = await userStore.updateUser(existingUser.id, {
                  googleId,
                  firstName: firstName || existingUser.firstName,
                  lastName: lastName || existingUser.lastName,
                  profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
                });
              } else {
                user = await userStore.createUser({
                  email,
                  googleId,
                  firstName,
                  lastName,
                  profileImageUrl,
                });
              }
            }

            return done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              role: user.role,
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
      const user = await getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role = 'client' } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      const validRoles = ['client', 'provider', 'partner', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Tipo de usuário inválido" });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await userStore.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      req.login(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        },
        (err) => {
          if (err) return next(err);
          res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
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
    const initiateGoogleOAuth: RequestHandler = (req, res, next) => {
      const rawRedirectUri = typeof req.query.redirect_uri === "string" ? req.query.redirect_uri : undefined;
      const redirectUri = resolveRedirectUri(rawRedirectUri);
      if (!redirectUri) {
        return res.status(400).json({ message: "redirect_uri não permitido" });
      }
      const state = createOAuthState();
      (req.session as any).redirectUri = redirectUri;
      (req.session as any).oauthState = state;
      req.session.save((err) => {
        if (err) {
          console.error("Erro ao persistir sessão OAuth:", err);
          return res.status(500).json({ message: "Não foi possível iniciar o login com Google" });
        }
        return passport.authenticate("google", {
          scope: ["profile", "email"],
          state,
        })(req, res, next);
      });
    };

    const validateOAuthState: RequestHandler = (req, res, next) => {
      const expectedState = (req.session as any).oauthState;
      const receivedState = typeof req.query.state === "string" ? req.query.state : undefined;
      if (!expectedState || !receivedState || expectedState !== receivedState) {
        console.warn("OAuth state inválido recebido do Google");
        return res.status(400).send("Invalid OAuth state");
      }
      return next();
    };

    app.get("/api/auth/google", initiateGoogleOAuth);

    app.get(
      "/api/auth/google/callback",
      validateOAuthState,
      passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
      (req, res) => {
        console.log("Google callback success for user:", req.user);
        const storedRedirect = typeof (req.session as any).redirectUri === "string" ? (req.session as any).redirectUri : undefined;
        const redirectUri = resolveRedirectUri(storedRedirect) ?? "lavei://";
        (req.session as any).redirectUri = undefined;
        (req.session as any).oauthState = undefined;
        console.log("Redirecionando para:", redirectUri);
        
        res.send(`
          <html>
            <head>
              <title>Autenticado - Lavei</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script>
                window.onload = function() {
                  // Tenta redirecionar imediatamente
                  window.location.href = "${redirectUri}";
                  
                  // Fallback para fechar a janela se for popup
                  setTimeout(function() {
                    if (window.opener) {
                      // window.close(); // Comentado para evitar fechar antes do redirect
                    }
                  }, 2000);
                };
              </script>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100vh; 
                  margin: 0; 
                  background-color: #f0b100; 
                  color: #071121; 
                }
                .container { text-align: center; padding: 20px; }
                .btn { 
                  display: inline-block; 
                  padding: 12px 24px; 
                  background-color: #071121; 
                  color: #ffffff; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  margin-top: 20px; 
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Login realizado!</h1>
                <p>Se o app não abrir automaticamente, clique abaixo:</p>
                <a href="${redirectUri}" class="btn">Voltar para o App</a>
              </div>
            </body>
          </html>
        `);
      }
    );

    app.get("/api/auth/google/failure", (_req, res) => {
      res.status(401).json({
        success: false,
        message: "Falha na autenticação com Google"
      });
    });
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
};
