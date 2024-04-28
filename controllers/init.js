exports.init = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  jwt.verify(token, jwtSecret, (err, decodedToken) => {
    if (err) {
      return res.status(422).json({ message: "Token expired" });
    }
    const Username = decodedToken.Username;
    const Password = decodedToken.Password;
    supabase
      .from("Users")
      .select()
      .eq("Username", Username)
      .limit(1)
      .then((result) => {
        if (result.data.length == 0) {
          return res.status(422).json({ message: "User not found" });
        }
        const returnedUser = result.data[0];
        const hashedPassword = returnedUser.Password;
        if (Password == hashedPassword) {
          return res.status(200).json({ ...returnedUser });
        }
        return res.status(422).json({ message: "Incorrect Password" });
      });
  });
};

exports.getEverything = async (req, res, next) => {};
