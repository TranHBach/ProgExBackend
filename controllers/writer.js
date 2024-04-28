const supabase = require("../utils/createClient");

exports.addBanking = async (req, res, next) => {
  const { UserID, BankNumber, BankName, AccountHolder } = req.body;
  if (!/^\d+$/.test(BankNumber)) {
    return res
      .status(400)
      .json({ success: false, error: "BankNumber must contain only digits" });
  }
  const { data, error } = await supabase
    .from("Writers")
    .insert([{ UserID, BankNumber, BankName, AccountHolder }]);
  if (error) {
    console.error("Duplicate account", error);
    return res
      .status(500)
      .json({ success: false, error: "The bank account already exists" });
  }
  return res.status(200).json({ message: true });
};

exports.addArticle = async (req, res, next) => {
  const {
    UserID,
    ArticleID,
    TotalVote,
    Title,
    Content,
    Duration,
    Serving,
    Image,
  } = req.body;
  const { data, error } = await supabase.from("Articles").insert([
    {
      UserID,
      ArticleID,
      Title,
      TotalVote,
      Content,
      Duration,
      Serving,
      Image,
    },
  ]);
  if (error) {
    console.error("error", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
  return res.status(200).json({ message: true });
};
