// https://www.npmjs.com/package/ldap-authentication
const { authenticate } = require("ldap-authentication");
// https://www.npmjs.com/package/node-2fa
const twofactor = require("node-2fa");

const express = require("express");
const { connectDB } = require("./db");
const { getUserByName, saveUser, getUserById } = require("./db/query");

const db = connectDB();

const app = express();

app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.post("/login", async (req, res) => {
  let user = null;
  const userData = req.body;
  const keys = Object.keys(userData);

  if (!keys.includes("password") && !keys.includes("name"))
    return res.status(401);

  try {
    // connecter à notre ad

    user = await authenticate({
      ldapopts: { url: "ldap://192.168.0.150" },
      // adminDn: "cn=read-only-admin,dc=clin,dc=local",
      // adminPassword: "Vqatqbpp1954",
      userDn: $`cn=${userData.name},ou=ldap,dc=clin,dc=local`,
      userPassword: userData.password,
      userSearchBase: "dc=clin,dc=local",
      usernameAttribute: "cn",
      username: userData.name,
    });
  } catch (error) {
    // console.log(error);
  }

  // console.log(user);

  if (!user)
    return res.status(401).json({
      error:
        "Nous n'avons pas trouvé d'utilisateurs avec les identifiants fournies",
      user: null,
    });

  // bdd pour 2FA
  let userRetrieved = await getUserByName(db, user.displayName);
  if (!userRetrieved) {
    const newSecret = twofactor.generateSecret({
      name: "MSPR",
      account: user.displayName,
    });
    const data = {
      name: user.displayName,
      secret: newSecret.secret,
      uri: newSecret.uri,
      qr: newSecret.qr,
    };
    userRetrieved = await saveUser(db, data);

    // first time connection, send the link for setup 2FA with google authenticator
    // we use a qr code to add into google authenticator
    return res.json({
      user,
      id: userRetrieved.id,
      twoFAInfo: userRetrieved,
      twoFAFirstTime: true,
    });
  }

  res.json({ user, id: userRetrieved.id, twoFAInfo: userRetrieved });
});

app.get("/verify/token/:userId/:token", async (req, res) => {
  const userId = req.params.userId;
  const token = req.params.token;
  const user = await getUserById(db, userId);
  const data = twofactor.verifyToken(user.secret, token);

  if (data == null)
    return res.status(401).json({ message: "Ce token n'existe pas" });

  if (data.delta == 0) return res.json({ message: "Connecté avec succès" });

  res.status(401).json({ message: "Vérifiez que Votre Token n'a pas expiré" });
});

// Generate Manually tokens
// app.get("/token", (req, res) => {
//   const newToken = twofactor.generateToken(newSecret.secret);
//   console.log(newToken);
//   res.json(newToken);
// });

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Page non trouvé",
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running in port " + PORT);
});
