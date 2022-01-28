const { authenticate } = require("ldap-authentication");
const express = require("express");
const app = express();

app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile("./public/index.html");
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

  res.json({ user: user });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Page non trouvé",
  });
});

app.listen(5000, () => {
  console.log("Server running in port 5000");
});
