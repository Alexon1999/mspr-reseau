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
  // connecter à notre ad
  let user = await authenticate({
    ldapOpts: { url: "ldap://ldap.forumsys.com" },
    userDn: "uid=gauss,dc=example,dc=com",
    userPassword: "password",
    userSearchBase: "dc=example,dc=com",
    usernameAttribute: "uid",
    username: "gauss",
  });
  console.log(user);
  if (!user)
    return res.status(401).json({
      error:
        "Nous n'avons pas trouvé d'utilisateurs avec les identifiants fournies",
      user: null,
    });

  res.json({ user: true });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Page non trouvé",
  });
});

app.listen(5000, () => {
  console.log("Server running in port 5000");
});
