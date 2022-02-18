const { authenticate } = require("ldap-authentication");
const twofactor = require("node-2fa");
const express = require("express");
const { connectDB } = require("./db");
const { getUserByName, saveUser } = require("./db/query");

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
  try {
    // connecter à notre ad
    user = await authenticate({
      ldapopts: { url: "ldap://192.168.0.150" },
      // adminDn: "cn=read-only-admin,dc=clin,dc=local",
      // adminPassword: "Vqatqbpp1954",
      userDn: "cn=paul,ou=ldap,dc=clin,dc=local",
      userPassword: "Azerty1234",
      userSearchBase: "dc=clin,dc=local",
      usernameAttribute: "cn",
      username: "paul",
    });
  } catch (error) {
    console.log(error);
  }

  console.Log(user);

  if (!user)
    return res.status(401).json({
      error:
        "Nous n'avons pas trouvé d'utilisateurs avec les identifiants fournies",
      user: null,
    });

  // bdd pour 2FA
  let userRetrieved = await getUserByName(db, user.user.displayName);
  if (!userRetrieved) {
    const newSecret = twofactor.generateSecret({
      name: "MSPR",
      account: user.user.displayName,
    });
    const data = {
      name: user.user.displayName,
      secret: newSecret.secret,
      uri: newSecret.uri,
      qr: newSecret.qr,
    };
    userRetrieved = await saveUser(db, data);
  }

  console.log({ userRetrieved });

  res.json({ user });
});

// app.get("/token", (req, res) => {
//   const newToken = twofactor.generateToken(newSecret.secret);
//   console.log(newToken);
//   res.json(newToken);
// });

// app.get("/verify/token/:userId/:token", (req, res) => {
//   const token = req.params.token;
//   data = twofactor.verifyToken(newSecret.secret, token);
//   console.log(data);
//   res.json(data);
// });

app.use((req, res) => {
  res.status(404).json({
    error: "Page non trouvé",
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running in port " + PORT);
});
