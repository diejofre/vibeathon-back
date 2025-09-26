export function authFailure(req, res) {
  res.send("Fallo en autenticación");
}

export function postLogout(req, res) {
  req.logout({ keepSessionInfo: false }, (err) => {
    if (err) return res.status(500).json({ message: "Error logging out" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
}

export function me(req, res) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  const userProfile = {
    id: req.user.googleId,
    name: req.user.name,
    email: req.user.email,
    picture: req.user.photoUrl,
  };
  return res.json(userProfile);
}
